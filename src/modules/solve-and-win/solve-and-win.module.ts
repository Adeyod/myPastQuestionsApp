import { Module } from '@nestjs/common';
import { SolveAndWinController } from './solve-and-win.controller';
import { SolveAndWinService } from './solve-and-win.service';

@Module({
  controllers: [SolveAndWinController],
  providers: [SolveAndWinService]
})
export class SolveAndWinModule {}
