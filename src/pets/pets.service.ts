import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { DynamoDBService } from '../aws/dynamodb.service';
import { S3Service } from '../aws/s3.service';
import { marshall } from '@aws-sdk/util-dynamodb';
import {
  CreateCatProfileDto,
  UpdateCatProfileDto,
} from './dto/cat-profile.dto';

export interface PetcamImage {
  key: string;
  url: string;
  lastModified: Date;
  size: number;
}

@Injectable()
export class PetsService {
  private readonly histTableName: string;
  private readonly petcamBucketName: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly dynamoDBService: DynamoDBService,
    private readonly s3Service: S3Service,
  ) {
    this.histTableName = this.configService.getOrThrow<string>('AWS_DYNAMODB_HIST_TABLE_NAME');
    this.petcamBucketName = this.configService.get<string>('AWS_PETCAM_BUCKET_NAME') || 'ruokat-image-bucket';
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
        familyDate: dto.familyDate,
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

  // Admin용: 전체 고양이 조회
  async findAll() {
    return this.prisma.pet.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin용: 고양이 상세 조회
  async findOne(petId: string) {
    const pet = await this.prisma.pet.findFirst({
      where: { id: petId, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            address: true,
          },
        },
        careLogs: {
          orderBy: { date: 'desc' },
          take: 10, // 최근 10개만
        },
      },
    });
    if (!pet) throw new NotFoundException('Pet not found');
    return pet;
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
        familyDate: dto.familyDate,
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

  async getPetcamImages(petId: string, limit: number = 50): Promise<PetcamImage[]> {
    try {
      // S3 us-east-1에서 해당 petId prefix로 이미지 목록 조회
      const result = await this.s3Service.listObjectsUsEast1(
        this.petcamBucketName,
        `${petId}/`,
        limit
      );

      if (!result.Contents || result.Contents.length === 0) {
        // petId prefix가 없으면 전체 버킷에서 조회
        const allResult = await this.s3Service.listObjectsUsEast1(
          this.petcamBucketName,
          undefined,
          limit
        );

        if (!allResult.Contents || allResult.Contents.length === 0) {
          return [];
        }

        // 최신순 정렬
        const sortedContents = allResult.Contents
          .filter(obj => obj.Key && obj.Key.match(/\.(jpg|jpeg|png|gif|webp)$/i))
          .sort((a, b) => {
            const dateA = a.LastModified?.getTime() || 0;
            const dateB = b.LastModified?.getTime() || 0;
            return dateB - dateA;
          });

        const keys = sortedContents.map(obj => obj.Key!);
        const signedUrls = await this.s3Service.getSignedUrlsForObjectsUsEast1(
          this.petcamBucketName,
          keys,
          3600
        );

        return signedUrls.map((item, index) => ({
          key: item.key,
          url: item.url,
          lastModified: sortedContents[index].LastModified || new Date(),
          size: sortedContents[index].Size || 0,
        }));
      }

      // 최신순 정렬
      const sortedContents = result.Contents
        .filter(obj => obj.Key && obj.Key.match(/\.(jpg|jpeg|png|gif|webp)$/i))
        .sort((a, b) => {
          const dateA = a.LastModified?.getTime() || 0;
          const dateB = b.LastModified?.getTime() || 0;
          return dateB - dateA;
        });

      const keys = sortedContents.map(obj => obj.Key!);
      const signedUrls = await this.s3Service.getSignedUrlsForObjectsUsEast1(
        this.petcamBucketName,
        keys,
        3600
      );

      return signedUrls.map((item, index) => ({
        key: item.key,
        url: item.url,
        lastModified: sortedContents[index].LastModified || new Date(),
        size: sortedContents[index].Size || 0,
      }));
    } catch (error) {
      console.error(`[S3 Error] Failed to get petcam images for ${petId}:`, error);
      return [];
    }
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

      const marshalledItem = marshall(rawData, {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
      });
      console.log("dynamodb updated", marshalledItem);

      await this.dynamoDBService.putItem(this.histTableName, marshalledItem);
    } catch (error) {
      console.error(`[DynamoDB Error] Failed to save history for ${petId}:`, error);
    }
  }
}