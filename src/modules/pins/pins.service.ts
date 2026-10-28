import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';

import { createHmac, randomInt } from 'crypto';

import { JwtUser } from '../../common/types/jwt-user.type';
import { PaymentsService } from '../payments/payments.service';
import { PaymentProvider } from '../payments/schemas/payment.schema';
import { PlansService } from '../plans/plans.service';
import { GeneratePinsDto } from './dto/generate-pins.dto';
import { PinsRepository } from './repositories/pins.repository';
import { PinStatus } from './schemas/pin.schema';

@Injectable()
export class PinsService {
  private readonly pinSecret: string;

  constructor(
    private readonly pinsRepository: PinsRepository,
    private readonly plansService: PlansService,
    private readonly paymentsService: PaymentsService,
    @InjectConnection()
    private readonly connection: Connection,
  ) {
    const secret = process.env.PIN_HASH_SECRET;

    if (!secret || secret.length < 32) {
      throw new Error(
        'PIN_HASH_SECRET must be configured with a sufficiently strong secret.',
      );
    }

    this.pinSecret = secret;
  }

  private hashPin(pin: string): string {
    return createHmac('sha256', this.pinSecret).update(pin).digest('hex');
  }

  private generateRawPin(): string {
    return randomInt(0, 1_000_000_000_000).toString().padStart(12, '0');
  }

  async generatePins(dto: GeneratePinsDto, user: JwtUser) {
    const plan = await this.plansService.getPlanById(dto.planId);

    if (!plan) {
      throw new NotFoundException({
        message: 'Subscription plan not found.',
        success: false,
        status: 404,
      });
    }

    if (!Number.isFinite(plan.priceInKobo) || plan.priceInKobo <= 0) {
      throw new BadRequestException({
        message: 'The subscription plan has an invalid price.',
        success: false,
        status: 400,
      });
    }

    const batchId = new Types.ObjectId();

    // const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    // if (expiresAt && expiresAt.getTime() <= Date.now()) {
    //   throw new BadRequestException({
    //     message: 'PIN expiration must be in the future.',
    //     success: false,
    //     status: 400,
    //   });
    // }

    const generatedPins: string[] = [];
    const seenHashes = new Set<string>();

    while (generatedPins.length < dto.quantity) {
      const pin = this.generateRawPin();
      const pinHash = this.hashPin(pin);

      if (seenHashes.has(pinHash)) {
        continue;
      }

      seenHashes.add(pinHash);
      generatedPins.push(pin);
    }

    const generatedBy = new Types.ObjectId(user.sub.toString());

    const documents = generatedPins.map((pin) => ({
      pinHash: this.hashPin(pin),
      planId: new Types.ObjectId(dto.planId),
      batchId,
      vendorId: null,
      status: PinStatus.GENERATED,
      amount: plan.priceInKobo,
      // expiresAt,
      generatedBy: generatedBy,
      assignedAt: null,
      soldAt: null,
      redeemedBy: null,
      redeemedAt: null,
      revokedBy: null,
      revokedAt: null,
    }));

    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      await this.pinsRepository.createMany(documents, session);
      await session.commitTransaction();
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new ConflictException({
          message: 'A PIN collision occurred. Please generate the batch again.',
          success: false,
          status: 409,
        });
      }

