import { Test, TestingModule } from '@nestjs/testing';
import { StudentEnrollmentsController } from './student-enrollments.controller';

describe('StudentEnrollmentsController', () => {
  let controller: StudentEnrollmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentEnrollmentsController],
    }).compile();

    controller = module.get<StudentEnrollmentsController>(StudentEnrollmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
