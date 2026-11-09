import { Test, TestingModule } from '@nestjs/testing';
import { AcademicPeriodsController } from './academic-periods.controller';

describe('AcademicPeriodsController', () => {
  let controller: AcademicPeriodsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicPeriodsController],
    }).compile();

    controller = module.get<AcademicPeriodsController>(AcademicPeriodsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
