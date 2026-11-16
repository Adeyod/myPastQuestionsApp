import { Module } from '@nestjs/common';
import { SchoolPracticesController } from './school-practices.controller';
import { SchoolPracticesService } from './school-practices.service';

@Module({
  controllers: [SchoolPracticesController],
  providers: [SchoolPracticesService]
})
export class SchoolPracticesModule {}
