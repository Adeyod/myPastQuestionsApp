import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeviceSessionGuard } from '../../common/guards/device-session.guard';
import { SchoolMembershipGuard } from '../../common/guards/school-membership.guard';
import { SchoolRolesGuard } from '../../common/guards/school-roles.guard';
import { AcademicSessionsModule } from '../academic-sessions/academic-sessions.module';
import { SchoolSecurityModule } from '../school-security/school-security.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { AcademicPeriodsController } from './academic-periods.controller';
import { AcademicPeriodsService } from './academic-periods.service';
import { AcademicPeriodsRepository } from './repositories/academic-periods.repository';
import {
  AcademicPeriod,
  AcademicPeriodSchema,
} from './schemas/academic-period.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AcademicPeriod.name,
        schema: AcademicPeriodSchema,
      },
    ]),
    AcademicSessionsModule,
    SchoolSecurityModule,
    UserSessionModule,
  ],
  controllers: [AcademicPeriodsController],
  providers: [
    AcademicPeriodsService,
    AcademicPeriodsRepository,
    DeviceSessionGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  ],
  exports: [AcademicPeriodsService, AcademicPeriodsRepository],
})
export class AcademicPeriodsModule {}
