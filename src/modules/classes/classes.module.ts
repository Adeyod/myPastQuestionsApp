import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';

import { SchoolSecurityModule } from '../school-security/school-security.module';

import { SchoolMembershipGuard } from '../../common/guards/school-membership.guard';
import { SchoolRolesGuard } from '../../common/guards/school-roles.guard';
import { SchoolSubjectsModule } from '../school-subjects/school-subjects.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { ClassesRepository } from './repositories/classes.repository';
import { SchoolClass, SchoolClassSchema } from './schemas/school-class.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SchoolClass.name,
        schema: SchoolClassSchema,
      },
    ]),
    SchoolSecurityModule,
    SchoolSubjectsModule,
    UserSessionModule,
  ],
  controllers: [ClassesController],
  providers: [
    ClassesService,
    ClassesRepository,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  ],
  exports: [ClassesService, ClassesRepository],
})
export class ClassesModule {}
