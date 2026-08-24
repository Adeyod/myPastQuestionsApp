import { ForbiddenException, Injectable } from '@nestjs/common';
import { ClientSession, Types } from 'mongoose';
import { JwtUser } from '../../common/types/jwt-user.type';
import { PaymentsRepository } from '../payments/repositories/payment.repository';
import { TransactionsRepository } from '../transactions/repositories/transaction.repository';
import { TransactionCategoryEnum } from '../transactions/schemas/transaction.schema';
import { UsersRepository } from '../users/repositories/users.repository';
import { Role } from '../users/schemas/user.schema';
import { WalletsRepository } from '../wallets/repositories/wallets.repository';

@Injectable()
export class ReferralsService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly walletsRepository: WalletsRepository,
    private readonly transactionsRepository: TransactionsRepository,
  ) {}

  async processReferralReward(userId: string, amountInKobo: number) {
    const id = new Types.ObjectId(userId);
    const user = await this.usersRepository.findById(id);

    if (!user?.referralChain?.length) return;

    const levelPercentMap: Record<number, number> = {
      1: 0.15,
      2: 0.075,
      3: 0.025,
    };

    const formattedAmt = amountInKobo;

    const referralIds = user.referralChain.map((r) => r.userId);

    const refUsers = await this.usersRepository.findManyByIds(referralIds);

    const refUserMap = new Map(refUsers.map((u) => [u._id.toString(), u]));

    const wallets =
      await this.walletsRepository.findWalletsByUserIds(referralIds);

    const walletMap = new Map(wallets.map((w) => [w.userId.toString(), w]));

    for (const ref of user.referralChain) {
      const percent = levelPercentMap[ref.level];
      if (!percent) continue;

      const refUser = refUserMap.get(ref.userId.toString());
      if (!refUser) continue;

      const wallet = walletMap.get(ref.userId.toString());
      if (!wallet) continue;

      const rewardAmount = formattedAmt * percent;

      const description = `Level ${ref.level} referral bonus from ${user.firstName} ${user.lastName}`;

      await this.walletsRepository.creditWallet({
        walletId: wallet._id.toString(),
        amountInKobo: rewardAmount,
        description,
        category: TransactionCategoryEnum.REFERRAL_BONUS,
        referredUserId: id,
        referralLevel: ref.level,
      });
    }
  }
  async processReferralRewardWithSession(
    userId: string,
    amountInKobo: number,
    session: ClientSession,
  ) {
    const id = new Types.ObjectId(userId);
    const user = await this.usersRepository.findByIdWithSession(id, session);

    if (!user?.referralChain?.length) return;

    const levelPercentMap: Record<number, number> = {
      1: 0.15,
      2: 0.075,
      3: 0.025,
    };

    const formattedAmt = amountInKobo;

    const referralIds = user.referralChain.map((r) => r.userId);

    const refUsers = await this.usersRepository.findManyByIdsWithSession(
      referralIds,
      session,
    );

    console.log('refUsers:', refUsers);

    const refUserMap = new Map(refUsers.map((u) => [u._id.toString(), u]));

    const wallets =
      await this.walletsRepository.findWalletsByUserIdsWithSession(
        referralIds,
        session,
      );

    const walletMap = new Map(wallets.map((w) => [w.userId.toString(), w]));

    for (const ref of user.referralChain) {
      const percent = levelPercentMap[ref.level];
      if (!percent) continue;

      const refUser = refUserMap.get(ref.userId.toString());
      if (!refUser) continue;

      const wallet = walletMap.get(ref.userId.toString());
      if (!wallet) continue;

      const rewardAmount = formattedAmt * percent;

      const description = `Level ${ref.level} referral bonus from ${user.firstName} ${user.lastName}`;

      await this.walletsRepository.creditWalletWithSession(
        {
          walletId: wallet._id.toString(),
          amountInKobo: rewardAmount,
          description,
          category: TransactionCategoryEnum.REFERRAL_BONUS,
          referredUserId: id,
          referralLevel: ref.level,
        },
        session,
      );
    }
  }

  // async getReferralStats(userId: string, user: JwtUser) {
  //   const userObj = new Types.ObjectId(userId);
  //   if (user.role !== Role.ADMIN) {
  //     if (userId !== user.sub.toString()) {
  //       throw new ForbiddenException({
  //         message: 'You can only get referral statistics that belong to you.',
  //         success: false,
  //         status: 403,
  //       });
  //     }
  //   }

  //   const totalReferred = await this.usersRepository.countDocuments({
  //     referredBy: userObj,
  //   });

  //   const referredUsers = await this.usersRepository.getThoseThatIReferred({
  //     referredBy: userObj,
  //   });

  //   const referredUserIds = referredUsers.map((u) => u._id);

  //   const paidUsers =
  //     await this.paymentsRepository.findPaidReferralsByUserIds(referredUserIds);

  //   const paidCount = paidUsers.length;

  //   const unpaidCount = totalReferred - paidCount;

  //   const totalEarned =
  //     await this.transactionsRepository.sumReferralEarnings(userObj);

  //     const response = {
  //     totalReferred,
  //     paidCount,
  //     unpaidCount,
  //     totalEarned,
  //   }

  //   console.log("response:", response)

  //   return response;
  // }

  async getReferralStats(userId: string, user: JwtUser) {
    const userObj = new Types.ObjectId(userId);

    if (user.role !== Role.ADMIN) {
      if (userId !== user.sub.toString()) {
        throw new ForbiddenException({
          message: 'You can only get your own referral statistics.',
          success: false,
          status: 403,
        });
      }
    }

    // Get ALL referrals across levels (1–3)
    const referrals = await this.usersRepository.getThoseThatIReferred({
      'referralChain.userId': userObj,
    });

    // ✅ Group by levels
    let level1 = 0;
    let level2 = 0;
    let level3 = 0;

    for (const ref of referrals) {
      const match = ref.referralChain.find(
        (r) => r.userId.toString() === userObj.toString(),
      );

      if (!match) continue;

      if (match.level === 1) level1++;
      if (match.level === 2) level2++;
      if (match.level === 3) level3++;
    }

    const totalReferred = level1 + level2 + level3;

    const referralIds = referrals.map((r) => r._id);

    const paidPayments =
      await this.paymentsRepository.findPaidReferralsByUserIds(referralIds);

    console.log('paidPayments:', paidPayments);

    const paidUserIds = new Set(paidPayments.map((p) => p.userId.toString()));

    let paidCount = 0;

    for (const ref of referrals) {
      if (paidUserIds.has(ref._id.toString())) {
        console.log('paidCount:', paidCount);
        paidCount++;
      }
    }

    const unpaidCount = totalReferred - paidCount;

    // ✅ Earnings fix
    const earningsAgg =
      await this.transactionsRepository.sumReferralEarnings(userObj);

    // const totalEarned = earningsAgg?.[0]?.total || 0;

    return {
      totalReferred,
      breakdown: {
        level1, // direct
        level2, // grandchildren
        level3, // great-grandchildren
      },
      paidCount,
      unpaidCount,
      // totalEarned,
    };
  }

  async getReferralNetwork(userId: string, user: JwtUser) {
    const userObj = new Types.ObjectId(userId);

    if (user.role !== Role.ADMIN) {
      if (userId !== user.sub.toString()) {
        throw new ForbiddenException({
          message: 'You can only get referral statistics that belong to you.',
          success: false,
          status: 403,
        });
      }
    }

    const referrals = await this.usersRepository.getThoseThatIReferred({
      referredBy: userObj,
    });

    return referrals.map((user) => ({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      referralCode: user.referralCode,
      // createdAt: user.createdAt,
    }));
  }

  async getPaidAndUnpaidReferrals(userId: string, user: JwtUser) {
    const userObj = new Types.ObjectId(userId);

    if (user.role !== Role.ADMIN) {
      if (userId !== user.sub.toString()) {
        throw new ForbiddenException({
          message: 'You can only get referral statistics that belong to you.',
          success: false,
          status: 403,
        });
      }
    }
    const referrals = await this.usersRepository.getThoseThatIReferred({
      referredBy: userObj,
    });

    const referralIds = referrals.map((r) => r._id);

    const paidPayments =
      await this.paymentsRepository.findPaidReferralsByUserIds(referralIds);

    const paidUserIds = new Set(paidPayments.map((p) => p.userId.toString()));

    const paid: any[] = [];
    const unpaid: any[] = [];

    for (const user of referrals) {
      if (paidUserIds.has(user._id.toString())) {
        paid.push(user);
      } else {
        unpaid.push(user);
      }
    }

    return {
      paid,
      unpaid,
      totalPaid: paid.length,
      totalUnpaid: unpaid.length,
    };
  }
}
