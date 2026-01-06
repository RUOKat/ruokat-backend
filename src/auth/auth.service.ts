import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserDto } from './dto/auth-user.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateUserFromCognito(authUser: AuthUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { sub: authUser.sub },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.user.create({
      data: {
        sub: authUser.sub,
        email: authUser.email,
        name: authUser.name,
      },
    });
  }

  async withdrawUser(userId: string) {
    // Soft delete user and cascade delete/soft delete pets if needed
    await this.prisma.$transaction([
      this.prisma.pet.updateMany({
        where: { userId },
        data: { deletedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      }),
    ]);

    return true;
  }
}


