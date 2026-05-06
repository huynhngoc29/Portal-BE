import {
  Controller,
  Post,
  Body,
  Patch,
  Headers,
  BadRequestException,
  Get,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { SocialLoginDto } from './dto/social-login.dto';

type GoogleJwtPayload = {
  sub?: string;
  picture?: string;
};

type FacebookProfile = {
  id?: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
};

type SocialCallbackBody = {
  email?: string;
  name?: string;
  googleId?: string;
  facebookId?: string;
};

type UpdateProfileBody = {
  fullName?: string;
  avatarUrl?: string;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('social-login')
  async socialLogin(@Body() socialLoginDto: SocialLoginDto) {
    const { provider, email, fullName, idToken, picture } = socialLoginDto;
    // In production, verify idToken here using Google/Facebook API
    // For now, we'll trust the client (should be done server-side in production)
    let providerId = `${provider}_${Date.now()}`;

    let avatarUrl: string | undefined = undefined;

    if (provider === 'google' && idToken) {
      try {
        // decode JWT without verification to extract 'sub' claim
        const parts = idToken.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString('utf8'),
          ) as GoogleJwtPayload;
          if (payload && payload.sub) {
            providerId = payload.sub;
            if (payload.picture) avatarUrl = payload.picture;
          }
        }
      } catch {
        // fallback to timestamp-based id
        providerId = `${provider}_${Date.now()}`;
      }
    } else if (provider === 'facebook' && socialLoginDto.accessToken) {
      try {
        // Verify Facebook token and fetch user profile
        const facebookUrl = new URL('https://graph.facebook.com/me');
        facebookUrl.searchParams.set('fields', 'id,name,email,picture');
        facebookUrl.searchParams.set(
          'access_token',
          socialLoginDto.accessToken,
        );

        const facebookResponse = await fetch(facebookUrl);
        if (!facebookResponse.ok) {
          throw new Error(`Facebook API returned ${facebookResponse.status}`);
        }

        const facebookUser = (await facebookResponse.json()) as FacebookProfile;
        if (facebookUser && facebookUser.id) {
          providerId = facebookUser.id;
          if (
            facebookUser.picture &&
            facebookUser.picture.data &&
            facebookUser.picture.data.url
          ) {
            avatarUrl = facebookUser.picture.data.url;
          }
        }
      } catch (error) {
        console.error('Facebook token verification failed:', error);
        // Fallback to timestamp-based id if verification fails
        providerId = `${provider}_${Date.now()}`;
      }
    }

    // prefer picture passed from client if available
    if (!avatarUrl && picture) avatarUrl = picture;

    const normalizedEmail =
      email ||
      (provider === 'facebook'
        ? `fb_${providerId}@facebook.local`
        : `${providerId}@oauth.local`);

    return this.authService.socialLogin(
      normalizedEmail,
      fullName,
      provider,
      providerId,
      avatarUrl,
    );
  }

  // Admin endpoints
  @Get('admin/users')
  async listUsers(@Headers('authorization') authHeader: string) {
    if (!authHeader) throw new BadRequestException('Missing authorization');
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const userId = this.authService.getUserIdFromToken(token);
    if (!userId) throw new BadRequestException('Invalid token');
    // check admin
    const caller = await this.authService['usersRepository'].findOne({
      where: { id: userId },
    });
    if (!caller || !caller.isAdmin)
      throw new BadRequestException('Not authorized');
    return this.authService.listUsers();
  }

  @Patch('admin/users/:id')
  async adminUpdateUser(
    @Headers('authorization') authHeader: string,
    @Body() body: any,
  ) {
    if (!authHeader) throw new BadRequestException('Missing authorization');
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const userId = this.authService.getUserIdFromToken(token);
    if (!userId) throw new BadRequestException('Invalid token');
    const caller = await this.authService['usersRepository'].findOne({
      where: { id: userId },
    });
    if (!caller || !caller.isAdmin)
      throw new BadRequestException('Not authorized');
    const id = Number((body && body.id) || body?.userId || 0);
    if (!id) throw new BadRequestException('Invalid target id');
    const updates = { fullName: body.fullName, isAdmin: body.isAdmin };
    return this.authService.adminUpdateUser(id, updates);
  }

  @Delete('admin/users/:id')
  async adminDeleteUser(
    @Headers('authorization') authHeader: string,
    @Body() body: any,
  ) {
    if (!authHeader) throw new BadRequestException('Missing authorization');
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const userId = this.authService.getUserIdFromToken(token);
    if (!userId) throw new BadRequestException('Invalid token');
    const caller = await this.authService['usersRepository'].findOne({
      where: { id: userId },
    });
    if (!caller || !caller.isAdmin)
      throw new BadRequestException('Not authorized');
    const id = Number((body && body.id) || body?.userId || 0);
    if (!id) throw new BadRequestException('Invalid target id');
    return this.authService.adminDeleteUser(id);
  }

  @Post('google-callback')
  async googleCallback(@Body() body: SocialCallbackBody) {
    const { email, name, googleId } = body;
    return this.authService.socialLogin(
      email ?? '',
      name ?? '',
      'google',
      googleId ?? '',
    );
  }

  @Post('facebook-callback')
  async facebookCallback(@Body() body: SocialCallbackBody) {
    const { email, name, facebookId } = body;
    return this.authService.socialLogin(
      email ?? '',
      name ?? '',
      'facebook',
      facebookId ?? '',
    );
  }

  @Patch('profile')
  async updateProfile(
    @Headers('authorization') authHeader: string,
    @Body() body: UpdateProfileBody,
  ) {
    if (!authHeader) throw new BadRequestException('Missing authorization');
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const userId = this.authService.getUserIdFromToken(token);
    if (!userId) throw new BadRequestException('Invalid token');

    const { fullName, avatarUrl } = body;

    return this.authService.updateProfile(userId, {
      fullName,
      avatarUrl,
    });
  }

  @Post('profile/avatar')
  async uploadAvatar(
    @Headers('authorization') authHeader: string,
    @Body() body: { avatarData: string },
  ) {
    if (!authHeader) throw new BadRequestException('Missing authorization');
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const userId = this.authService.getUserIdFromToken(token);
    if (!userId) throw new BadRequestException('Invalid token');

    const { avatarData } = body;
    if (!avatarData) throw new BadRequestException('No avatar data provided');

    // avatarData is base64 encoded image (e.g., data:image/png;base64,...)
    return this.authService.updateProfile(userId, { avatarUrl: avatarData });
  }
}
