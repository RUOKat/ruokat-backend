import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { Request } from 'express';

interface CognitoAccessTokenPayload {
  sub: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

@Injectable()
export class CognitoAuthGuard implements CanActivate {
  private readonly verifier;

  constructor(private readonly configService: ConfigService) {
    this.verifier = CognitoJwtVerifier.create({
      userPoolId: this.configService.get<string>('COGNITO_USER_POOL_ID')!,
      tokenUse: 'access',
      clientId: this.configService.get<string>('COGNITO_CLIENT_ID'),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'] || request.headers['Authorization'];

    if (!authHeader || Array.isArray(authHeader)) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header format');
    }

    try {
      const payload = (await this.verifier.verify(
        token, {
          tokenUse: 'access',
          clientId: this.configService.get<string>('COGNITO_CLIENT_ID')!,
        }
      )) as CognitoAccessTokenPayload;

      (request as any).user = {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        payload,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}


