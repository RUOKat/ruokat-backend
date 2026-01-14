import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // 👈 추가
import { PrismaService } from '../prisma/prisma.service';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'; // 👈 추가
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'; // 👈 추가
import {
  CreateCatProfileDto,
  UpdateCatProfileDto,
} from './dto/cat-profile.dto';

@Injectable()
export class PetsService {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService, // 👈 환경변수 사용을 위해 추가
  ) {
    // 1. AWS DynamoDB 연결 설정 (버지니아 리전)
    const client = new DynamoDBClient({
      region: this.configService.get('AWS_DYNAMODB_REGION'), // us-east-1
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
    // JSON 데이터를 DB 포맷으로 자동 변환해주는 도구
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = this.configService.getOrThrow<string>('AWS_DYNAMODB_TABLE_NAME');
  }

  // 🐾 1. 고양이 생성 (Postgres + DynamoDB)
  async create(userId: string, dto: CreateCatProfileDto) {
    // A. PostgreSQL(Prisma)에 먼저 저장 (ID 생성을 위해)
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

    // B. 생성된 정보를 DynamoDB에도 백업 (비동기로 실행)
    await this.saveHistoryToDynamoDB(pet.id, dto, 'PROFILE_CREATED');

    return pet;
  }

  async findAllByUser(userId: string) {
    return this.prisma.pet.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  // 🐾 2. 고양이 수정 (Postgres + DynamoDB)
  async update(userId: string, petId: string, dto: UpdateCatProfileDto) {
    // A. 존재 여부 확인
    const pet = await this.prisma.pet.findFirst({
      where: { id: petId, userId, deletedAt: null },
    });
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

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

    // C. 변경 사항을 DynamoDB에 히스토리로 저장 (비동기)
    // CreateDto 형식으로 변환하거나 필요한 필드만 보냄
    await this.saveHistoryToDynamoDB(petId, dto, 'PROFILE_UPDATED');

    return updatedPet;
  }

  async softDelete(userId: string, petId: string) {
    const pet = await this.prisma.pet.findFirst({
      where: { id: petId, userId, deletedAt: null },
    });
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    await this.prisma.pet.update({
      where: { id: petId },
      data: { deletedAt: new Date() },
    });

    return { deleted: true };
  }

  // 🛠️ [Private] DynamoDB 저장 헬퍼 함수
  private async saveHistoryToDynamoDB(petId: string, data: any, eventType: string) {
    try {
      const input = {
        TableName: this.tableName,
        Item: {
          PK: petId, // Prisma의 UUID와 동일하게 맞춤 (중요!)
          SK: new Date().toISOString(), // 시간순 정렬을 위해 타임스탬프 사용
          
          // AI 팀이 분석하기 좋게 데이터를 분류해서 저장
          basic_profile: {
            name: data.name,
            breed: data.breed,
            gender: data.gender,
            neutered: data.neutered,
            weight_kg: data.weight,
            birth: data.birthDate || data.estimatedAge
          },
          lifestyle: {
            food_type: data.foodType,
            water_source: data.waterSource,
            activity_level: data.activityLevel,
            water_intake: data.waterIntakeTendency
          },
          medical_history: data.medicalHistory, // JSON 객체 그대로 저장
          notes: data.notes,
          
          eventType: eventType, // 생성인지 수정인지 구분
          createdAt: new Date().toISOString(),
        },
      };

      await this.docClient.send(new PutCommand(input));
      console.log(`[DynamoDB] Pet history saved: ${petId} (${eventType})`);
    } catch (error) {
      // DynamoDB 저장이 실패하더라도, 메인 로직(Postgres)은 성공했으므로
      // 에러를 던져서 멈추기보다는 로그만 남기고 넘어가는 게 안전합니다.
      console.error(`[DynamoDB Error] Failed to save history for ${petId}:`, error);
    }
  }
}