import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSessionModule } from '../user-session/user-session.module';
import { PracticeWalletController } from './practice-wallet.controller';
import { PracticeWalletService } from './practice-wallet.service';
import { PracticePointTransactionRepository } from './repositories/practice-point-transaction.repository';
import { PracticeWalletRepository } from './repositories/practice-wallet.repository';
import {
  PracticePointTransaction,
  PracticePointTransactionSchema,
} from './schemas/practice-point-transaction.schema';
import {
  PracticeWallet,
  PracticeWalletSchema,
} from './schemas/practice-wallet.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PracticeWallet.name, schema: PracticeWalletSchema },
      {
        name: PracticePointTransaction.name,
        schema: PracticePointTransactionSchema,
      },
    ]),
    UserSessionModule,
  ],
  controllers: [PracticeWalletController],
  providers: [
    PracticeWalletService,
    PracticeWalletRepository,
    PracticePointTransactionRepository,
  ],
  exports: [PracticeWalletService],
})
export class PracticeWalletModule {}
