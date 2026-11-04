import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
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
  ],
  controllers: [SchoolMembershipController],
  providers: [SchoolMembershipsService, SchoolMembershipRepository],
  exports: [SchoolMembershipsService, SchoolMembershipRepository],
})
export class SchoolMembershipsModule {}
