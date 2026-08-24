import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CompanyWalletDocument = HydratedDocument<CompanyWallet>;

@Schema({ timestamps: true })
export class CompanyWallet {
  @Prop({
    required: true,
    unique: true,
    default: 'MAIN',
  })
  name!: string;

  @Prop({
    default: 0,
    min: 0,
  })
  balanceInKobo!: number;

  @Prop({
    default: 0,
    min: 0,
  })
  totalRevenueInKobo!: number;

  @Prop({
    default: 0,
    min: 0,
  })
  totalWithdrawnInKobo!: number;
}

export const CompanyWalletSchema = SchemaFactory.createForClass(CompanyWallet);
