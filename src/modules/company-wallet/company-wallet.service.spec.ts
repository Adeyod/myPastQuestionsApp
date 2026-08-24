import { Test, TestingModule } from '@nestjs/testing';
import { CompanyWalletService } from './company-wallet.service';

describe('CompanyWalletService', () => {
  let service: CompanyWalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyWalletService],
    }).compile();

    service = module.get<CompanyWalletService>(CompanyWalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
