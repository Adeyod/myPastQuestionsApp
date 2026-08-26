import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientSession, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { JwtUser } from '../../../common/types/jwt-user.type';
import { PracticeStatus } from '../enums/practice-status.enum';
import { PracticeRepository } from '../repositories/practice.repository';
import { Practice } from '../schemas/practice.schema';

@Injectable()
export class PracticeService {
  constructor(private readonly practiceRepo: PracticeRepository) {}

  async createPractice(
    createPracticeDto: any,
    user: JwtUser,
    session: ClientSession,
  ) {
    const userId = new Types.ObjectId(user.sub.toString());

    const {
      subjectId,
      examType,
      practiceModeId,
      questionCount,
      questions,
      totalDurationInSeconds,
      timePerQuestion,
      awardedPointPerCorrectAnswer,
    } = createPracticeDto;

    const data = {
      userId,
      timePerQuestion,
      awardedPointPerCorrectAnswer,
      subjectId: new Types.ObjectId(subjectId),
      examType,
      practiceModeId: new Types.ObjectId(practiceModeId),
      questionCount,
      questions,
      totalDurationInSeconds,
      status: PracticeStatus.IN_PROGRESS,
      correctAnswers: 0,
      wrongAnswers: 0,
      unansweredQuestions: questions.length,

      score: 0,
      percentage: 0,

      totalPointsAwarded: 0,
      startedAt: new Date(),
    };
    const response = await this.practiceRepo.createPractice(data, session);

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to create practice questions document.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  async findPracticeById(practiceId: string, user: JwtUser) {
    const id = new Types.ObjectId(practiceId);
    const response = await this.practiceRepo.findPracticeById(id);

    if (!response) {
      throw new NotFoundException({
        message: 'Practice question not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }
  async findPracticeByIdAndUserId(practiceId: string, user: JwtUser) {
    const id = new Types.ObjectId(practiceId);
    const userId = new Types.ObjectId(user.sub.toString());
    const response = await this.practiceRepo.findPracticeByIdAndUserId(
      id,
      userId,
    );

    if (!response) {
      throw new NotFoundException({
        message: 'Practice question not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }

  async findPracticeByIdAndUserIdForMarking(practiceId: string, user: JwtUser) {
    const id = new Types.ObjectId(practiceId);
    const userId = new Types.ObjectId(user.sub.toString());

    const response =
      await this.practiceRepo.findPracticeByIdAndUserIdForMarking(id, userId);

    if (!response) {
      throw new NotFoundException({
        message: 'Practice question not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }

  async completePracticeMarkingProcess(
    practiceId: Types.ObjectId,
    userId: Types.ObjectId,
    data: {
      questions: Practice['questions'];
      correctAnswers: number;
      wrongAnswers: number;
      unansweredQuestions: number;
      score: number;
      percentage: number;
      totalPointsAwarded: number;
      durationInSeconds: number;
      submittedAt: Date;
    },
  ) {
    const response = await this.practiceRepo.completePracticeMarkingProcess(
      practiceId,
      userId,
      data,
    );

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to mark practice.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  async getPracticeHistoryForLoggedInUser(
    user: JwtUser,
    userId: string,
    queryDto: QueryWithPaginationDto,
  ) {
    const id = new Types.ObjectId(user.sub.toString());

    if (user.sub.toString() !== userId) {
      throw new ForbiddenException({
        message: 'You can only view your own practice history.',
        success: false,
        status: 403,
      });
    }

    const response = await this.practiceRepo.getPracticeHistoryByUserId(
      id,
      queryDto,
    );

    return response;
  }
}
