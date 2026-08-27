import { Test, TestingModule } from '@nestjs/testing';
import { PracticeWalletController } from './practice-wallet.controller';

describe('PracticeWalletController', () => {
  let controller: PracticeWalletController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PracticeWalletController],
    }).compile();

    controller = module.get<PracticeWalletController>(PracticeWalletController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
