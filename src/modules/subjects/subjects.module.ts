import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSessionModule } from '../user-session/user-session.module';
import { SubjectsRepository } from './repositories/subjects.repository';
import { Subject, SubjectSchema } from './schemas/subject.schema';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Subject.name, schema: SubjectSchema }]),
    UserSessionModule,
  ],
  controllers: [SubjectsController],
  providers: [SubjectsService, SubjectsRepository],
  exports: [SubjectsRepository],
})
export class SubjectsModule {}
