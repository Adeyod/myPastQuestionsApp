import { Test, TestingModule } from '@nestjs/testing';
import { SchoolAssessmentAttemptsController } from './school-assessment-attempts.controller';

describe('SchoolAssessmentAttemptsController', () => {
  let controller: SchoolAssessmentAttemptsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolAssessmentAttemptsController],
    }).compile();

    controller = module.get<SchoolAssessmentAttemptsController>(SchoolAssessmentAttemptsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
