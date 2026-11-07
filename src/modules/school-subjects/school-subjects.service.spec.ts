import { Test, TestingModule } from '@nestjs/testing';
import { SchoolSubjectsService } from './school-subjects.service';

describe('SchoolSubjectsService', () => {
  let service: SchoolSubjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchoolSubjectsService],
    }).compile();

    service = module.get<SchoolSubjectsService>(SchoolSubjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
