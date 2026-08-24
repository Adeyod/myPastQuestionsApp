import { PlanCode } from '../../../modules/plans/schemas/plan.schema';

export const EXAM_PLAN_MAP: Record<string, PlanCode> = {
  // SECONDARY
  utme: PlanCode.SECONDARY,
  'post-utme': PlanCode.SECONDARY,
  wassce: PlanCode.SECONDARY,
  waec: PlanCode.SECONDARY,
  jamb: PlanCode.SECONDARY,
  neco: PlanCode.SECONDARY,
  ijmb: PlanCode.SECONDARY,

  // TERTIARY
  nursing: PlanCode.TERTIARY,
  medical: PlanCode.TERTIARY,
  law: PlanCode.TERTIARY,

  // OTHERS
  coren: PlanCode.OTHERS,
  ican: PlanCode.OTHERS,
  anna: PlanCode.OTHERS,
  ielts: PlanCode.OTHERS,
};
