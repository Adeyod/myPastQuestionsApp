import { BadRequestException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtUser } from '../../common/types/jwt-user.type';
import { CreateQuizDto } from './dtos/create-quiz.dto';
import { QuizRepository } from './repositories/quiz.repository';

@Injectable()
export class QuizService {
  constructor(private readonly quizRepo: QuizRepository) {}

  async createQuiz(dto: CreateQuizDto) {
    const startDate = new Date(dto.start_date);
    const now = new Date();

    if (startDate < now) {
      throw new BadRequestException({
        message: `The quiz start date cannot be set in the past. Provided date: ${startDate.toISOString()}`,
        success: false,
        status: 400,
      });
    }

    const expectedRounds = dto.number_of_rounds - 1;
    if (dto.round_information.length !== expectedRounds) {
      throw new BadRequestException({
        message: `Round information must contain exactly ${expectedRounds} objects for a ${dto.number_of_rounds}-round quiz (excluding the final round).`,
        success: false,
        status: 400,
      });
    }

    dto.round_information.forEach((round, index) => {
      const expectedRoundNumber = index + 1;
      if (round.round_number !== expectedRoundNumber) {
        throw new BadRequestException({
          message: `Invalid round number sequence at index ${index}. Expected round number to be ${expectedRoundNumber}, but received ${round.round_number}.`,
          success: false,
          status: 400,
        });
      }
    });

    const totalEliminatedContestants = dto.round_information.reduce(
      (sum, round) => sum + round.exit_number,
      0,
    );

    const remainingForFinal =
      dto.no_of_contestants - totalEliminatedContestants;

    if (remainingForFinal !== 2) {
      throw new BadRequestException({
        message: `Invalid contestant elimination strategy. Starting with ${dto.no_of_contestants} contestants and eliminating ${totalEliminatedContestants} contestants leaves ${remainingForFinal} players. Exactly 2 contestants must remain for the final round.`,
        success: false,
        status: 400,
      });
    }

    console.log('dto.round_information:', dto.round_information[0]);
    for (const round of dto.round_information) {
      console.log('round:', round);
      const difficultyTotal =
        round.difficultyBreakdown.easy +
        round.difficultyBreakdown.medium +
        round.difficultyBreakdown.hard;

      console.log(
        'round.difficultyBreakdown.easy:',
        round.difficultyBreakdown.easy,
      );
      console.log(
        'round.difficultyBreakdown.medium:',
        round.difficultyBreakdown.medium,
      );
      console.log(
        'round.difficultyBreakdown.hard:',
        round.difficultyBreakdown.hard,
      );
      console.log('difficultyTotal:', difficultyTotal);

      if (difficultyTotal !== round.no_of_questions) {
        throw new BadRequestException({
          message: `In Round ${round.round_number}, difficulty total (${difficultyTotal}) does not match no_of_questions (${round.no_of_questions}).`,
          success: false,
          status: 400,
        });
      }
    }

    const finalBreakdownTotal =
      dto.final_round_information.difficultyBreakdown.easy +
      dto.final_round_information.difficultyBreakdown.medium +
      dto.final_round_information.difficultyBreakdown.hard;

    if (finalBreakdownTotal !== dto.final_round_information.no_of_questions) {
      throw new BadRequestException({
        message: `In final round information, difficulty total (${finalBreakdownTotal}) does not match number of questions (${dto.final_round_information.no_of_questions}).`,
        success: false,
        status: 400,
      });
    }

    const quiz = await this.quizRepo.createQuiz(dto);

    if (!quiz) {
      throw new BadRequestException({
        message: 'Unable to create quiz.',
        success: false,
        status: 400,
      });
    }

    return quiz;
  }

  async findAllQuizzes(queryDto: QueryWithPaginationDto) {
    const response = await this.quizRepo.findAllQuizzes(queryDto);

    return response;
  }
  async findAllMyQuizzes(user: JwtUser, queryDto: QueryWithPaginationDto) {
    const userId = new Types.ObjectId(user.sub.toString());

    const response = await this.quizRepo.findAllMyQuizzes(userId, queryDto);

    return response;
  }
}
