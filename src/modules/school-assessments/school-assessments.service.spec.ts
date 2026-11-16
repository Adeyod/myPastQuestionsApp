import { Test, TestingModule } from '@nestjs/testing';
import { SchoolAssessmentsService } from './school-assessments.service';

describe('SchoolAssessmentsService', () => {
  let service: SchoolAssessmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchoolAssessmentsService],
    }).compile();

    service = module.get<SchoolAssessmentsService>(SchoolAssessmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
