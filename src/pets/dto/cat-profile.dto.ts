import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { MedicalHistoryDto } from './medical-history.dto';
import { ApiProperty } from '@nestjs/swagger';

export enum AdoptionSource {
  shelter = 'shelter',
  agency = 'agency',
  private = 'private',
  rescue = 'rescue',
  other = 'other',
}

export enum Weekday {
  mon = 'mon',
  tue = 'tue',
  wed = 'wed',
  thu = 'thu',
  fri = 'fri',
  sat = 'sat',
  sun = 'sun',
}

export enum MedicationSelectionSource {
  recommended = 'recommended',
  search = 'search',
}

export class MedicationSelectionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({
    enum: MedicationSelectionSource,
    enumName: 'MedicationSelectionSource',
  })
  @IsEnum(MedicationSelectionSource)
  source!: MedicationSelectionSource;
}

export class DataSharingDto {
  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty()
  @IsBoolean()
  required!: boolean;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  expiresAt?: string | null;
}

export enum Gender {
  male = 'male',
  female = 'female',
}

export enum FoodType {
  dry = 'dry',
  wet = 'wet',
  mixed = 'mixed',
  prescription = 'prescription',
}

export enum WaterSource {
  fountain = 'fountain',
  bowl = 'bowl',
  mixed = 'mixed',
}

export enum ActivityLevel {
  low = 'low',
  medium = 'medium',
  high = 'high',
}

export enum LivingEnvironment {
  indoor = 'indoor',
  outdoor = 'outdoor',
  both = 'both',
}

export enum WaterIntakeTendency {
  low = 'low',
  normal = 'normal',
  high = 'high',
  unknown = 'unknown',
}

export enum NotificationPreference {
  all = 'all',
  important = 'important',
  none = 'none',
}

export class BaseCatProfileDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  adoptionPath!: string;

  @ApiProperty({ required: false, enum: AdoptionSource, enumName: 'AdoptionSource' })
  @IsOptional()
  @IsEnum(AdoptionSource)
  adoptionSource?: AdoptionSource;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  adoptionAgencyCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  agencyCode?: string;

  @ApiProperty({ required: false, type: DataSharingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DataSharingDto)
  dataSharing?: DataSharingDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  careShareStartAt?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  careShareEndAt?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  birthDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  familyDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedAge?: number;

  @ApiProperty()
  @IsBoolean()
  unknownBirthday!: boolean;

  @ApiProperty({ enum: Gender, enumName: 'Gender' })
  @IsEnum(Gender)
  gender!: Gender;

  @ApiProperty()
  @IsBoolean()
  neutered!: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  breed!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  weight!: number;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(9)
  bcs?: number | null;

  @ApiProperty({ enum: FoodType, enumName: 'FoodType' })
  @IsEnum(FoodType)
  foodType!: FoodType;

  @ApiProperty({ enum: WaterSource, enumName: 'WaterSource' })
  @IsEnum(WaterSource)
  waterSource!: WaterSource;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  surveyFrequencyPerWeek?: number;

  @ApiProperty({ required: false, isArray: true, enum: Weekday, enumName: 'Weekday' })
  @IsOptional()
  @IsArray()
  @IsEnum(Weekday, { each: true })
  surveyDays?: Weekday[];

  @ApiProperty({ required: false, enum: ActivityLevel, enumName: 'ActivityLevel' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsEnum(ActivityLevel)
  activityLevel?: ActivityLevel;

  @ApiProperty({
    required: false,
    enum: LivingEnvironment,
    enumName: 'LivingEnvironment',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsEnum(LivingEnvironment)
  livingEnvironment?: LivingEnvironment;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  multiCat?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  catCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  mealsPerDay?: number;

  @ApiProperty({
    required: false,
    enum: WaterIntakeTendency,
    enumName: 'WaterIntakeTendency',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsEnum(WaterIntakeTendency)
  waterIntakeTendency?: WaterIntakeTendency;

  @ApiProperty({ required: false, type: MedicalHistoryDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  medicalHistory?: MedicalHistoryDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  medications?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  medicationText?: string;

  @ApiProperty({
    required: false,
    isArray: true,
    type: MedicationSelectionDto,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationSelectionDto)
  medicationsSelected?: MedicationSelectionDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  medicationOtherText?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vetInfo?: string;

  @ApiProperty({
    required: false,
    enum: NotificationPreference,
    enumName: 'NotificationPreference',
  })
  @IsOptional()
  @IsEnum(NotificationPreference)
  notificationPreference?: NotificationPreference;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  profilePhoto?: string;
}

export class CreateCatProfileDto extends BaseCatProfileDto {}

export class UpdateCatProfileDto extends BaseCatProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  id?: string;
}


