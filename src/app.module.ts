import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { HealthReportsModule } from './modules/health-reports/health-reports.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AppointmentsModule,
    HealthReportsModule,
    PrescriptionsModule,
    ChatModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}