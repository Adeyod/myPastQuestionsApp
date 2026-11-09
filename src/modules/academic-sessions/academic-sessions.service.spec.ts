import { Test, TestingModule } from '@nestjs/testing';
import { AcademicSessionsService } from './academic-sessions.service';

describe('AcademicSessionsService', () => {
  let service: AcademicSessionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AcademicSessionsService],
    }).compile();

    service = module.get<AcademicSessionsService>(AcademicSessionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
