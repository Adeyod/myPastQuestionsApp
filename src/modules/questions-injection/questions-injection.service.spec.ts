import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsInjectionService } from './questions-injection.service';

describe('QuestionsInjectionService', () => {
  let service: QuestionsInjectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestionsInjectionService],
    }).compile();

    service = module.get<QuestionsInjectionService>(QuestionsInjectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
