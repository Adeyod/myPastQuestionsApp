import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateQuizDto } from './dtos/create-quiz.dto';
import { QuizRepository } from './repositories/quiz.repository';

@Injectable()
export class QuizService {
  constructor(private readonly quizRepo: QuizRepository) {}

  async createQuiz(dto: CreateQuizDto) {
    const expectedRounds = dto.number_of_rounds - 1;
    if (dto.round_information.length !== expectedRounds) {
      throw new BadRequestException({
        message: `Round information must contain exactly ${expectedRounds} objects for a ${dto.number_of_rounds}-round quiz (excluding the final round).`,
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
}