      throw error;
    } finally {
      await session.endSession();
    }

    return {
      success: true,
      message: 'PIN batch generated successfully.',
      data: {
        batchId: batchId.toString(),
        planId: dto.planId,
        quantity: generatedPins.length,
        amountPerPin: plan.priceInKobo,
        // expiresAt,
        pins: generatedPins,
      },
    };
  }

  async assignPins(pinIds: string[], vendorId: string) {
    if (!Types.ObjectId.isValid(vendorId)) {
      throw new BadRequestException({
        message: 'Invalid vendor ID.',
        success: false,
        status: 400,
      });
    }

    if (
      pinIds.some((id) => !Types.ObjectId.isValid(id)) ||
      new Set(pinIds).size !== pinIds.length
    ) {
      throw new BadRequestException({
        message: 'PIN IDs must be valid and unique.',
        success: false,
        status: 400,
      });
    }

    const vendorObjectId = new Types.ObjectId(vendorId);

    const modifiedCount = await this.pinsRepository.assignPins(
      pinIds,
      vendorObjectId,
    );

    if (modifiedCount !== pinIds.length) {
      throw new ConflictException({
        message: 'Not all PINs could be assigned. Check their current status.',
        success: false,
        status: 409,
      });
    }

    return {
      success: true,
      message: 'PINs assigned successfully.',
      data: {
        vendorId,
        assignedCount: modifiedCount,
      },
    };
  }

  async markAsSold(pinId: string, user: JwtUser) {
    const vendorId = new Types.ObjectId(user.sub.toString());

    if (!Types.ObjectId.isValid(pinId) || !Types.ObjectId.isValid(vendorId)) {
      throw new BadRequestException({
        message: 'Invalid PIN or vendor ID.',
        success: false,
        status: 400,
      });
    }

    const pin = await this.pinsRepository.markAsSold(pinId, vendorId);

    if (!pin) {
      throw new ConflictException({
        message:
          'PIN cannot be marked as sold. Verify its assignment and status.',
        success: false,
        status: 409,
      });
    }

    return {
      success: true,
      message: 'PIN sale recorded successfully.',
      data: {
        pinId: pin._id.toString(),
        status: pin.status,
        soldAt: pin.soldAt,
      },
    };
  }

  async redeemPin(pin: string, user: JwtUser) {
    const studentId = new Types.ObjectId(user.sub.toString());

    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException({
        message: 'Invalid student ID.',
        success: false,
        status: 400,
      });
    }

    const normalizedPin = pin.trim();

    if (!/^\d{12}$/.test(normalizedPin)) {
      throw new BadRequestException({
        message: 'Invalid PIN.',
        success: false,
        status: 400,
      });
    }

    const pinHash = this.hashPin(normalizedPin);

    const session = await this.connection.startSession();

    try {
      session.startTransaction();
      const redeemedPin = await this.pinsRepository.redeem(
        pinHash,
        studentId,
        session,
      );

      if (!redeemedPin) {
        throw new BadRequestException({
          message: 'Invalid PIN or PIN cannot be redeemed.',
          success: false,
          status: 400,
        });
      }

      const planExist = await this.plansService.getPlanByIdAndSession(
        redeemedPin.planId.toString(),
        session,
      );

      const provider = PaymentProvider.MONNIFY;
      const plan = planExist.code;

      const paymentDoc =
        await this.paymentsService.createPaymentForPinSubscription(
          provider,
          plan,
          pinHash,
          user,
          session,
        );

      if (!paymentDoc) {
        throw new InternalServerErrorException({
          message: 'Failed to create the PIN subscription payment record.',
          success: false,
          status: 500,
        });
      }

      await session.commitTransaction();

      return {
        success: true,
        message: 'PIN subscription successful.',
        data: {
          pinId: redeemedPin._id.toString(),
          planId: redeemedPin.planId.toString(),
          studentId,
          status: redeemedPin.status,
          redeemedAt: redeemedPin.redeemedAt,
        },
      };
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async revokePin(pinId: string, user: JwtUser) {
    const adminId = new Types.ObjectId(user.sub.toString());

    if (!Types.ObjectId.isValid(pinId) || !Types.ObjectId.isValid(adminId)) {
      throw new BadRequestException({
        message: 'Invalid PIN or admin ID.',
        success: false,
        status: 400,
      });
    }

    const pin = await this.pinsRepository.revoke(pinId, adminId);

    if (!pin) {
      throw new ConflictException({
        message:
          'PIN cannot be revoked. It may already be redeemed or revoked.',
        success: false,
        status: 409,
      });
    }

    return {
      success: true,
      message: 'PIN revoked successfully.',
      data: {
        pinId: pin._id.toString(),
        status: pin.status,
      },
    };
  }

  async getVendorPins(userId: string, user: JwtUser, status?: PinStatus) {
    const vendorId = new Types.ObjectId(user.sub.toString());

    if (userId !== user.sub.toString()) {
      throw new ForbiddenException({
        message: 'You cannot access another vendor’s PIN inventory.',
        success: false,
        status: 403,
      });
    }

    if (!Types.ObjectId.isValid(vendorId)) {
      throw new BadRequestException({
        message: 'Invalid vendor ID.',
        success: false,
        status: 400,
      });
    }

    const pins = await this.pinsRepository.findVendorPins(vendorId, status);

    return {
      success: true,
      data: pins,
    };
  }

  async getBatch(batchId: string) {
    if (!Types.ObjectId.isValid(batchId)) {
      throw new BadRequestException({
        message: 'Invalid batch ID.',
        success: false,
        status: 400,
      });
    }

    const pins = await this.pinsRepository.findBatch(batchId);

    return {
      success: true,
      data: pins,
    };
  }
}
/**
 * {
  "success": true,
  "message": "Subscription Pins generated successfully.",
  "data": {
    "success": true,
    "message": "PIN batch generated successfully.",
    "data": {
      "batchId": "6ae10923dbbe7b625fc91cf6",
      "planId": "6a7b0abcafa6aaf987e9ca3b",
      "quantity": 5,
      "amountPerPin": 300000,
      "pins": [
        "572245432276",
        "464166655103",
        "573258231925",
        "933961921535",
        "722630979959"
      ]
    }
  }
}
 */
