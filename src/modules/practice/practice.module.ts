import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PracticeModeController } from './controllers/practice-mode.controller';
import { PracticeController } from './controllers/practice.controller';
import { PracticeModeRepository } from './repositories/practice-mode.repository';
import {
  PracticeMode,
  PracticeModeSchema,
} from './schemas/practice-mode.schema';
import { PracticeModeService } from './services/practice-mode.service';
import { PracticeService } from './services/practice.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PracticeMode.name, schema: PracticeModeSchema },
    ]),
  ],
  controllers: [PracticeController, PracticeModeController],
  providers: [PracticeService, PracticeModeService, PracticeModeRepository],
})
export class PracticeModule {}
