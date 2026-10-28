import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsModule } from '../payments/payments.module';
import { PlansModule } from '../plans/plans.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { PinsController } from './pins.controller';
import { PinsService } from './pins.service';
import { PinsRepository } from './repositories/pins.repository';
import { Pin, PinSchema } from './schemas/pin.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Pin.name, schema: PinSchema }]),
    UserSessionModule,
    PlansModule,
    PaymentsModule,
  ],
  controllers: [PinsController],
  providers: [PinsService, PinsRepository],
  exports: [PinsService, PinsRepository],
})
export class PinsModule {}
