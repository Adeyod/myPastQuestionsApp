import { Test, TestingModule } from '@nestjs/testing';
import { SchoolQuestionsController } from './school-questions.controller';

describe('SchoolQuestionsController', () => {
  let controller: SchoolQuestionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolQuestionsController],
    }).compile();

    controller = module.get<SchoolQuestionsController>(SchoolQuestionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
