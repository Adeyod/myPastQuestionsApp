import { Test, TestingModule } from '@nestjs/testing';
import { StudentEnrollmentsService } from './student-enrollments.service';

describe('StudentEnrollmentsService', () => {
  let service: StudentEnrollmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentEnrollmentsService],
    }).compile();

    service = module.get<StudentEnrollmentsService>(StudentEnrollmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
