import { Module } from '@nestjs/common';
import { SchoolAssessmentMarkingsController } from './school-assessment-markings.controller';
import { SchoolAssessmentMarkingsService } from './school-assessment-markings.service';

@Module({
  controllers: [SchoolAssessmentMarkingsController],
  providers: [SchoolAssessmentMarkingsService]
})
export class SchoolAssessmentMarkingsModule {}
