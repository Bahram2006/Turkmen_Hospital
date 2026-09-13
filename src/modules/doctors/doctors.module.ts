import { Module } from '@nestjs/common';
import { DoctorsService } from './services/doctors.service';
import { DoctorsController } from './controllers/doctors.controller';

@Module({
    controllers: [DoctorsController],
    providers: [DoctorsService],
    exports: [DoctorsService], // Export if AppointmentsModule needs to query doctors later
})
export class DoctorsModule { }