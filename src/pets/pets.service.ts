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
  fgsScore?: number;
  fgsExplanation?: string;
}

interface FgsResult {
  imageKey: string;
  fgsScore: number;
  explanation: string;
  date: string;
}

@Injectable()
export class PetsService {
  private readonly histTableName: string;
  private readonly petcamBucketName: string;
  private readonly fgsResultTableName: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly dynamoDBService: DynamoDBService,
    private readonly s3Service: S3Service,
  ) {
    this.histTableName = this.configService.getOrThrow<string>('AWS_DYNAMODB_HIST_TABLE_NAME');
    this.petcamBucketName = this.configService.get<string>('AWS_PETCAM_BUCKET_NAME') || 'ruokat-image-bucket';
    this.fgsResultTableName = this.configService.get<string>('AWS_DYNAMODB_FGS_RESULT_TABLE_NAME') || 'FGSResultTable';
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

  // Admin용: 고양이 삭제 (userId 검증 없이)
  async adminSoftDelete(petId: string) {
    const pet = await this.prisma.pet.findFirst({
      where: { id: petId, deletedAt: null },
    });
    if (!pet) throw new NotFoundException('Pet not found');

    await this.prisma.pet.update({
      where: { id: petId },
      data: { deletedAt: new Date() },
    });

    return { deleted: true };
  }

  // Admin용: 전체 펫캠 이미지 조회
  async getAllPetcamImages(limit: number = 100): Promise<(PetcamImage & { petId: string; petName: string })[]> {
    try {
      // 1. 전체 고양이 목록 조회
      const pets = await this.prisma.pet.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true },
      });

      const petMap = new Map(pets.map(p => [p.id, p.name]));

      // 2. S3에서 전체 이미지 조회
      const result = await this.s3Service.listObjectsUsEast1(
        this.petcamBucketName,
        undefined,
        limit
      );

      if (!result.Contents || result.Contents.length === 0) {
        return [];
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

      // 3. 각 이미지에 대해 FGS 결과 조회
      const results: (PetcamImage & { petId: string; petName: string })[] = [];

      for (let i = 0; i < signedUrls.length; i++) {
        const item = signedUrls[i];
        const fileName = item.key.split('/').pop() || item.key;

        // 파일명에서 petId 추출
        let petId = '';
        if (item.key.startsWith('CAT#')) {
          petId = item.key.split('/')[0].replace('CAT#', '');
        } else {
          const match = fileName.match(/^([a-f0-9-]{36})_/);
          if (match) {
            petId = match[1];
          }
        }

        // FGS 결과 조회 (개별 쿼리)
        let fgsScore: number | undefined;
        let fgsExplanation: string | undefined;

        if (petId) {
          try {
            const fgsItems = await this.dynamoDBService.query({
              TableName: this.fgsResultTableName,
              KeyConditionExpression: 'PK = :pk',
              FilterExpression: 'imageKey = :imageKey',
              ExpressionAttributeValues: {
                ':pk': { S: `CAT#${petId}` },
                ':imageKey': { S: fileName },
              },
              Limit: 1,
            });

            if (fgsItems && fgsItems.length > 0) {
              fgsScore = parseInt(fgsItems[0].fgsScore?.N || fgsItems[0].fgsScore?.S || '0', 10);
              fgsExplanation = fgsItems[0].explanation?.S || '';
            }
          } catch (fgsError) {
            // FGS 조회 실패해도 이미지는 표시
          }
        }

        results.push({
          key: item.key,
          url: item.url,
          lastModified: sortedContents[i].LastModified || new Date(),
          size: sortedContents[i].Size || 0,
          fgsScore,
          fgsExplanation,
          petId,
          petName: petMap.get(petId) || '알 수 없음',
        });
      }

      return results;
    } catch (error) {
      console.error(`[S3 Error] Failed to get all petcam images:`, error);
      return [];
    }
  }

  async getPetcamImages(petId: string, limit: number = 50): Promise<PetcamImage[]> {
    try {
      // 1. FGS 결과 조회 (실패해도 이미지는 보여줘야 함)
      let fgsMap = new Map<string, FgsResult>();
      try {
        const fgsResults = await this.getFgsResultsForPet(petId);
        fgsResults.forEach(fgs => {
          fgsMap.set(fgs.imageKey, fgs);
        });
      } catch (fgsError) {
        console.warn(`[FGS Warning] Failed to get FGS results, continuing without FGS data:`, fgsError);
      }

      // 2. S3 us-east-1에서 해당 petId prefix로 이미지 목록 조회
      const result = await this.s3Service.listObjectsUsEast1(
        this.petcamBucketName,
        `CAT#${petId}/`,
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

        return signedUrls.map((item, index) => {
          const fileName = item.key.split('/').pop() || item.key;
          const fgs = fgsMap.get(fileName);
          return {
            key: item.key,
            url: item.url,
            lastModified: sortedContents[index].LastModified || new Date(),
            size: sortedContents[index].Size || 0,
            fgsScore: fgs?.fgsScore,
            fgsExplanation: fgs?.explanation,
          };
        });
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

      return signedUrls.map((item, index) => {
        const fileName = item.key.split('/').pop() || item.key;
        const fgs = fgsMap.get(fileName);
        return {
          key: item.key,
          url: item.url,
          lastModified: sortedContents[index].LastModified || new Date(),
          size: sortedContents[index].Size || 0,
          fgsScore: fgs?.fgsScore,
          fgsExplanation: fgs?.explanation,
        };
      });
    } catch (error) {
      console.error(`[S3 Error] Failed to get petcam images for ${petId}:`, error);
      return [];
    }
  }

  private async getFgsResultsForPet(petId: string): Promise<FgsResult[]> {
    try {
      const items = await this.dynamoDBService.query({
        TableName: this.fgsResultTableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': { S: `CAT#${petId}` },
        },
        ScanIndexForward: false, // 최신순
      });

      if (!items || items.length === 0) {
        return [];
      }

      return items.map(item => ({
        imageKey: item.imageKey?.S || '',
        fgsScore: parseInt(item.fgsScore?.N || item.fgsScore?.S || '0', 10),
        explanation: item.explanation?.S || '',
        date: item.SK?.S?.replace('DATE#', '') || '',
      }));
    } catch (error) {
      console.error(`[DynamoDB Error] Failed to get FGS results for ${petId}:`, error);
      return [];
    }
  }

  async deletePetcamImage(petId: string, imageKey: string): Promise<{ deleted: boolean }> {
    try {
      // 1. S3에서 이미지 삭제
      await this.s3Service.deleteObjectUsEast1(this.petcamBucketName, imageKey);

      // 2. DynamoDB에서 해당 이미지의 FGS 데이터 삭제
      const fileName = imageKey.split('/').pop() || imageKey;
      await this.deleteFgsResultForImage(petId, fileName);

      return { deleted: true };
    } catch (error) {
      console.error(`[S3 Error] Failed to delete petcam image ${imageKey}:`, error);
      throw error;
    }
  }

  private async deleteFgsResultForImage(petId: string, imageFileName: string): Promise<void> {
    try {
      // imageKey로 해당 FGS 레코드 찾기
      const items = await this.dynamoDBService.query({
        TableName: this.fgsResultTableName,
        KeyConditionExpression: 'PK = :pk',
        FilterExpression: 'imageKey = :imageKey',
        ExpressionAttributeValues: {
          ':pk': { S: `CAT#${petId}` },
          ':imageKey': { S: imageFileName },
        },
      });

      if (!items || items.length === 0) {
        console.log(`[FGS] No FGS record found for image: ${imageFileName}`);
        return;
      }

      // 찾은 레코드 삭제
      for (const item of items) {
        const sk = item.SK?.S;
        if (sk) {
          await this.dynamoDBService.deleteItem(this.fgsResultTableName, {
            PK: { S: `CAT#${petId}` },
            SK: { S: sk },
          });
          console.log(`[FGS] Deleted FGS record for image: ${imageFileName}`);
        }
      }
    } catch (error) {
      console.warn(`[FGS Warning] Failed to delete FGS record for ${imageFileName}:`, error);
      // FGS 삭제 실패해도 이미지 삭제는 성공으로 처리
    }
  }

  async uploadPetcamImage(petId: string, file: Buffer): Promise<{ key: string; url: string }> {
    try {
      // 파일명 생성: petId_timestamp_local.jpg
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
      const fileName = `${petId}_${timestamp}_local.jpg`;
      const key = `${fileName}`;

      // S3에 업로드
      await this.s3Service.uploadFileUsEast1(this.petcamBucketName, key, file, 'image/jpeg');

      // signed URL 생성
      const url = await this.s3Service.getSignedUrlUsEast1(this.petcamBucketName, key, 3600);

      return { key, url };
    } catch (error) {
      console.error(`[S3 Error] Failed to upload petcam image for ${petId}:`, error);
      throw error;
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