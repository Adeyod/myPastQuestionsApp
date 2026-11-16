import { Test, TestingModule } from '@nestjs/testing';
import { SchoolPracticesService } from './school-practices.service';

describe('SchoolPracticesService', () => {
  let service: SchoolPracticesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchoolPracticesService],
    }).compile();

    service = module.get<SchoolPracticesService>(SchoolPracticesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
