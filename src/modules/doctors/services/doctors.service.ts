import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { CreateDoctorProfileDto } from '../dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from '../dto/update-doctor-profile.dto';
import { Role } from '@prisma/client';

@Injectable()
export class DoctorsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * GET /doctors - Fetch active doctors with optional search/filter
     */
    async findAll(search?: string, categoryId?: string) {
        const whereClause: any = {
            isAvailable: true,
            user: { role: Role.DOCTOR },
        };

        if (categoryId) {
            whereClause.categoryId = categoryId;
        }

        if (search) {
            whereClause.user = {
                ...whereClause.user,
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        const doctors = await this.prisma.doctorProfile.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        isOnline: true,
                        lastSeen: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                        icon: true,
                    },
                },
            },
            orderBy: {
                user: { fullName: 'asc' },
            },
        });

        return doctors;
    }

    /**
     * GET /doctors/:id - Fetch detailed doctor profile
     */
    async findOne(id: string) {
        const doctorProfile = await this.prisma.doctorProfile.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        isOnline: true,
                        lastSeen: true,
                    },
                },
                category: true,
            },
        });

        if (!doctorProfile) {
            throw new NotFoundException('Doctor profile not found.');
        }

        return doctorProfile;
    }

    /**
     * POST /doctors/profile - Create or Update logged-in doctor's profile
     */
    async upsertProfile(userId: string, userRole: Role, dto: CreateDoctorProfileDto | UpdateDoctorProfileDto) {
        // Security Check: Only Doctors or Admins can perform this action
        if (userRole !== Role.DOCTOR && userRole !== Role.ADMIN) {
            throw new ForbiddenException('Only doctors or admins can manage doctor profiles.');
        }

        // If it's a creation attempt, verify the user doesn't already have a profile
        const existingProfile = await this.prisma.doctorProfile.findUnique({
            where: { userId },
        });

        // Map frontend 'specializationId' to DB 'categoryId'
        const dataPayload: any = { ...dto };
        if (dataPayload.specializationId) {
            dataPayload.categoryId = dataPayload.specializationId;
            delete dataPayload.specializationId;
        }

        if (existingProfile) {
            // UPDATE existing profile
            return this.prisma.doctorProfile.update({
                where: { userId },
                data: dataPayload,
                include: { category: true },
            });
        } else {
            // CREATE new profile
            // Ensure required fields exist for creation
            if (!dataPayload.categoryId || !dataPayload.workStartTime || !dataPayload.workEndTime) {
                throw new NotFoundException('Missing required fields for profile creation.');
            }

            return this.prisma.doctorProfile.create({
                data: {
                    userId,
                    categoryId: dataPayload.categoryId,
                    bio: dataPayload.bio,
                    experienceYears: dataPayload.experienceYears ?? 0,
                    consultationFee: dataPayload.consultationFee ?? 0.00,
                    workStartTime: dataPayload.workStartTime,
                    workEndTime: dataPayload.workEndTime,
                    isAvailable: true,
                },
                include: { category: true },
            });
        }
    }
}