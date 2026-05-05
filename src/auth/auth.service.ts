import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, fullName, password } = signupDto;

    // Check if user exists
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.usersRepository.create({
      email,
      fullName,
      password: hashedPassword,
      isAdmin: false,
    });

    await this.usersRepository.save(user);

    // Return token without password
    return this.generateToken(user);
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user with password field
    const user = await this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'fullName', 'password', 'isAdmin', 'createdAt'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Return token without password
    return this.generateToken(user);
  }

  async socialLogin(
    email: string,
    fullName: string,
    provider: 'google' | 'facebook',
    providerId: string,
    avatarUrl?: string,
  ) {
    let user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Create new user with social provider
      user = this.usersRepository.create({
        email,
        fullName,
        password: null, // Social users don't have password
        isAdmin: false,
        [provider === 'google' ? 'googleId' : 'facebookId']: providerId,
        avatarUrl: avatarUrl || null,
      });
      await this.usersRepository.save(user);
    } else {
      // Update existing user with provider ID if not already set
      if (provider === 'google' && !user.googleId) {
        user.googleId = providerId;
      } else if (provider === 'facebook' && !user.facebookId) {
        user.facebookId = providerId;
      }
      if (avatarUrl) {
        user.avatarUrl = avatarUrl;
      }
      await this.usersRepository.save(user);
    }

    return this.generateToken(user);
  }

  async updateProfile(
    userId: number,
    updates: { fullName?: string; avatarUrl?: string },
  ) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    if (updates.fullName) user.fullName = updates.fullName;
    if (typeof updates.avatarUrl !== 'undefined')
      user.avatarUrl = updates.avatarUrl;

    await this.usersRepository.save(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl || null,
        isAdmin: user.isAdmin,
      },
    };
  }

  getUserIdFromToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      // payload.sub expected to be user id
      return payload.sub as number;
    } catch (err) {
      return null;
    }
  }

  private generateToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: (user as any).avatarUrl || null,
        isAdmin: user.isAdmin,
      },
    };
  }
}
