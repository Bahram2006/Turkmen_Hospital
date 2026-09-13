import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

// Define a safe user type that excludes the password
export type SafeUser = Omit<User, 'password'>;

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): SafeUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);