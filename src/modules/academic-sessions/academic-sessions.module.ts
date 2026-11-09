import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  AcademicSession,
  AcademicSessionSchema,
} from './schemas/academic-session.schema';

import { AcademicSessionsController } from './academic-sessions.controller';
import { AcademicSessionsService } from './academic-sessions.service';

import { DeviceSessionGuard } from '../../common/guards/device-session.guard';
import { SchoolMembershipGuard } from '../../common/guards/school-membership.guard';
import { SchoolRolesGuard } from '../../common/guards/school-roles.guard';
import { SchoolSecurityModule } from '../school-security/school-security.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { AcademicSessionsRepository } from './repositories/academic-sessions.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AcademicSession.name,
        schema: AcademicSessionSchema,
      },
    ]),
    SchoolSecurityModule,
    UserSessionModule,
  ],
  controllers: [AcademicSessionsController],
  providers: [
    AcademicSessionsRepository,
    AcademicSessionsService,
    DeviceSessionGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  ],
  exports: [
    AcademicSessionsService,
    AcademicSessionsRepository,
    MongooseModule,
  ],
})
export class AcademicSessionsModule {}
