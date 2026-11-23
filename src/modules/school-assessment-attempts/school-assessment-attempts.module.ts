import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SchoolAssessmentAttemptsRepository } from './repositories/school-assessment-attempts.repository';
import { SchoolAssessmentAttemptsController } from './school-assessment-attempts.controller';
import { SchoolAssessmentAttemptsService } from './school-assessment-attempts.service';

import { DeviceSessionGuard } from '../../common/guards/device-session.guard';
import { SchoolMembershipGuard } from '../../common/guards/school-membership.guard';
import { SchoolRolesGuard } from '../../common/guards/school-roles.guard';
import { AcademicSessionsModule } from '../academic-sessions/academic-sessions.module';
import { SchoolSecurityModule } from '../school-security/school-security.module';
import { UserSessionModule } from '../user-session/user-session.module';
import {
  SchoolAssessmentAttempt,
  SchoolAssessmentAttemptSchema,
} from './schemas/school-assessment-attempt.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SchoolAssessmentAttempt.name,
        schema: SchoolAssessmentAttemptSchema,
      },
    ]),
    UserSessionModule,
    SchoolSecurityModule,
    AcademicSessionsModule,
  ],
  controllers: [SchoolAssessmentAttemptsController],
  providers: [
    SchoolAssessmentAttemptsService,
    SchoolAssessmentAttemptsRepository,
    DeviceSessionGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  ],
  exports: [SchoolAssessmentAttemptsService],
})
export class SchoolAssessmentAttemptsModule {}
