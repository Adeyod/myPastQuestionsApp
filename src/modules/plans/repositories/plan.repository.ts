import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UpdatePlanDto } from '../dtos/update-plan.dto';
import { Plan, PlanCode, PlanDocument } from '../schemas/plan.schema';

@Injectable()
export class PlansRepository implements OnModuleInit {
  constructor(
    @InjectModel(Plan.name)
    private planModel: Model<PlanDocument>,
  ) {}

  // Automatically seeds defaults if database is empty for these codes
  async onModuleInit() {
    const defaultCategories = [
      {
        categoryId: 'secondary',
        code: PlanCode.SECONDARY,
        label: 'Secondary',
        description: 'For secondary school exams and subject practice.',
        isPremium: true,
        priceInKobo: 300000,
        pricePerPracticeQuestionInKobo: 1000,
        isActive: true,
      },
      {
        categoryId: 'tertiary',
        code: PlanCode.TERTIARY,
        label: 'Tertiary',
        description: 'For university, polytechnic, and college exams.',
        isPremium: true,
        priceInKobo: 400000,
        pricePerPracticeQuestionInKobo: 1500,
        isActive: true,
      },
      {
        categoryId: 'others',
        code: PlanCode.OTHERS,
        label: 'Other',
        description: 'For IELTS, professional exams, and similar tests.',
        isPremium: true,
        priceInKobo: 600000,
        pricePerPracticeQuestionInKobo: 2000,
        isActive: true,
      },
    ];

    for (const cat of defaultCategories) {
      await this.planModel.updateOne(
        { code: cat.code },
        { $setOnInsert: cat },
        { upsert: true },
      );
    }
  }

  async findAll(): Promise<PlanDocument[]> {
    const response = await this.planModel.find({ isActive: true }).exec();

    return response;
  }

  async findOneById(planId: string): Promise<PlanDocument | null> {
    const id = new Types.ObjectId(planId);

    const plan = await this.planModel.findById(id).exec();

    return plan;
  }

  async getPlanByCode(code: PlanCode): Promise<PlanDocument | null> {
    const plan = await this.planModel.findOne({ code }).exec();
    return plan;
  }

  async update(
    planId: string,
    updateCategoryDto: UpdatePlanDto,
  ): Promise<PlanDocument | null> {
    const id = new Types.ObjectId(planId);

    const updated = await this.planModel
      .findByIdAndUpdate(
        id,
        { $set: updateCategoryDto },
        { returnDocument: 'after' },
      )
      .exec();

    return updated;
  }
}
