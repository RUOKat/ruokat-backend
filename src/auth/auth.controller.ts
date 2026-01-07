import {
  Controller,
  Delete,
  Get,
  Post,
  Req,
  UseGuards,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { CognitoAuthGuard } from './cognito-auth.guard';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CognitoService } from './cognito.service';

@ApiBearerAuth('access-token')
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cognitoService: CognitoService,
  ) {}

  @UseGuards(CognitoAuthGuard)
  @Get('me')
  async me(
    @Req() req: Request,
    @Headers('x-id-token') idToken?: string,
  ) {
    const authUser = (req as any).user;
    const idTokenUser = await this.cognitoService.verifyIdToken(idToken || '');

    // ID 토큰이 제공되고, 서브가 다르면 에러
    if (idTokenUser && idTokenUser.sub !== authUser.sub) {
      throw new UnauthorizedException('ID token does not match access token');
    }

    const user = await this.authService.getOrCreateUserFromCognito({
      sub: authUser.sub,
      email: idTokenUser['email'] as string,
      name: idTokenUser['cognito:username'],
    });

    return user;
  }

  @UseGuards(CognitoAuthGuard)
  @Post('logout')
  async logout() {
    // 서버에서 토큰 무효화 없이 클라이언트 로그아웃 용도
    return { message: 'Logged out (client-side only)' };
  }

  @UseGuards(CognitoAuthGuard)
  @Delete('withdraw')
  async withdraw(@Req() req: Request) {
    const authUser = (req as any).user;
    const user = await this.authService.getOrCreateUserFromCognito({
      sub: authUser.sub,
      email: authUser.email,
      name: authUser.name,
    });

    await this.authService.withdrawUser(user.id);

    return { message: 'User withdrawn' };
  }
}


