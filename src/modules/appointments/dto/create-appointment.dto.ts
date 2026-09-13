import {
    IsString,
    IsUUID,
    IsOptional,
    IsISO8601,
    Matches,
    IsNotEmpty,
} from 'class-validator';

export class CreateAppointmentDto {
    @IsUUID('4', { message: 'Doctor ID must be a valid UUID' })
    @IsNotEmpty()
    doctorId: string;

    @IsISO8601({}, { message: 'Appointment date must be a valid ISO 8601 date string' })
    @IsNotEmpty()
    appointmentDate: string;

    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: 'startTime must be in HH:mm format (e.g., 09:00)',
    })
    @IsNotEmpty()
    startTime: string;

    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: 'endTime must be in HH:mm format (e.g., 09:30)',
    })
    @IsNotEmpty()
    endTime: string;

    @IsString()
    @IsOptional()
    notes?: string;
}