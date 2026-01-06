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
import { Type } from 'class-transformer';
import { MedicalHistoryDto } from './medical-history.dto';

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
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsEnum(MedicationSelectionSource)
  source!: MedicationSelectionSource;
}

export class DataSharingDto {
  @IsBoolean()
  enabled!: boolean;

  @IsBoolean()
  required!: boolean;

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
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  adoptionPath!: string;

  @IsOptional()
  @IsEnum(AdoptionSource)
  adoptionSource?: AdoptionSource;

  @IsOptional()
  @IsString()
  adoptionAgencyCode?: string;

  @IsOptional()
  @IsString()
  agencyCode?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DataSharingDto)
  dataSharing?: DataSharingDto;

  @IsOptional()
  @IsInt()
  careShareStartAt?: number;

  @IsOptional()
  @IsInt()
  careShareEndAt?: number;

  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedAge?: number;

  @IsBoolean()
  unknownBirthday!: boolean;

  @IsEnum(Gender)
  gender!: Gender;

  @IsBoolean()
  neutered!: boolean;

  @IsString()
  @IsNotEmpty()
  breed!: string;

  @IsNumber()
  @Min(0)
  weight!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(9)
  bcs?: number | null;

  @IsEnum(FoodType)
  foodType!: FoodType;

  @IsEnum(WaterSource)
  waterSource!: WaterSource;

  @IsOptional()
  @IsInt()
  @Min(0)
  surveyFrequencyPerWeek?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(Weekday, { each: true })
  surveyDays?: Weekday[];

  @IsOptional()
  @IsEnum(ActivityLevel)
  activityLevel?: ActivityLevel;

  @IsOptional()
  @IsEnum(LivingEnvironment)
  livingEnvironment?: LivingEnvironment;

  @IsOptional()
  @IsBoolean()
  multiCat?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  catCount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  mealsPerDay?: number;

  @IsOptional()
  @IsEnum(WaterIntakeTendency)
  waterIntakeTendency?: WaterIntakeTendency;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  medicalHistory?: MedicalHistoryDto;

  @IsOptional()
  @IsString()
  medications?: string;

  @IsOptional()
  @IsString()
  medicationText?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationSelectionDto)
  medicationsSelected?: MedicationSelectionDto[];

  @IsOptional()
  @IsString()
  medicationOtherText?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  vetInfo?: string;

  @IsOptional()
  @IsEnum(NotificationPreference)
  notificationPreference?: NotificationPreference;

  @IsOptional()
  @IsString()
  profilePhoto?: string;
}

export class CreateCatProfileDto extends BaseCatProfileDto {}

export class UpdateCatProfileDto extends BaseCatProfileDto {
  @IsOptional()
  @IsUUID()
  id?: string;
}


