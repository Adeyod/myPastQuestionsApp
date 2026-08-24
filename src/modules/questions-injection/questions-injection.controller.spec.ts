import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsInjectionController } from './questions-injection.controller';

describe('QuestionsInjectionController', () => {
  let controller: QuestionsInjectionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionsInjectionController],
    }).compile();

    controller = module.get<QuestionsInjectionController>(QuestionsInjectionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
