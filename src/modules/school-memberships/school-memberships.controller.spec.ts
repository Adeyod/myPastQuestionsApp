import { Test, TestingModule } from '@nestjs/testing';
import { SchoolMembershipsController } from './school-memberships.controller';

describe('SchoolMembershipsController', () => {
  let controller: SchoolMembershipsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolMembershipsController],
    }).compile();

    controller = module.get<SchoolMembershipsController>(SchoolMembershipsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
