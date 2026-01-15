import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  id?: string;
  sub: string;
  email?: string;
  name?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest(); 
    return request.user as RequestUser;
  },
);


