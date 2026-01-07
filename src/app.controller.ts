import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users/users.service';

@Controller()
export class AppController {
  constructor(private readonly usersService: UsersService) {}

  @Get('health')
  healthCheck(): { status: string } {
    return { status: 'ok' };
  }

  @Get('test/users')
  getUsers() {
    return this.usersService.getAllUsers();
  }
}
