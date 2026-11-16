import { Test, TestingModule } from '@nestjs/testing';
import { SchoolPracticesController } from './school-practices.controller';

describe('SchoolPracticesController', () => {
  let controller: SchoolPracticesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolPracticesController],
    }).compile();

    controller = module.get<SchoolPracticesController>(SchoolPracticesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
