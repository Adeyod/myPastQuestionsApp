import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtUser } from '../../common/types/jwt-user.type';
import { SolveAndWinService } from '../solve-and-win/solve-and-win.service';
import { CreateQuizDto } from './dtos/create-quiz.dto';
import { CastVoteDto, SyncLeaderboardDto } from './dtos/join-quiz.dto';
import { QuizLeaderboardRepository } from './repositories/quiz-leaderboard.repository';
import { QuizParticipantRepository } from './repositories/quiz-participation.repository';
import { QuizVoteRepository } from './repositories/quiz-vote.repository';
import { QuizRepository } from './repositories/quiz.repository';
import { ParticipantStatus } from './schemas/quiz-participant.schema';
import { QuizStatus } from './schemas/quiz.schema';

@Injectable()
export class QuizService {
  constructor(
    private readonly quizRepo: QuizRepository,
    private readonly voteRepo: QuizVoteRepository,
    private readonly questionService: SolveAndWinService,
    private readonly participantRepo: QuizParticipantRepository,
    private readonly leaderboardRepo: QuizLeaderboardRepository,
  ) {}

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
  async findAllMyQuizzes(
    user: JwtUser,
    userId: string,
    queryDto: QueryWithPaginationDto,
  ) {
    if (userId !== user.sub.toString()) {
      throw new ConflictException({
        message:
          'You can only view the quizzes that you have joined and not that of another user.',
        success: false,
        status: 409,
      });
    }

    const id = new Types.ObjectId(user.sub.toString());

    const response = await this.quizRepo.findAllMyQuizzes(id, queryDto);

    return response;
  }

  async joinQuizById(user: JwtUser, id: string) {
    const quizId = new Types.ObjectId(id);
    const userId = new Types.ObjectId(user.sub.toString());

    const quiz = await this.quizRepo.findQuizById(quizId);
    if (!quiz) {
      throw new NotFoundException({
        message: 'Quiz not found.',
        success: false,
        status: 404,
      });
    }

    if (quiz.status !== QuizStatus.WAITING) {
      throw new BadRequestException({
        message: 'Quiz registration is closed.',
        success: false,
        status: 400,
      });
    }

    const currentCount =
      await this.participantRepo.countQuizParticipants(quizId);
    if (currentCount >= quiz.no_of_contestants) {
      throw new BadRequestException({
        message: 'Quiz capacity reached.',
        success: false,
        status: 400,
      });
    }

    const existingParticipant =
      await this.participantRepo.findParticipantByQuizAndUser(quizId, userId);
    if (existingParticipant) {
      throw new ConflictException({
        message: 'You have already joined this quiz.',
        success: false,
        status: 409,
      });
    }

    const participant = await this.participantRepo.createParticipant(
      quizId,
      userId,
    );
    await this.quizRepo.addJoinedUser(quizId, userId);

    return participant;
  }

  // 2. Admin creates WebSockets meeting room
  async createMeetingRoom(quizIdStr: string, adminUser: JwtUser) {
    const quizId = new Types.ObjectId(quizIdStr);
    const quiz = await this.quizRepo.findQuizById(quizId);

    if (!quiz) {
      throw new NotFoundException({
        message: 'Quiz not found.',
        success: false,
        status: 404,
      });
    }

    const roomId = `QUIZ_ROOM_${quizId.toString()}_${Date.now()}`;
    quiz.room_id = roomId;
    quiz.status = QuizStatus.IN_PROGRESS;
    await this.quizRepo.save(quiz);

    return { roomId, quizId };
  }

  // 3. Admin fetches Round Questions for distribution
  async getRoundQuestions(quizIdStr: string, roundNumber: number) {
    const quizId = new Types.ObjectId(quizIdStr);
    const quiz = await this.quizRepo.findQuizById(quizId);

    if (!quiz) {
      throw new NotFoundException({
        message: 'Quiz not found.',
        success: false,
        status: 404,
      });
    }

    const roundInfo = quiz.round_information.find(
      (r) => r.round_number === roundNumber,
    );
    if (!roundInfo) {
      throw new BadRequestException({
        message: 'Invalid round requested.',
        success: false,
        status: 400,
      });
    }

    const questions =
      await this.questionService.findQuestionsBySubjectAndDifficulty(
        quiz.subject,
        roundInfo.difficultyBreakdown,
        roundInfo.no_of_questions,
      );

    quiz.current_round = roundNumber;
    await this.quizRepo.save(quiz);

    return questions;
  }

