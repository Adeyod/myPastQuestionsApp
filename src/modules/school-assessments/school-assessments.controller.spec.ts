import { Test, TestingModule } from '@nestjs/testing';
import { SchoolAssessmentsController } from './school-assessments.controller';

describe('SchoolAssessmentsController', () => {
  let controller: SchoolAssessmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolAssessmentsController],
    }).compile();

    controller = module.get<SchoolAssessmentsController>(SchoolAssessmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
