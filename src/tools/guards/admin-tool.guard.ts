import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminToolGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();

    const configuredAdminKey = this.configService.get<string>('ADMIN_TOOL_KEY');
    const headerValue = request.headers['x-admin-key'];
    const adminKey = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    if (!configuredAdminKey) {
      throw new UnauthorizedException('ADMIN_TOOL_KEY is not configured');
    }

    if (!adminKey || adminKey !== configuredAdminKey) {
      throw new UnauthorizedException('Invalid admin key');
    }

    return true;
  }
}
