import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { PlanCode } from '../plans/schemas/plan.schema';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { SubjectsRepository } from './repositories/subjects.repository';

@Injectable()
export class SubjectsService {
  constructor(private subjectsRepository: SubjectsRepository) {}
  async createSubject(createSubjectDto: CreateSubjectDto) {
    const subjectExist = await this.subjectsRepository.findByName(
      createSubjectDto.name.toLowerCase(),
    );

    if (subjectExist) {
      if (subjectExist.plans.includes(createSubjectDto?.plan)) {
        throw new BadRequestException({
          message: 'Subject already exist.',
          status: 400,
          success: false,
        });
      } else {
        const subject = await this.subjectsRepository.addMorePlanToSubject(
          createSubjectDto?.plan,
          subjectExist?._id,
        );
        return subject;
      }
    }

    const newSubject = await this.subjectsRepository.create(
      createSubjectDto.name.trim().toLowerCase(),
      createSubjectDto.plan,
    );

    if (!newSubject) {
      throw new BadRequestException({
        message: 'Unable to create subject',
        success: false,
        status: 400,
      });
    }

    return newSubject;
  }

  async getAllSubjects(queryWithPaginationDto: QueryWithPaginationDto) {
    console.log(
      'I want to get all subjects of the platform and not the subjects of schools',
    );

    const response = await this.subjectsRepository.findAll(
      queryWithPaginationDto,
    );
    return response;
  }
  async getAllSubjectsPerCategory(
    plan: PlanCode,
    queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    console.log('I want to get all subjects per category');
    if (!plan) {
      throw new BadRequestException({
        message: 'Category (Plan) is required',
        success: false,
        status: 400,
      });
    }
    const response = await this.subjectsRepository.getAllSubjectsPerCategory(
      plan,
      queryWithPaginationDto,
    );

    return response;
  }

  async getSubjectById(subjectId: string) {
    console.log('I want to get a single platform subject');
    const id = new Types.ObjectId(subjectId);
    const subject = await this.subjectsRepository.findById(id);

    if (!subject) {
      throw new NotFoundException({
        message: 'Subject not found.',
        success: false,
        status: 404,
      });
    }

    return subject;
  }

  // async getAvailableYearsAndExamTypesBySubjectId(subjectId: string) {
  //   const id = new Types.ObjectId(subjectId)

  //   const res = await this.questionsRepository.getAvailableYearsAndExamTypesBySubjectId(id)

  //   if(!res) {
  //      throw new NotFoundException({
  //       message: 'Subject details not found.',
  //       success: false,
  //       status: 404,
  //     });
  //   }

  //   return res
  // }
}
