import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class UpdateAppointmentStatusDto {
    @IsEnum(AppointmentStatus, {
        message: `Status must be one of: ${Object.values(AppointmentStatus).join(', ')}`,
    })
    status: AppointmentStatus;

    // Only require cancelReason if the status is being set to CANCELLED
    @ValidateIf((o) => o.status === AppointmentStatus.CANCELLED)
    @IsString()
    @IsNotEmpty({ message: 'Cancel reason is required when cancelling an appointment' })
    cancelReason?: string;
}

// Need to import IsNotEmpty for the validation above
import { IsNotEmpty } from 'class-validator';