import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchoolMembershipGuard } from '../../common/guards/school-membership.guard';
import { SchoolRolesGuard } from '../../common/guards/school-roles.guard';
import { AcademicSessionsModule } from '../academic-sessions/academic-sessions.module';
import { ClassesModule } from '../classes/classes.module';
import { SchoolMembershipsModule } from '../school-memberships/school-memberships.module';
import { SchoolSecurityModule } from '../school-security/school-security.module';
import { SchoolSubjectsModule } from '../school-subjects/school-subjects.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { TeachingAssignmentsRepository } from './repositories/teaching-assignments.repository';
import {
  TeachingAssignment,
  TeachingAssignmentSchema,
} from './schemas/teaching-assignment.schema';
import { TeachingAssignmentsController } from './teaching-assignments.controller';
import { TeachingAssignmentsService } from './teaching-assignments.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TeachingAssignment.name, schema: TeachingAssignmentSchema },
    ]),
    SchoolMembershipsModule,
    SchoolSecurityModule,
    ClassesModule,
    AcademicSessionsModule,
    SchoolSubjectsModule,
    UserSessionModule,
  ],
  controllers: [TeachingAssignmentsController],
  providers: [
    TeachingAssignmentsService,
    TeachingAssignmentsRepository,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  ],
  exports: [TeachingAssignmentsService, TeachingAssignmentsRepository],
})
export class TeachingAssignmentsModule {}
