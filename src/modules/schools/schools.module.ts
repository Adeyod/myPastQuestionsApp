import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailModule } from '../../mail/mail.module';
import { AuthModule } from '../auth/auth.module';
import { SchoolMembershipsModule } from '../school-memberships/school-memberships.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { UsersModule } from '../users/users.module';
import { SchoolRepository } from './repositories/school.repository';
import { School, SchoolSchema } from './schemas/schools.schema';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: School.name, schema: SchoolSchema }]),
    AuthModule,
    UsersModule,
    SchoolMembershipsModule,
    MailModule,
    UserSessionModule,
  ],
  controllers: [SchoolsController],
  providers: [SchoolsService, SchoolRepository],
  exports: [SchoolsService, SchoolRepository],
})
export class SchoolsModule {}
