import { Test, TestingModule } from '@nestjs/testing';
import { SchoolAssessmentAttemptsService } from './school-assessment-attempts.service';

describe('SchoolAssessmentAttemptsService', () => {
  let service: SchoolAssessmentAttemptsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchoolAssessmentAttemptsService],
    }).compile();

    service = module.get<SchoolAssessmentAttemptsService>(SchoolAssessmentAttemptsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
