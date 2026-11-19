import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  SchoolAssessment,
  SchoolAssessmentSchema,
} from './schemas/school-assessment.schema';

import { SchoolAssessmentsRepository } from './repositories/school-assessments.repository';
import { SchoolAssessmentsController } from './school-assessments.controller';
import { SchoolAssessmentsService } from './school-assessments.service';

import { SchoolSecurityModule } from '../school-security/school-security.module';
import { UserSessionModule } from '../user-session/user-session.module';

import { DeviceSessionGuard } from '../../common/guards/device-session.guard';
import { SchoolMembershipGuard } from '../../common/guards/school-membership.guard';
import { SchoolRolesGuard } from '../../common/guards/school-roles.guard';
import { AcademicSessionsModule } from '../academic-sessions/academic-sessions.module';
import { SchoolAssessmentAttemptsModule } from '../school-assessment-attempts/school-assessment-attempts.module';
import { SchoolQuestionsModule } from '../school-questions/school-questions.module';
import { StudentEnrollmentsModule } from '../student-enrollments/student-enrollments.module';
import { TeachingAssignmentsModule } from '../teaching-assignments/teaching-assignments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SchoolAssessment.name,
        schema: SchoolAssessmentSchema,
      },
    ]),
    AcademicSessionsModule,
    TeachingAssignmentsModule,
    StudentEnrollmentsModule,
    SchoolAssessmentAttemptsModule,
    SchoolQuestionsModule,
    SchoolSecurityModule,
    UserSessionModule,
  ],
  controllers: [SchoolAssessmentsController],
  providers: [
    SchoolAssessmentsService,
    SchoolAssessmentsRepository,
    SchoolMembershipGuard,
    SchoolRolesGuard,
    DeviceSessionGuard,
  ],
  exports: [SchoolAssessmentsService, SchoolAssessmentsRepository],
})
export class SchoolAssessmentsModule {}
