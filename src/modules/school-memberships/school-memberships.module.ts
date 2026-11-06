import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchoolMembershipGuard } from '../../common/guards/school-membership.guard';
import { SchoolRolesGuard } from '../../common/guards/school-roles.guard';
import { MailModule } from '../../mail/mail.module';
import { AuthModule } from '../auth/auth.module';
import { SchoolSecurityModule } from '../school-security/school-security.module';
import { SchoolMembershipRepository } from './repositories/school-membership.repository';
import {
  SchoolMembership,
  SchoolMembershipSchema,
} from './schemas/school-membership.schema';
import { SchoolMembershipController } from './school-memberships.controller';
import { SchoolMembershipsService } from './school-memberships.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SchoolMembership.name,
        schema: SchoolMembershipSchema,
      },
    ]),
    SchoolSecurityModule,
    AuthModule,
    MailModule,
  ],
  controllers: [SchoolMembershipController],
  providers: [
    SchoolMembershipsService,
    SchoolMembershipRepository,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  ],
  exports: [SchoolMembershipsService, SchoolMembershipRepository],
})
export class SchoolMembershipsModule {}
