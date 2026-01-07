import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import {
  CognitoAccessTokenPayload,
  CognitoIdTokenPayload,
} from 'aws-jwt-verify/jwt-model';

@Injectable()
export class CognitoService {
  private readonly accessTokenVerifier;
  private readonly idTokenVerifier;

  constructor(private readonly configService: ConfigService) {
    this.accessTokenVerifier = CognitoJwtVerifier.create({
      userPoolId: this.configService.get<string>('COGNITO_USER_POOL_ID')!,
      tokenUse: 'access',
      clientId: this.configService.get<string>('COGNITO_CLIENT_ID'),
    });

    this.idTokenVerifier = CognitoJwtVerifier.create({
      userPoolId: this.configService.get<string>('COGNITO_USER_POOL_ID')!,
      tokenUse: 'id',
      clientId: this.configService.get<string>('COGNITO_CLIENT_ID'),
    });
  }

  async verify(token: string): Promise<CognitoAccessTokenPayload> {
    const payload = await this.accessTokenVerifier.verify(token, {
      tokenUse: 'access',
      clientId: this.configService.get<string>('COGNITO_CLIENT_ID')!,
    });
    return payload;
  }

  async verifyIdToken(token: string): Promise<CognitoIdTokenPayload> {
    const payload = await this.idTokenVerifier.verify(token, {
      tokenUse: 'id',
      clientId: this.configService.get<string>('COGNITO_CLIENT_ID')!,
    });
    return payload;
  }
}