  // 4. Save/Sync Leaderboard state & perform round removal
  async syncLeaderboardAndPruneParticipants(dto: SyncLeaderboardDto) {
    const quizId = new Types.ObjectId(dto.quizId);
    const leaderboard = await this.leaderboardRepo.upsertLeaderboard(dto);

    // Update participant states in batch based on leaderboard entries
    for (const entry of dto.entries) {
      const pUserId = new Types.ObjectId(entry.userId);
      const participant =
        await this.participantRepo.findParticipantByQuizAndUser(
          quizId,
          pUserId,
        );

      if (participant) {
        participant.totalScore = entry.score;
        participant.totalTimeTakenInSeconds = entry.timeTakenInSeconds;

        if (entry.isEliminated) {
          participant.status = ParticipantStatus.ELIMINATED;
        } else if (entry.isTied) {
          participant.status = ParticipantStatus.TIE_BREAK;
        } else {
          participant.status = ParticipantStatus.QUALIFIED;
          participant.currentRound = dto.roundNumber + 1;
        }

        await this.participantRepo.saveParticipant(participant);
      }
    }

    return leaderboard;
  }

  // 5. Tie Resolution Option 1: Process Viewer Votes
  async castViewerVote(voterUser: JwtUser, dto: CastVoteDto) {
    const quizId = new Types.ObjectId(dto.quizId);
    const voterUserId = new Types.ObjectId(voterUser.sub.toString());
    const targetUserId = new Types.ObjectId(dto.votedParticipantId);

    const targetParticipant =
      await this.participantRepo.findParticipantByQuizAndUser(
        quizId,
        targetUserId,
      );
    if (
      !targetParticipant ||
      targetParticipant.status !== ParticipantStatus.TIE_BREAK
    ) {
      throw new BadRequestException({
        message: 'Participant is not eligible for tie-break voting.',
        success: false,
        status: 400,
      });
    }

    try {
      return await this.voteRepo.createVote(
        quizId,
        dto.roundNumber,
        voterUserId,
        targetUserId,
      );
    } catch (err) {
      throw new ConflictException({
        message: 'You have already voted in this round tie-breaker.',
        success: false,
        status: 409,
      });
    }
  }

  async resolveVotingTieBreaker(quizIdStr: string, roundNumber: number) {
    const quizId = new Types.ObjectId(quizIdStr);
    const voteTally = await this.voteRepo.getTallyForRound(quizId, roundNumber);

    if (!voteTally || voteTally.length === 0) {
      throw new BadRequestException({
        message: 'No votes recorded for this tie-breaker.',
        success: false,
        status: 400,
      });
    }

    // Top participant advances
    const winnerId = voteTally[0]._id;
    const winnerParticipant =
      await this.participantRepo.findParticipantByQuizAndUser(quizId, winnerId);

    if (winnerParticipant) {
      winnerParticipant.status = ParticipantStatus.QUALIFIED;
      winnerParticipant.currentRound = roundNumber + 1;
      await this.participantRepo.saveParticipant(winnerParticipant);
    }

    return { winnerId, tally: voteTally };
  }

  // 6. Tie Resolution Option 2: Fastest Finger Tie-Breaker Question
  async getTieBreakerQuestion(quizIdStr: string) {
    const quizId = new Types.ObjectId(quizIdStr);
    const quiz = await this.quizRepo.findQuizById(quizId);

    if (!quiz) {
      throw new NotFoundException({
        message: 'Quiz not found.',
        success: false,
        status: 404,
      });
    }

    const [question] =
      await this.questionService.findQuestionsBySubjectAndDifficulty(
        quiz.subject,
        { easy: 1, medium: 0, hard: 0 },
        1,
      );

    return question;
  }
}
