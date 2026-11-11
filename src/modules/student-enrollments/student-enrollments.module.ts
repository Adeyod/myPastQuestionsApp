import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { StudentEnrollmentsController } from './student-enrollments.controller';
import { StudentEnrollmentsService } from './student-enrollments.service';

import { DeviceSessionGuard } from '../../common/guards/device-session.guard';
import { SchoolMembershipGuard } from '../../common/guards/school-membership.guard';
import { SchoolRolesGuard } from '../../common/guards/school-roles.guard';
import { AcademicSessionsModule } from '../academic-sessions/academic-sessions.module';
import { ClassesModule } from '../classes/classes.module';
import { SchoolSecurityModule } from '../school-security/school-security.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { StudentEnrollmentsRepository } from './repositories/student-enrollments.repository';
import {
  ClassEnrollment,
  ClassEnrollmentSchema,
} from './schemas/student-enrollment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ClassEnrollment.name,
        schema: ClassEnrollmentSchema,
      },
    ]),
    ClassesModule,
    AcademicSessionsModule,
    SchoolSecurityModule,
    UserSessionModule,
  ],
  controllers: [StudentEnrollmentsController],
  providers: [
    StudentEnrollmentsRepository,
    StudentEnrollmentsService,
    DeviceSessionGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  ],
  exports: [StudentEnrollmentsRepository, StudentEnrollmentsService],
})
export class StudentEnrollmentsModule {}
