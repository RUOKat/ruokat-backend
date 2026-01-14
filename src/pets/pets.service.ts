import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
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
    private readonly dynamoDBService: DynamoDBService,
  ) {
    this.tableName = this.configService.getOrThrow<string>('AWS_DYNAMODB_TABLE_NAME');
  }

  async create(userId: string, dto: CreateCatProfileDto) {
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

    await this.saveHistoryToDynamoDB(pet.id, dto, 'PROFILE_CREATED');

    return pet;
  }

  async findAllByUser(userId: string) {
    return this.prisma.pet.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(userId: string, petId: string, dto: UpdateCatProfileDto) {
    const pet = await this.prisma.pet.findFirst({
      where: { id: petId, userId, deletedAt: null },
    });
    if (!pet) throw new NotFoundException('Pet not found');

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

  private async saveHistoryToDynamoDB(petId: string, data: any, eventType: string) {
    try {
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

      const marshalledItem = marshall(rawData, { removeUndefinedValues: true });

      await this.dynamoDBService.putItem(this.tableName, marshalledItem);
    } catch (error) {
      console.error(`[DynamoDB Error] Failed to save history for ${petId}:`, error);
    }
  }
}