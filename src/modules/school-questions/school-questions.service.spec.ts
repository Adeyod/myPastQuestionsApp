import { Test, TestingModule } from '@nestjs/testing';
import { SchoolQuestionsService } from './school-questions.service';

describe('SchoolQuestionsService', () => {
  let service: SchoolQuestionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchoolQuestionsService],
    }).compile();

    service = module.get<SchoolQuestionsService>(SchoolQuestionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
