import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeviceSessionGuard } from '../../common/guards/device-session.guard';
import { SchoolMembershipGuard } from '../../common/guards/school-membership.guard';
import { SchoolRolesGuard } from '../../common/guards/school-roles.guard';
import { SchoolSecurityModule } from '../school-security/school-security.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { SchoolSubjectsRepository } from './repositories/school-subject.repository';
import {
  SchoolSubject,
  SchoolSubjectSchema,
} from './schemas/school-subject.schema';
import { SchoolSubjectsController } from './school-subjects.controller';
import { SchoolSubjectsService } from './school-subjects.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SchoolSubject.name,
        schema: SchoolSubjectSchema,
      },
    ]),
    SchoolSecurityModule,
    UserSessionModule,
  ],
  controllers: [SchoolSubjectsController],
  providers: [
    SchoolMembershipGuard,
    SchoolRolesGuard,
    DeviceSessionGuard,
    SchoolSubjectsService,
    SchoolSubjectsRepository,
  ],
  exports: [SchoolSubjectsService, SchoolSubjectsRepository],
})
export class SchoolSubjectsModule {}
