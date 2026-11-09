import { Module } from '@nestjs/common';
import { StudentEnrollmentsController } from './student-enrollments.controller';
import { StudentEnrollmentsService } from './student-enrollments.service';

@Module({
  controllers: [StudentEnrollmentsController],
  providers: [StudentEnrollmentsService]
})
export class StudentEnrollmentsModule {}
