import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExamType } from '../../common/enums/exam-type.enum';
import { EXAM_PLAN_MAP } from '../../common/utils/maps/exam-plan.map';
import { UpdatePlanDto } from './dtos/update-plan.dto';
import { PlansRepository } from './repositories/plan.repository';
import { PlanCode } from './schemas/plan.schema';

@Injectable()
export class PlansService {
  constructor(private readonly planRepo: PlansRepository) {}

  async getAllPlans() {
    const response = await this.planRepo.findAll();

    return response;
  }

  async getPlanById(planId: string) {
    const response = await this.planRepo.findOneById(planId);

    if (!response) {
      throw new NotFoundException({
        message: 'Plan not found.',
        success: false,
        status: 404,
      });
    }

    if (!response.isActive) {
      throw new BadRequestException({
        message: 'This plan is no more active.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  async getPlanByCode(code: PlanCode) {
    const response = await this.planRepo.getPlanByCode(code);

    if (!response) {
      throw new NotFoundException({
        message: 'Plan not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }

  async updatePlanById(planId: string, updatePlanDto: UpdatePlanDto) {
    const response = await this.planRepo.update(planId, updatePlanDto);

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to update plan.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  async getPlanByExamType(examType: ExamType) {
    const normalizedExamType = examType.trim().toLowerCase();

    const planCode = EXAM_PLAN_MAP[normalizedExamType];

    if (!planCode) {
      throw new NotFoundException({
        message: `No plan is configured for exam type: ${examType}.`,
        success: false,
        status: 404,
      });
    }

    const response = await this.getPlanByCode(planCode);

    console.log('response:', response);

    return response;
  }
}
