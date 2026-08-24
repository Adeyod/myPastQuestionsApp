import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { PlansRepository } from './repositories/plan.repository';
import { Plan, PlanSchema } from './schemas/plan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Plan.name, schema: PlanSchema }]),
  ],
  controllers: [PlansController],
  providers: [PlansService, PlansRepository],
  exports: [PlansService],
})
export class PlansModule {}
