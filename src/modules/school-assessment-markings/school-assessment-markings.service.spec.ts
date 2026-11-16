import { Test, TestingModule } from '@nestjs/testing';
import { SchoolAssessmentMarkingsService } from './school-assessment-markings.service';

describe('SchoolAssessmentMarkingsService', () => {
  let service: SchoolAssessmentMarkingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchoolAssessmentMarkingsService],
    }).compile();

    service = module.get<SchoolAssessmentMarkingsService>(SchoolAssessmentMarkingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
