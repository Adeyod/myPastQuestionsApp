import { Module } from '@nestjs/common';
import { SchoolAssessmentAttemptsController } from './school-assessment-attempts.controller';
import { SchoolAssessmentAttemptsService } from './school-assessment-attempts.service';

@Module({
  controllers: [SchoolAssessmentAttemptsController],
  providers: [SchoolAssessmentAttemptsService]
})
export class SchoolAssessmentAttemptsModule {}
