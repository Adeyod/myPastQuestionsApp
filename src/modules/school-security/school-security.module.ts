// import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';

// import {
//   School,
//   SchoolSchema,
// } from '../../modules/schools/schemas/schools.schema';

// import { SchoolMembershipGuard } from '../../common/guards/school-membership.guard';
// import { SchoolRolesGuard } from '../../common/guards/school-roles.guard';
// import {
//   SchoolMembership,
//   SchoolMembershipSchema,
// } from '../../modules/school-memberships/schemas/school-membership.schema';

// @Module({
//   imports: [
//     MongooseModule.forFeature([
//       {
//         name: School.name,
//         schema: SchoolSchema,
//       },
//       {
//         name: SchoolMembership.name,
//         schema: SchoolMembershipSchema,
//       },
//     ]),
//   ],
//   providers: [SchoolMembershipGuard, SchoolRolesGuard],
//   exports: [SchoolMembershipGuard, SchoolRolesGuard],
// })
// export class SchoolSecurityModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  School,
  SchoolSchema,
} from '../../modules/schools/schemas/schools.schema';

import {
  SchoolMembership,
  SchoolMembershipSchema,
} from '../../modules/school-memberships/schemas/school-membership.schema';
import { SchoolLoginService } from './school-login.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: School.name,
        schema: SchoolSchema,
      },
      {
        name: SchoolMembership.name,
        schema: SchoolMembershipSchema,
      },
    ]),
  ],
  providers: [SchoolLoginService],
  exports: [MongooseModule, SchoolLoginService],
})
export class SchoolSecurityModule {}
