import { Test, TestingModule } from '@nestjs/testing';
import { SchoolSubjectsController } from './school-subjects.controller';

describe('SchoolSubjectsController', () => {
  let controller: SchoolSubjectsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolSubjectsController],
    }).compile();

    controller = module.get<SchoolSubjectsController>(SchoolSubjectsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
