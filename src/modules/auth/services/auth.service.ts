import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        // 1. Check for existing user
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('A user with this email already exists.');
        }

        // 2. Hash password (10 salt rounds is standard for security/performance balance)
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // 3. Create user in DB
        const user = await this.prisma.user.create({
            data: {
                fullName: dto.fullName,
                email: dto.email,
                phone: dto.phone,
                password: hashedPassword,
                role: dto.role || Role.PATIENT, // Default to PATIENT if not specified
            },
        });

        // 4. Return user object without the password hash
        const { password, ...result } = user;
        return result;
    }

    async login(dto: LoginDto) {
        // 1. Find user by email
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        // We use a generic error message to prevent user enumeration attacks
        if (!user) {
            throw new UnauthorizedException('Invalid credentials.');
        }

        // 2. Verify password
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials.');
        }

        // 3. Generate JWT Payload
        const payload = {
            sub: user.id, // Standard JWT claim for "subject" (user ID)
            email: user.email,
            role: user.role,
        };

        const accessToken = await this.jwtService.signAsync(payload);

        // 4. Return token and basic user info
        return {
            accessToken,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        };
    }
}