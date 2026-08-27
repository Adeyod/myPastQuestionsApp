import { Test, TestingModule } from '@nestjs/testing';
import { SolveAndWinController } from './solve-and-win.controller';

describe('SolveAndWinController', () => {
  let controller: SolveAndWinController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SolveAndWinController],
    }).compile();

    controller = module.get<SolveAndWinController>(SolveAndWinController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
