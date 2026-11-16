import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeviceSessionGuard } from '../../common/guards/device-session.guard';
import { SchoolMembershipGuard } from '../../common/guards/school-membership.guard';
import { SchoolRolesGuard } from '../../common/guards/school-roles.guard';
import { ClassesModule } from '../classes/classes.module';
import { SchoolSecurityModule } from '../school-security/school-security.module';
import { SchoolSubjectsModule } from '../school-subjects/school-subjects.module';
import { StudentEnrollmentsModule } from '../student-enrollments/student-enrollments.module';
import { TeachingAssignmentsModule } from '../teaching-assignments/teaching-assignments.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { QuestionBankRepository } from './repositories/question-bank.repository';
import {
  SchoolQuestion,
  SchoolQuestionSchema,
} from './schemas/school-question.schema';
import { SchoolQuestionsController } from './school-questions.controller';
import { SchoolQuestionsService } from './school-questions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SchoolQuestion.name,
        schema: SchoolQuestionSchema,
      },
    ]),
    SchoolSecurityModule,
    StudentEnrollmentsModule,
    SchoolSubjectsModule,
    ClassesModule,
    TeachingAssignmentsModule,
    UserSessionModule,
  ],
  controllers: [SchoolQuestionsController],
  providers: [
    SchoolQuestionsService,
    QuestionBankRepository,
    SchoolMembershipGuard,
    SchoolRolesGuard,
    DeviceSessionGuard,
  ],
  exports: [SchoolQuestionsService, QuestionBankRepository],
})
export class SchoolQuestionsModule {}
