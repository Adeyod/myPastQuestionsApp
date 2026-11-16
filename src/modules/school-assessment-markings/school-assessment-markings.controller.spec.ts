import { Test, TestingModule } from '@nestjs/testing';
import { SchoolAssessmentMarkingsController } from './school-assessment-markings.controller';

describe('SchoolAssessmentMarkingsController', () => {
  let controller: SchoolAssessmentMarkingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolAssessmentMarkingsController],
    }).compile();

    controller = module.get<SchoolAssessmentMarkingsController>(SchoolAssessmentMarkingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
