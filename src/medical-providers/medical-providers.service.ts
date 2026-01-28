import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicalProviderDto, UpdateMedicalProviderDto } from './dto/medical-provider.dto';

@Injectable()
export class MedicalProvidersService {
  constructor(private readonly prisma: PrismaService) { }

  async create(userId: string | null, dto: CreateMedicalProviderDto) {
    return this.prisma.medicalProvider.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  async findAll(userId: string | null) {
    // userId가 null이면 모든 데이터 조회
    return this.prisma.medicalProvider.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string | null, id: string) {
    const provider = await this.prisma.medicalProvider.findFirst({
      where: userId ? { id, userId } : { id },
    });

    if (!provider) {
      throw new NotFoundException('기관/의사를 찾을 수 없습니다.');
    }

    return provider;
  }

  async update(userId: string | null, id: string, dto: UpdateMedicalProviderDto) {
    await this.findOne(userId, id);

    return this.prisma.medicalProvider.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string | null, id: string) {
    await this.findOne(userId, id);

    return this.prisma.medicalProvider.delete({
      where: { id },
    });
  }
}
