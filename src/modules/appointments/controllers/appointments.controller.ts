import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    UseGuards,
    Request,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AppointmentsService } from '../services/appointments.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from '../dto/update-appointment-status.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('appointments')
@UseGuards(JwtAuthGuard) // All routes in this controller require authentication
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    /**
     * Protected: PATIENT books an appointment
     */
    @Post()
    @Roles(Role.PATIENT)
    @UseGuards(RolesGuard)
    @HttpCode(HttpStatus.CREATED)
    async create(@Request() req: any, @Body() dto: CreateAppointmentDto) {
        return this.appointmentsService.create(req.user.id, dto);
    }

    /**
     * Protected: PATIENT or DOCTOR fetches their own appointments
     */
    @Get('my')
    @Roles(Role.PATIENT, Role.DOCTOR)
    @UseGuards(RolesGuard)
    @HttpCode(HttpStatus.OK)
    async getMyAppointments(@Request() req: any) {
        return this.appointmentsService.findMyAppointments(req.user.id, req.user.role);
    }

    /**
     * Protected: DOCTOR or ADMIN updates appointment status
     */
    @Patch(':id/status')
    @Roles(Role.DOCTOR, Role.ADMIN)
    @UseGuards(RolesGuard)
    @HttpCode(HttpStatus.OK)
    async updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: any,
        @Body() dto: UpdateAppointmentStatusDto,
    ) {
        return this.appointmentsService.updateStatus(id, req.user.id, req.user.role, dto);
    }
}