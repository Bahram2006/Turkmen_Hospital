import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from '../dto/update-appointment-status.dto';
import { AppointmentStatus, Role } from '@prisma/client';

@Injectable()
export class AppointmentsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Helper: Convert "HH:mm" to minutes since midnight for easy comparison
     */
    private timeToMinutes(timeStr: string): number {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * POST /appointments - Book an appointment (Patient only)
     */
    async create(patientId: string, dto: CreateAppointmentDto) {
        const reqStart = this.timeToMinutes(dto.startTime);
        const reqEnd = this.timeToMinutes(dto.endTime);

        // 1. Basic Time Validation
        if (reqEnd <= reqStart) {
            throw new BadRequestException('End time must be strictly after start time.');
        }

        // 2. Prevent booking in the past
        const requestedDate = new Date(dto.appointmentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (requestedDate < today) {
            throw new BadRequestException('Cannot book appointments in the past.');
        }

        // 3. Fetch Doctor Profile & Verify Availability
        const doctorProfile = await this.prisma.doctorProfile.findUnique({
            where: { userId: dto.doctorId },
            include: { user: true },
        });

        if (!doctorProfile || doctorProfile.user.role !== Role.DOCTOR) {
            throw new NotFoundException('Doctor not found.');
        }

        if (!doctorProfile.isAvailable) {
            throw new ConflictException('Doctor is currently unavailable.');
        }

        // 4. Check against Doctor's Working Hours
        const workStart = this.timeToMinutes(doctorProfile.workStartTime);
        const workEnd = this.timeToMinutes(doctorProfile.workEndTime);

        if (reqStart < workStart || reqEnd > workEnd) {
            throw new ConflictException(
                `Requested time is outside doctor's working hours (${doctorProfile.workStartTime} - ${doctorProfile.workEndTime}).`,
            );
        }

        // 5. Overlap Check (Crucial Business Logic)
        // Two intervals [A, B] and [C, D] overlap if A < D and C < B
        const overlappingAppointment = await this.prisma.appointment.findFirst({
            where: {
                doctorId: dto.doctorId,
                appointmentDate: {
                    gte: new Date(requestedDate.setHours(0, 0, 0, 0)),
                    lt: new Date(requestedDate.setHours(23, 59, 59, 999)),
                },
                status: {
                    in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
                },
                AND: [
                    { startTime: { lt: dto.endTime } },   // Existing starts before requested ends
                    { endTime: { gt: dto.startTime } },    // Existing ends after requested starts
                ],
            },
        });

        if (overlappingAppointment) {
            throw new ConflictException(
                'The doctor already has an appointment scheduled during this time slot.',
            );
        }

        // 6. Create Appointment
        return this.prisma.appointment.create({
            data: {
                patientId,
                doctorId: dto.doctorId,
                appointmentDate: new Date(dto.appointmentDate),
                startTime: dto.startTime,
                endTime: dto.endTime,
                notes: dto.notes,
                status: AppointmentStatus.PENDING,
            },
        });
    }

    /**
     * GET /appointments/my - Fetch appointments for the logged-in user
     */
    async findMyAppointments(userId: string, role: Role) {
        const whereClause: any = {};

        if (role === Role.PATIENT) {
            whereClause.patientId = userId;
        } else if (role === Role.DOCTOR) {
            whereClause.doctorId = userId;
        } else {
            throw new ForbiddenException('Only patients and doctors can view their appointments here.');
        }

        return this.prisma.appointment.findMany({
            where: whereClause,
            include: {
                patient: {
                    select: { id: true, fullName: true, email: true, phone: true },
                },
                doctor: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        doctorProfile: {
                            select: { consultationFee: true, category: { select: { name: true } } },
                        },
                    },
                },
            },
            orderBy: {
                appointmentDate: 'desc',
            },
        });
    }

    /**
     * PATCH /appointments/:id/status - Update status (Doctor/Admin only)
     */
    async updateStatus(
        appointmentId: string,
        userId: string,
        userRole: Role,
        dto: UpdateAppointmentStatusDto,
    ) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
        });

        if (!appointment) {
            throw new NotFoundException('Appointment not found.');
        }

        // Authorization: Doctors can only update their own appointments
        if (userRole === Role.DOCTOR && appointment.doctorId !== userId) {
            throw new ForbiddenException('You can only update your own appointments.');
        }

        // State Machine Validation: Prevent invalid transitions
        if (appointment.status === AppointmentStatus.COMPLETED) {
            throw new BadRequestException('Cannot update a completed appointment.');
        }
        if (appointment.status === AppointmentStatus.CANCELLED && dto.status !== AppointmentStatus.CANCELLED) {
            throw new BadRequestException('Cannot change status of a cancelled appointment.');
        }

        return this.prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                status: dto.status,
                cancelReason: dto.status === AppointmentStatus.CANCELLED ? dto.cancelReason : undefined,
            },
        });
    }
}