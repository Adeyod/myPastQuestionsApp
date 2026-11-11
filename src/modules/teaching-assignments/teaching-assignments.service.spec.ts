import { Test, TestingModule } from '@nestjs/testing';
import { TeachingAssignmentsService } from './teaching-assignments.service';

describe('TeachingAssignmentsService', () => {
  let service: TeachingAssignmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeachingAssignmentsService],
    }).compile();

    service = module.get<TeachingAssignmentsService>(TeachingAssignmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
