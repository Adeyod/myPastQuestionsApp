import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PracticeMode,
  PracticeModeDocument,
} from '../schemas/practice-mode.schema';

@Injectable()
export class PracticeModeRepository implements OnModuleInit {
  constructor(
    @InjectModel(PracticeMode.name)
    private readonly practiceModeModel: Model<PracticeModeDocument>,
  ) {}

  /*
   * Automatically seed default practice modes
   * if the database does not have any practice mode.
   */
  async onModuleInit() {
    await this.seedDefaultPracticeModes();
  }

  async createPracticeMode(
    data: Partial<PracticeMode>,
  ): Promise<PracticeModeDocument> {
    const practiceMode = new this.practiceModeModel(data);

    return await practiceMode.save();
  }

  async findAllPracticeModes(): Promise<PracticeModeDocument[]> {
    return await this.practiceModeModel
      .find({
        isActive: true,
      })
      .sort({
        timePerQuestion: 1,
      })
      .exec();
  }

  async findAll(): Promise<PracticeModeDocument[]> {
    return await this.practiceModeModel
      .find()
      .sort({
        createdAt: 1,
      })
      .exec();
  }

  async findById(
    practiceModeId: Types.ObjectId,
  ): Promise<PracticeModeDocument | null> {
    return await this.practiceModeModel.findById(practiceModeId).exec();
  }

  async findByName(name: string): Promise<PracticeModeDocument | null> {
    return await this.practiceModeModel
      .findOne({
        name: name.trim().toLowerCase(),
      })
      .exec();
  }

  async updatePracticeMode(
    practiceModeId: Types.ObjectId,
    data: Partial<PracticeMode>,
  ): Promise<PracticeModeDocument | null> {
    return await this.practiceModeModel
      .findByIdAndUpdate(
        practiceModeId,
        {
          $set: data,
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();
  }

  async deactivatePracticeMode(
    practiceModeId: Types.ObjectId,
  ): Promise<PracticeModeDocument | null> {
    return await this.practiceModeModel
      .findByIdAndUpdate(
        practiceModeId,
        {
          $set: {
            isActive: false,
          },
        },
        {
          returnDocument: 'after',
        },
      )
      .exec();
  }

  async activatePracticeMode(
    practiceModeId: string,
  ): Promise<PracticeModeDocument | null> {
    return await this.practiceModeModel
      .findByIdAndUpdate(
        practiceModeId,
        {
          $set: {
            isActive: true,
          },
        },
        {
          returnDocument: 'after',
        },
      )
      .exec();
  }

  async seedDefaultPracticeModes(): Promise<void> {
    const existingPracticeModes = await this.practiceModeModel.countDocuments();

    console.log('existingPracticeModes:', existingPracticeModes);

    if (existingPracticeModes > 0) {
      console.log(
        'Practice modes already exist. Skipping practice mode seeding.',
      );

      return;
    }

    console.log('I want to seed practice modes into the database...');

    const defaultPracticeModes = [
      {
        name: 'quick practice',
        description:
          'Answer quickly and earn the highest CBT points for every correct answer.',
        timePerQuestion: 25,
        awardedPointPerCorrectAnswer: 0.02,
        isActive: true,
      },
      {
        name: 'standard practice',
        description:
          'Practice at a balanced pace while earning CBT points for correct answers.',
        timePerQuestion: 35,
        awardedPointPerCorrectAnswer: 0.0015,
        isActive: true,
      },
      {
        name: 'timed practice',
        description:
          'Practice under a longer limit and earn CBT points for correct answers.',
        timePerQuestion: 45,
        awardedPointPerCorrectAnswer: 0.001,
        isActive: true,
      },
    ];

    const response =
      await this.practiceModeModel.insertMany(defaultPracticeModes);
    console.log('response:', response);

    console.log('Default practice modes seeded successfully.');
  }
}
