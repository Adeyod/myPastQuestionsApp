import { Test, TestingModule } from '@nestjs/testing';
import { AcademicSessionsController } from './academic-sessions.controller';

describe('AcademicSessionsController', () => {
  let controller: AcademicSessionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicSessionsController],
    }).compile();

    controller = module.get<AcademicSessionsController>(AcademicSessionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
