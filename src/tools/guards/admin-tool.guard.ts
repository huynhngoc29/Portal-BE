import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class AdminToolGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();

    const headerValue = request.headers.authorization;
    const authorization = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;
    const token = authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    const userId = this.authService.getUserIdFromToken(token);
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }

    const caller = await this.authService.findUserById(userId);
    if (!caller || !caller.isAdmin) {
      throw new UnauthorizedException('Not authorized');
    }

    return true;
  }
}
