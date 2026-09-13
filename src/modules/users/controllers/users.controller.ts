import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { SafeUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard) // Protects all routes in this controller by default
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users/me
   * Accessible by any authenticated user (PATIENT, DOCTOR, ADMIN)
   */
  @Get('me')
  getProfile(@CurrentUser() user: SafeUser) {
    return this.usersService.getProfile(user.id);
  }

  /**
   * GET /users
   * Accessible ONLY by Admins.
   * NestJS runs guards in order: Controller Guards -> Method Guards.
   * So JwtAuthGuard runs first (populating req.user), then RolesGuard checks the role.
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }
}