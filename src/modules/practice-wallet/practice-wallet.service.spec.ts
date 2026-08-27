import { Test, TestingModule } from '@nestjs/testing';
import { PracticeWalletService } from './practice-wallet.service';

describe('PracticeWalletService', () => {
  let service: PracticeWalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PracticeWalletService],
    }).compile();

    service = module.get<PracticeWalletService>(PracticeWalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
