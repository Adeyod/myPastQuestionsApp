import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSessionModule } from '../user-session/user-session.module';
import { PracticeModeController } from './controllers/practice-mode.controller';
import { PracticeController } from './controllers/practice.controller';
import { PracticeModeRepository } from './repositories/practice-mode.repository';
import { PracticeRepository } from './repositories/practice.repository';
import {
  PracticeMode,
  PracticeModeSchema,
} from './schemas/practice-mode.schema';
import { Practice, PracticeSchema } from './schemas/practice.schema';
import { PracticeModeService } from './services/practice-mode.service';
import { PracticeService } from './services/practice.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PracticeMode.name, schema: PracticeModeSchema },
      { name: Practice.name, schema: PracticeSchema },
    ]),
    UserSessionModule,
  ],
  controllers: [PracticeController, PracticeModeController],
  providers: [
    PracticeService,
    PracticeModeService,
    PracticeModeRepository,
    PracticeRepository,
  ],
  exports: [
    PracticeService,
    PracticeModeService,
    PracticeModeRepository,
    PracticeRepository,
  ],
})
export class PracticeModule {}
