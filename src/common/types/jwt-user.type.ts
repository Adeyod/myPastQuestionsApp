import { Types } from 'mongoose';
import { PlanCode } from '../../modules/plans/schemas/plan.schema';

export interface JwtUser {
  sub: Types.ObjectId;
  email: string;
  role: string;
  plans: PlanCode[];
}
