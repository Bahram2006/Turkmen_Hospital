import {
    IsString,
    IsUUID,
    IsOptional,
    IsInt,
    Min,
    Max,
    IsNumber,
    Matches,
    IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDoctorProfileDto {
    @IsUUID('4', { message: 'Specialization must be a valid Category UUID' })
    @IsNotEmpty()
    specializationId: string; // Maps to categoryId in DB

    @IsString()
    @IsOptional()
    bio?: string;

    @Type(() => Number)
    @IsInt()
    @Min(0)
    @Max(70, { message: 'Experience years cannot exceed 70' })
    @IsOptional()
    experienceYears?: number;

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @IsOptional()
    consultationFee?: number;

    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: 'workStartTime must be in HH:mm format (e.g., 09:00)',
    })
    @IsNotEmpty()
    workStartTime: string;

    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: 'workEndTime must be in HH:mm format (e.g., 17:00)',
    })
    @IsNotEmpty()
    workEndTime: string;
}