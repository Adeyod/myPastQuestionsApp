import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../users/schemas/user.schema';
import { UpdatePlanDto } from './dtos/update-plan.dto';
import { PlansService } from './plans.service';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get('get-all-plans')
  @SuccessMessage('Plans fetched successfully.')
  @ApiOperation({
    summary: 'This is the endpoint for fetching all plans in the database.',
    description:
      'This endpoint respond with all the plans inside the database.',
  })
  @ApiResponse({
    status: 200,
    description: 'Plans fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch plans',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getAllPlans() {
    const response = await this.plansService.getAllPlans();

    return response;
  }

  @Get('get-plan-by-id/:planId')
  @SuccessMessage('Plan fetched successfully.')
  @ApiOperation({
    summary: 'This is the endpoint for fetching plan by plan ID.',
    description:
      'This endpoint respond with the plan that its plan ID is passed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Plan fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch plan',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getPlanById(@Param('planId') planId: string) {
    const response = await this.plansService.getPlanById(planId);

    return response;
  }

  @Patch('update-plan-by-id/:planId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Plan updated successfully.')
  @ApiOperation({
    summary: 'This is the endpoint for updating a plan.',
    description:
      'This is the endpoint that admin is going to be using to update plan.',
  })
  @ApiResponse({
    status: 200,
    description: 'Plan updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to update plan',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async updatePlanById(
    @Param('planId') planId: string,
    @Body() updatePlanDto: UpdatePlanDto,
  ) {
    const response = await this.plansService.updatePlanById(
      planId,
      updatePlanDto,
    );

    return response;
  }
}
