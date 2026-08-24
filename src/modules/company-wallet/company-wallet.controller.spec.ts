import { Test, TestingModule } from '@nestjs/testing';
import { CompanyWalletController } from './company-wallet.controller';

describe('CompanyWalletController', () => {
  let controller: CompanyWalletController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyWalletController],
    }).compile();

    controller = module.get<CompanyWalletController>(CompanyWalletController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
