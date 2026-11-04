import { Test, TestingModule } from '@nestjs/testing';
import { SchoolMembershipsService } from './school-memberships.service';

describe('SchoolMembershipsService', () => {
  let service: SchoolMembershipsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchoolMembershipsService],
    }).compile();

    service = module.get<SchoolMembershipsService>(SchoolMembershipsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
