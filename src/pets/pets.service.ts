import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
// ❌ 기존 직접 연결 코드 삭제
// import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
// import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// ✅ [변경] 공용 Service 및 데이터 변환기(marshall) 추가
import { DynamoDBService } from '../aws/dynamodb.service';
import { marshall } from '@aws-sdk/util-dynamodb';
import {
  CreateCatProfileDto,
  UpdateCatProfileDto,
} from './dto/cat-profile.dto';

@Injectable()
export class PetsService {
  private readonly tableName: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly dynamoDBService: DynamoDBService, // 👈 [주입] 이제 이걸 씁니다!
  ) {
    // ❌ 생성자 내부의 복잡한 Client 연결 로직 삭제
    this.tableName = this.configService.getOrThrow<string>('AWS_DYNAMODB_TABLE_NAME');
  }

  // 🐾 1. 고양이 생성
  async create(userId: string, dto: CreateCatProfileDto) {
    // A. PostgreSQL 저장
    const pet = await this.prisma.pet.create({
      data: {
        userId,
        name: dto.name,
        adoptionPath: dto.adoptionPath,
        adoptionSource: dto.adoptionSource,
        adoptionAgencyCode: dto.adoptionAgencyCode,
        agencyCode: dto.agencyCode,
        dataSharing: dto.dataSharing as unknown as object | undefined,
        careShareStartAt: dto.careShareStartAt,
        careShareEndAt: dto.careShareEndAt,
        birthDate: dto.birthDate,
        estimatedAge: dto.estimatedAge,
        unknownBirthday: dto.unknownBirthday,
        gender: dto.gender,
        neutered: dto.neutered,
        breed: dto.breed,
        weight: dto.weight,
        bcs: dto.bcs ?? undefined,
        foodType: dto.foodType,
        waterSource: dto.waterSource,
        surveyFrequencyPerWeek: dto.surveyFrequencyPerWeek,
        surveyDays: dto.surveyDays ?? [],
        activityLevel: dto.activityLevel,
        livingEnvironment: dto.livingEnvironment,
        multiCat: dto.multiCat,
        catCount: dto.catCount,
        mealsPerDay: dto.mealsPerDay,
        waterIntakeTendency: dto.waterIntakeTendency,
        medicalHistory: dto.medicalHistory as unknown as object | undefined,
        medications: dto.medications,
        medicationText: dto.medicationText,
        medicationsSelected:
          dto.medicationsSelected as unknown as object | undefined,
        medicationOtherText: dto.medicationOtherText,
        notes: dto.notes,
        vetInfo: dto.vetInfo,
        notificationPreference: dto.notificationPreference,
        profilePhoto: dto.profilePhoto,
      },
    });

    // B. DynamoDB 백업 (리팩토링된 메서드 사용)
    await this.saveHistoryToDynamoDB(pet.id, dto, 'PROFILE_CREATED');

    return pet;
  }

  async findAllByUser(userId: string) {
    return this.prisma.pet.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  // 🐾 2. 고양이 수정
  async update(userId: string, petId: string, dto: UpdateCatProfileDto) {
    // A. 존재 확인
    const pet = await this.prisma.pet.findFirst({
      where: { id: petId, userId, deletedAt: null },
    });
    if (!pet) throw new NotFoundException('Pet not found');

    // B. PostgreSQL 업데이트
    const updatedPet = await this.prisma.pet.update({
      where: { id: petId },
      data: {
        name: dto.name,
        adoptionPath: dto.adoptionPath,
        adoptionSource: dto.adoptionSource,
        adoptionAgencyCode: dto.adoptionAgencyCode,
        agencyCode: dto.agencyCode,
        dataSharing: dto.dataSharing as unknown as object | undefined,
        careShareStartAt: dto.careShareStartAt,
        careShareEndAt: dto.careShareEndAt,
        birthDate: dto.birthDate,
        estimatedAge: dto.estimatedAge,
        unknownBirthday: dto.unknownBirthday,
        gender: dto.gender,
        neutered: dto.neutered,
        breed: dto.breed,
        weight: dto.weight,
        bcs: dto.bcs ?? undefined,
        foodType: dto.foodType,
        waterSource: dto.waterSource,
        surveyFrequencyPerWeek: dto.surveyFrequencyPerWeek,
        surveyDays: dto.surveyDays ?? [],
        activityLevel: dto.activityLevel,
        livingEnvironment: dto.livingEnvironment,
        multiCat: dto.multiCat,
        catCount: dto.catCount,
        mealsPerDay: dto.mealsPerDay,
        waterIntakeTendency: dto.waterIntakeTendency,
        medicalHistory: dto.medicalHistory as unknown as object | undefined,
        medications: dto.medications,
        medicationText: dto.medicationText,
        medicationsSelected:
          dto.medicationsSelected as unknown as object | undefined,
        medicationOtherText: dto.medicationOtherText,
        notes: dto.notes,
        vetInfo: dto.vetInfo,
        notificationPreference: dto.notificationPreference,
        profilePhoto: dto.profilePhoto,
      },
    });

    // C. DynamoDB 백업
    await this.saveHistoryToDynamoDB(petId, dto, 'PROFILE_UPDATED');

    return updatedPet;
  }

  async softDelete(userId: string, petId: string) {
    const pet = await this.prisma.pet.findFirst({
      where: { id: petId, userId, deletedAt: null },
    });
    if (!pet) throw new NotFoundException('Pet not found');

    await this.prisma.pet.update({
      where: { id: petId },
      data: { deletedAt: new Date() },
    });

    return { deleted: true };
  }

  // 🛠️ [Private] 리팩토링된 DynamoDB 저장 함수
  private async saveHistoryToDynamoDB(petId: string, data: any, eventType: string) {
    try {
      // 1. 저장할 데이터 준비 (일반 JSON 객체)
      const rawData = {
        PK: petId,
        SK: new Date().toISOString(),
        basic_profile: {
          name: data.name,
          breed: data.breed,
          gender: data.gender,
          neutered: data.neutered,
          weight_kg: data.weight,
          birth: data.birthDate || data.estimatedAge,
        },
        lifestyle: {
          food_type: data.foodType,
          water_source: data.waterSource,
          activity_level: data.activityLevel,
          water_intake: data.waterIntakeTendency,
        },
        medical_history: data.medicalHistory,
        notes: data.notes,
        eventType: eventType,
        createdAt: new Date().toISOString(),
      };

      // 2. [중요] JSON -> DynamoDB 포맷({ S: "val" })으로 변환
      // 팀장님의 putItem은 Low-level 입력을 받기 때문에 marshall이 필수입니다.
      const marshalledItem = marshall(rawData, { removeUndefinedValues: true });

      // 3. 공용 Service 호출
      await this.dynamoDBService.putItem(this.tableName, marshalledItem);

      console.log(`[DynamoDB] Pet history saved: ${petId} (${eventType})`);
    } catch (error) {
      console.error(`[DynamoDB Error] Failed to save history for ${petId}:`, error);
    }
  }
}