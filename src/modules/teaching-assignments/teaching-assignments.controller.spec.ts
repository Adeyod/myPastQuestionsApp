import { Test, TestingModule } from '@nestjs/testing';
import { TeachingAssignmentsController } from './teaching-assignments.controller';

describe('TeachingAssignmentsController', () => {
  let controller: TeachingAssignmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeachingAssignmentsController],
    }).compile();

    controller = module.get<TeachingAssignmentsController>(TeachingAssignmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
