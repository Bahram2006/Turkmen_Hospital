import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { DoctorsService } from '../services/doctors.service';
import { CreateDoctorProfileDto } from '../dto/create-doctor-profile.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('doctors')
export class DoctorsController {
    constructor(private readonly doctorsService: DoctorsService) { }

    /**
     * Public Endpoint: Fetch list of available doctors
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    async findAll(
        @Query('search') search?: string,
        @Query('categoryId') categoryId?: string,
    ) {
        return this.doctorsService.findAll(search, categoryId);
    }

    /**
     * Public Endpoint: Fetch specific doctor details
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.doctorsService.findOne(id);
    }

    /**
     * Protected Endpoint: Create or Update Doctor Profile
     * Restricted to DOCTOR and ADMIN roles
     */
    @Post('profile')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.DOCTOR, Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    async upsertProfile(
        @Request() req: any,
        @Body() dto: CreateDoctorProfileDto,
    ) {
        // req.user is populated by JwtStrategy.validate()
        return this.doctorsService.upsertProfile(req.user.id, req.user.role, dto);
    }
}