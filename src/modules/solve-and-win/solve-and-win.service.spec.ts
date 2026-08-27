import { Test, TestingModule } from '@nestjs/testing';
import { SolveAndWinService } from './solve-and-win.service';

describe('SolveAndWinService', () => {
  let service: SolveAndWinService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SolveAndWinService],
    }).compile();

    service = module.get<SolveAndWinService>(SolveAndWinService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
