import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { CognitoService } from './cognito.service';

@Injectable()
export class CognitoAuthGuard implements CanActivate {
  constructor(private readonly cognitoService: CognitoService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader =
      request.headers['authorization'] || request.headers['Authorization'];

    if (!authHeader || Array.isArray(authHeader)) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header format');
    }

    try {
      const payload = await this.cognitoService.verify(token);

      (request as any).user = {
        sub: payload.sub,
        payload,
      };

      return true;
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}


