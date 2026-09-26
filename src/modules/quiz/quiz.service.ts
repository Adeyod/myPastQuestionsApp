import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtUser } from '../../common/types/jwt-user.type';
import { checkExpiration, generateRefCode } from '../../common/utils/helper';
import { PlanCode } from '../plans/schemas/plan.schema';
import { SolveAndWinService } from '../solve-and-win/solve-and-win.service';
import { Role } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { CreateQuizDto } from './dtos/create-quiz.dto';
import { CastVoteDto, SyncLeaderboardDto } from './dtos/join-quiz.dto';
import { QuizAnswerRepository } from './repositories/quiz-answer.repository';
import { QuizLeaderboardRepository } from './repositories/quiz-leaderboard.repository';
import { QuizParticipantRepository } from './repositories/quiz-participation.repository';
import { QuizQuestionWinnerRepository } from './repositories/quiz-question-winner.repository';
import { QuizRoomRepository } from './repositories/quiz-room.repository';
import { QuizVoteRepository } from './repositories/quiz-vote.repository';
import { QuizRepository } from './repositories/quiz.repository';
import { ParticipantStatus } from './schemas/quiz-participant.schema';
import { QuizRoomStatus } from './schemas/quiz-room.schema';
import { QuizStatus } from './schemas/quiz.schema';

@Injectable()
export class QuizService {
  constructor(
    private readonly quizRepo: QuizRepository,
    private readonly voteRepo: QuizVoteRepository,
    private readonly questionService: SolveAndWinService,
    private readonly quizQuestionWinnerRepo: QuizQuestionWinnerRepository,
    private readonly usersService: UsersService,
    private readonly participantRepo: QuizParticipantRepository,
    private readonly quizAnswerRepo: QuizAnswerRepository,
    private readonly quizRoomRepo: QuizRoomRepository,
    private readonly leaderboardRepo: QuizLeaderboardRepository,
  ) {}

  async activateRoom(roomId: string, adminUserId: string) {
    const room = await this.quizRoomRepo.findRoomByRoomId(roomId);

    if (!room) {
      throw new NotFoundException({
        success: false,
        code: 'ROOM_NOT_FOUND',
        message: 'Quiz room not found.',
        status: 404,
      });
    }

    if (room.hostId.toString() !== adminUserId) {
      throw new ForbiddenException({
        code: 'NOT_ROOM_HOST',
        message: 'You are not authorized to activate this quiz room.',
        success: false,
        status: 403,
      });
    }

    if (room.status !== QuizRoomStatus.WAITING) {
      if (room.status === QuizRoomStatus.IN_PROGRESS) {
        return room;
      } else {
        throw new BadRequestException({
          message: `Room cannot be activated because its current status is ${room.status}.`,
          code: `${room.status}`,
          success: false,
          status: 400,
        });
      }
    }

    room.status = QuizRoomStatus.IN_PROGRESS;

    return this.quizRoomRepo.saveQuizRoom(room);
  }

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

  async findAllWaitingQuizzesLoggedInUserHasNotJoined(
    user: JwtUser,
    userId: string,
    queryDto: QueryWithPaginationDto,
  ) {
    if (userId !== user.sub.toString()) {
      throw new ConflictException({
        message: 'ID mis-match.',
        success: false,
        status: 409,
      });
    }
    const id = new Types.ObjectId(user.sub.toString());

    const userDetails = await this.usersService.findUserDetails(id);

    if (!userDetails.plans.includes(PlanCode.SECONDARY)) {
      const expiration = checkExpiration(userDetails.createdAt);

      if (expiration) {
        throw new BadRequestException({
          message:
            'Your free quiz participation has expired. Kindly subscribe to a plan to continue enjoying quiz participation.',
          success: false,
          status: 400,
        });
      }
    }

    const response =
      await this.quizRepo.findAllWaitingQuizzesLoggedInUserHasNotJoined(
        queryDto,
        id,
      );

    return response;
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
    console.log('findAllMyQuizzes userId:', userId);
    console.log('findAllMyQuizzes user.sub.toString():', user.sub.toString());

    if (userId !== user.sub.toString()) {
      throw new ConflictException({
        message:
          'You can only view the quizzes that you have joined and not that of another user.',
        success: false,
        status: 409,
      });
    }

    const id = new Types.ObjectId(user.sub.toString());

    const response = await this.participantRepo.findAllMyQuizParticipations(
      id,
      queryDto,
    );

    return response;
  }

  async findQuizById(quizId: string) {
    const id = new Types.ObjectId(quizId);
    const response = await this.quizRepo.findQuizById(id);

    if (!response) {
      throw new NotFoundException({
        message: 'Quiz not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }

  async joinQuizById(user: JwtUser, id: string) {
    const quizId = new Types.ObjectId(id);
    const userId = new Types.ObjectId(user.sub.toString());

    const userDetails = await this.usersService.findUserDetails(userId);

    if (!userDetails.plans.includes(PlanCode.SECONDARY)) {
      const expiration = checkExpiration(userDetails.createdAt);

      if (expiration) {
        throw new BadRequestException({
          message:
            'Your free quiz participation has expired. Kindly subscribe to a Secondary plan to join quiz.',
          success: false,
          status: 400,
        });
      }
    }
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

    const contestantId = generateRefCode();

    console.log('contestantId:', contestantId);

    const participant = await this.participantRepo.createParticipant(
      quizId,
      userId,
      contestantId,
    );
    await this.quizRepo.addJoinedUser(quizId, userId);

    return participant;
  }

  // async createMeetingRoom(quizIdStr: string, adminUser: JwtUser) {
  //   const quizId = new Types.ObjectId(quizIdStr);
  //   const quiz = await this.quizRepo.findQuizById(quizId);

  //   if (!quiz) {
  //     throw new NotFoundException({
  //       message: 'Quiz not found.',
  //       success: false,
  //       status: 404,
  //     });
  //   }

  //   if (
  //     quiz.status === QuizStatus.COMPLETED ||
  //     quiz.status === QuizStatus.CANCELLED
  //   ) {
  //     throw new BadRequestException({
  //       success: false,
  //       message: `Cannot create a room for a ${quiz.status.toLowerCase()} quiz.`,
  //     });
  //   }

  //   const roomId = `QUIZ_ROOM_${quizId.toString()}_${Date.now()}`;
  //   quiz.room_id = roomId;
  //   quiz.status = QuizStatus.IN_PROGRESS;
  //   await this.quizRepo.save(quiz);

  //   return { roomId, quizId };
  // }

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

    // Validate quiz...

    const existingRoom = await this.quizRoomRepo.findActiveRoomByQuizId(quizId);

    if (existingRoom) {
      return existingRoom;
    }

    const roomId = `QUIZ_ROOM_${quizId.toString()}_${Date.now()}`;

    const room = await this.quizRoomRepo.createRoom({
      quizId,
      roomId,
      status: QuizRoomStatus.WAITING,
      hostId: new Types.ObjectId(adminUser.sub.toString()),
      currentRound: 0,
      currentQuestionIndex: -1,
    });

    quiz.room_id = roomId;
    await this.quizRepo.save(quiz);

    return {
      roomId,
      quizId,
      status: room.status,
    };
  }

  async getRoomState(roomId: string) {
    const room = await this.quizRoomRepo.findRoomByRoomId(roomId);

    if (!room) {
      throw new NotFoundException({
        message: 'Quiz room not found.',
        success: false,
        status: 404,
      });
    }

    return {
      roomId: room.roomId,
      quizId: room.quizId,
      status: room.status,
      currentRound: room.currentRound,
      currentQuestionIndex: room.currentQuestionIndex,
      questionStartedAt: room.questionStartedAt,
      questionEndsAt: room.questionEndsAt,
    };
  }

  async validateParticipantCanJoinRoom(roomId: string, user: JwtUser) {
    const userId = user.sub.toString();
    const userRole = user.role;

    const room = await this.quizRoomRepo.findRoomByRoomId(roomId);

    if (!room) {
      throw new NotFoundException({
        success: false,
        message: 'Quiz room not found.',
      });
    }

    if (
      room.status === QuizRoomStatus.COMPLETED ||
      room.status === QuizRoomStatus.CANCELLED
    ) {
      throw new BadRequestException({
        success: false,
        message: 'This quiz room is no longer available.',
      });
    }

    const quiz = await this.quizRepo.findQuizById(room.quizId);

    if (!quiz) {
      throw new NotFoundException({
        success: false,
        message: 'Quiz associated with this room was not found.',
      });
    }

    const isParticipant = quiz.joined_users?.some(
      (id) => id.toString() === userId,
    );

    if (userRole !== Role.ADMIN && !isParticipant) {
      throw new ForbiddenException({
        message: 'You are not registered for this quiz contest.',
        status: 403,
        success: false,
      });
    }

    const isSpectator = quiz.spectator_array?.some(
      (id) => id.toString() === userId,
    );

    if (isSpectator) {
      throw new ForbiddenException({
        message: 'You have been eliminated from this quiz.',
        success: false,
        status: 403,
      });
    }

    return room;
  }

  async registerParticipantSocket(
    roomId: string,
    userId: string,
    socketId: string,
  ) {
    const room = await this.quizRoomRepo.findRoomByRoomId(roomId);

    if (!room) {
      throw new NotFoundException({
        success: false,
        message: 'Quiz room not found.',
      });
    }

    const user = new Types.ObjectId(userId);

    const participantExist =
      await this.participantRepo.findParticipantByQuizAndUser(
        room.quizId,
        user,
      );

    if (!participantExist) {
      throw new NotFoundException({
        message: 'Quiz participant record not found.',
        success: false,
        status: 404,
      });
    }

    const existingParticipant = room.participants?.find(
      (participant) => participant.userId.toString() === userId,
    );

    /*
     * User already exists in this room.
     *
     * This is most likely a reconnection, so update
     * the socket ID instead of creating another participant.
     */
    if (existingParticipant) {
      existingParticipant.socketId = socketId;
      existingParticipant.connected = true;

      await this.quizRoomRepo.saveQuizRoom(room);

      return existingParticipant;
    }

    /*
     * New participant.
     */
    const participant = {
      userId: new Types.ObjectId(userId),
      socketId,
      joinedAt: new Date(),
      connected: true,
    };

    room.participants.push(participant);

    participantExist.socketId = socketId;
    participantExist.connected = true;
    await participantExist.save();

    await this.quizRoomRepo.saveQuizRoom(room);

    return participant;
  }

  // async registerParticipantSocket(
  //   quizId: string,
  //   userId: string,
  //   socketId: string,
  // ) {
  //   const participant =
  //     await this.quizParticipantRepo.findParticipantByQuizAndUser(
  //       new Types.ObjectId(quizId),
  //       new Types.ObjectId(userId),
  //     );

  //   if (!participant) {
  //     throw new NotFoundException({
  //       success: false,
  //       message: 'Quiz participant record not found.',
  //       status: 404,
  //     });
  //   }

  //   participant.socketId = socketId;
  //   participant.connected = true;
  //   participant.disconnectedAt = null;

  //   if (participant.status === ParticipantStatus.REGISTERED) {
  //     participant.status = ParticipantStatus.IN_ROOM;
  //   }

  //   return this.quizParticipantRepo.saveParticipant(participant);
  // }

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

    if (roundInfo.questionIds?.length) {
      const questions =
        await this.questionService.findSolveAndWinQuestionsByIds(
          roundInfo.questionIds,
        );

      quiz.current_round = roundNumber;
      await this.quizRepo.save(quiz);

      return questions;
    }

    const questions =
      await this.questionService.findQuestionsBySubjectAndDifficulty(
        quiz.subject,
        roundInfo.difficultyBreakdown,
        roundInfo.no_of_questions,
      );

    if (!questions.length) {
      throw new BadRequestException({
        message: 'No questions available for this round.',
        success: false,
        status: 400,
      });
    }

    const questionIds = questions.map((question) => question._id);

    roundInfo.questionIds = questionIds;

    quiz.current_round = roundNumber;
    await this.quizRepo.save(quiz);

    return questions;
  }

  // 4. Save/Sync Leaderboard state & perform round removal
  // async syncLeaderboardAndPruneParticipants(dto: SyncLeaderboardDto) {
  //   const quizId = new Types.ObjectId(dto.quizId);
  //   const leaderboard = await this.leaderboardRepo.upsertLeaderboard(dto);

  //   // Update participant states in batch based on leaderboard entries
  //   for (const entry of dto.entries) {
  //     const pUserId = new Types.ObjectId(entry.userId);
  //     const participant =
  //       await this.participantRepo.findParticipantByQuizAndUser(
  //         quizId,
  //         pUserId,
  //       );

  //     if (participant) {
  //       participant.totalScore = entry.score;
  //       participant.totalTimeTakenInSeconds = entry.timeTakenInSeconds;

  //       if (entry.isEliminated) {
  //         participant.status = ParticipantStatus.ELIMINATED;
  //       } else if (entry.isTied) {
  //         participant.status = ParticipantStatus.TIE_BREAK;
  //       } else {
  //         participant.status = ParticipantStatus.QUALIFIED;
  //         participant.currentRound = dto.roundNumber + 1;
  //       }

  //       await this.participantRepo.saveParticipant(participant);
  //     }
  //   }

  //   return leaderboard;
  // }

  async syncLeaderboardAndPruneParticipants(dto: SyncLeaderboardDto) {
    const quizId = new Types.ObjectId(dto.quizId);

    // 1. Upsert leaderboard document
    const leaderboard = await this.leaderboardRepo.upsertLeaderboard(dto);

    // 2. Prepare bulk update operations
    const bulkOps = dto.entries.map((entry) => {
      const pUserId = new Types.ObjectId(entry.userId);

      let status = ParticipantStatus.QUALIFIED;
      let nextRound = dto.roundNumber + 1;
      let eliminatedInRound: number | null = null;

      if (entry.isEliminated) {
        status = ParticipantStatus.ELIMINATED;
        eliminatedInRound = dto.roundNumber; // Record the elimination round
        nextRound = dto.roundNumber;
      } else if (entry.isTied) {
        status = ParticipantStatus.TIE_BREAK;
      }

      return {
        updateOne: {
          filter: { quizId, userId: pUserId },
          update: {
            $set: {
              totalScore: entry.score,
              totalTimeTakenInSeconds: entry.timeTakenInSeconds,
              status,
              currentRound: nextRound,
              ...(eliminatedInRound !== null && { eliminatedInRound }),
            },
          },
        },
      };
    });

    // 3. Execute bulk update in one round-trip
    if (bulkOps.length > 0) {
      await this.participantRepo.bulkWrite(bulkOps);
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

  async getTiebreakerQuestion(quizIdStr: string) {
    const quiz = await this.quizRepo.findQuizById(
      new Types.ObjectId(quizIdStr),
    );
    if (!quiz) {
      throw new NotFoundException({
        message: 'Quiz not found',
        success: false,
        status: 404,
      });
    }

    const [question] =
      await this.questionService.findQuestionsBySubjectAndDifficulty(
        quiz.subject,
        { easy: 0, medium: 1, hard: 0 }, // Adjust difficulty as required
        1,
      );

    return question;
  }

  async markParticipantDisconnected(userId: string, socketId: string) {
    const id = new Types.ObjectId(userId);

    const participant = await this.participantRepo.findParticipantAndUpdate(
      id,
      socketId,
    );

    if (participant) {
      return participant;
    }
  }

  /**
   * Helper called by resolve_tiebreaker_eliminations to update arrays.
   */
  async pruneEliminatedUsers(
    quizIdStr: string,
    eliminatedUserIdsStr: string[],
    roundNumber: number,
  ) {
    const quizId = new Types.ObjectId(quizIdStr);
    const eliminatedUserIds = eliminatedUserIdsStr.map(
      (id) => new Types.ObjectId(id),
    );

    // Atomically pull from joined_users and push into spectator_array
    await this.quizRepo.transitionUsersToSpectators(quizId, eliminatedUserIds);

    // Batch update participant statuses in QuizParticipant collection
    await this.participantRepo.bulkWrite(
      eliminatedUserIds.map((userId) => ({
        updateOne: {
          filter: { quizId, userId },
          update: {
            $set: {
              status: ParticipantStatus.ELIMINATED,
              eliminatedInRound: roundNumber,
            },
          },
        },
      })),
    );
  }

  async submitAnswer(
    roomId: string,
    userId: string,
    roundNumber: number,
    questionId: string,
    selectedAnswerId: string,
  ) {
    const room = await this.quizRoomRepo.findRoomByRoomId(roomId);

    if (!room) {
      throw new NotFoundException({
        success: false,
        code: 'ROOM_NOT_FOUND',
        message: 'Quiz room not found.',
        status: 404,
      });
    }

    /*
     * The participant should only be allowed to answer while
     * a round is actively running.
     */

    if (room.status !== QuizRoomStatus.IN_PROGRESS) {
      throw new BadRequestException({
        success: false,
        code: 'QUIZ_NOT_ACTIVE',
        message: 'This quiz is not currently active.',
        status: 400,
      });
    }

    const participant = await this.participantRepo.findParticipantByQuizAndUser(
      room.quizId,
      new Types.ObjectId(userId),
    );

    if (!participant) {
      throw new NotFoundException({
        success: false,
        code: 'PARTICIPANT_NOT_FOUND',
        message: 'Quiz participant not found.',
        status: 404,
      });
    }

    /*
     * Eliminated/disqualified/completed participants cannot
     * submit answers.
     */

    if (
      participant.status === ParticipantStatus.ELIMINATED ||
      participant.status === ParticipantStatus.DISQUALIFIED ||
      participant.status === ParticipantStatus.COMPLETED
    ) {
      throw new ForbiddenException({
        success: false,
        code: 'PARTICIPANT_NOT_ACTIVE',
        message: 'You are no longer eligible to participate in this quiz.',
        status: 403,
      });
    }

    /*
     * ============================================================
     * 3. VALIDATE ROUND
     * ============================================================
     */

    if (room.currentRound !== roundNumber) {
      throw new BadRequestException({
        success: false,
        code: 'INVALID_ROUND',
        message: 'This is not the currently active round.',
        status: 400,
      });
    }

    if (participant.currentRound !== roundNumber) {
      throw new BadRequestException({
        success: false,
        code: 'PARTICIPANT_NOT_IN_ROUND',
        message: 'You are not currently participating in this round.',
        status: 400,
      });
    }

    /*
     * ============================================================
     * 4. VALIDATE QUESTION
     * ============================================================
     */

    const question =
      await this.questionService.findSolveAndWinQuestionById(questionId);

    if (!question) {
      throw new NotFoundException({
        success: false,
        code: 'QUESTION_NOT_FOUND',
        message: 'Quiz question not found.',
        status: 404,
      });
    }

    /*
     * IMPORTANT:
     *
     * Existence of the question is not enough.
     *
     * We must make sure the submitted question is actually the
     * question currently being asked in this room.
     *
     * How you perform this check depends on how your Quiz/round
     * question structure is currently implemented.
     */

    const isQuestionInCurrentRound = await this.quizRepo.isQuestionInRound(
      room.quizId,
      roundNumber,
      question._id,
    );

    if (!isQuestionInCurrentRound) {
      throw new BadRequestException({
        success: false,
        code: 'QUESTION_NOT_IN_ROUND',
        message: 'This question does not belong to the active round.',
        status: 400,
      });
    }

    /*
     * ============================================================
     * 5. CHECK WHETHER PARTICIPANT ALREADY ANSWERED
     * ============================================================
     */

    const existingAnswer = await this.quizAnswerRepo.findParticipantAnswer(
      room.quizId,
      roundNumber,
      participant.userId,
      question._id,
    );

    if (existingAnswer) {
      throw new ConflictException({
        success: false,
        code: 'QUESTION_ALREADY_ANSWERED',
        message: 'You have already answered this question.',
        status: 409,
      });
    }

    /*
     * ============================================================
     * 6. CALCULATE SERVER-SIDE TIME
     * ============================================================
     */

    if (!room.questionStartedAt) {
      throw new BadRequestException({
        success: false,
        code: 'QUESTION_TIMER_NOT_STARTED',
        message: 'The timer for this question has not started.',
        status: 400,
      });
    }

    const answeredAt = new Date();

    const timeTakenInSeconds = Math.max(
      0,
      Math.round(
        (answeredAt.getTime() - room.questionStartedAt.getTime()) / 1000,
      ),
    );

    /*
     * Reject answers that arrived after the question timer ended.
     */

    if (
      room.questionEndsAt &&
      answeredAt.getTime() > room.questionEndsAt.getTime()
    ) {
      throw new BadRequestException({
        success: false,
        code: 'TIME_EXPIRED',
        message: 'The time allowed for this question has expired.',
        status: 400,
      });
    }

    /*
     * ============================================================
     * 7. DETERMINE WHETHER THE ANSWER IS CORRECT
     * ============================================================
     */

    // const normalizedSelectedAnswer = selectedAnswer.trim().toUpperCase();

    // const normalizedCorrectAnswer = question.correctAnswer.trim().toUpperCase();

    const selectedAnswerObjectId = new Types.ObjectId(selectedAnswerId);

    const answerBelongsToQuestion = question.options.some(
      (option) => option._id.toString() === selectedAnswerObjectId.toString(),
    );

    if (!answerBelongsToQuestion) {
      throw new BadRequestException({
        message: 'Selected answer does not belong to this question.',
        success: false,
        status: 400,
      });
    }

    const isCorrect = question.correctAnswers.some(
      (correctAnswerId) =>
        correctAnswerId.toString() === selectedAnswerObjectId.toString(),
    );

    // const isCorrect = normalizedSelectedAnswer === normalizedCorrectAnswer;

    /*
     * Default:
     *
     * Every answer receives zero points.
     *
     * A correct answer will only receive points if the participant
     * successfully claims QuizQuestionWinner.
     */

    const points = 1;
    let scoreAwarded = 0;
    let isFirstCorrectAnswer = false;

    /*
     * ============================================================
     * 8. CLAIM QUESTION WINNER
     * ============================================================
     *
     * THIS IS THE CRITICAL PART.
     *
     * We only attempt to create QuizQuestionWinner when the answer
     * is correct.
     *
     * The unique database index on:
     *
     * quizId + roundNumber + questionId
     *
     * guarantees that only one participant can successfully
     * claim the points.
     */

    if (isCorrect) {
      try {
        const winner = await this.quizQuestionWinnerRepo.claimQuestionWinner({
          quizId: room.quizId,
          roomId: room._id,
          questionId: question._id,
          roundNumber,
          userId: new Types.ObjectId(userId),
          scoreAwarded: points,
          awardedAt: answeredAt,
        });

        /*
         * If the insert succeeds, this participant is the first
         * correct participant.
         */

        if (winner) {
          scoreAwarded = points;
          isFirstCorrectAnswer = true;
        }
      } catch (error) {
        /*
         * MongoDB duplicate-key error means another participant
         * has already claimed this question.
         *
         * Therefore this participant is still correct, but receives
         * zero points.
         */

        if (!this.isDuplicateKeyError(error)) {
          throw error;
        }

        scoreAwarded = 0;
        isFirstCorrectAnswer = false;
      }
    }

    /*
     * ============================================================
     * 9. SAVE QUIZ ANSWER
     * ============================================================
     *
     * IMPORTANT:
     *
     * Even if another participant already won the points, we still
     * record this answer.
     *
     * For example:
     *
     * A → correct → 10 points
     * B → correct → 0 points
     *
     * B's answer is still a correct answer.
     */

    const quizAnswer = await this.quizAnswerRepo.createParticipantQuizAnswer({
      quizId: room.quizId,
      roomId: room._id,
      userId: new Types.ObjectId(userId),
      questionId: new Types.ObjectId(questionId),
      roundNumber,
      selectedAnswerId: new Types.ObjectId(selectedAnswerId),
      isCorrect,
      isFirstCorrectAnswer,
      scoreAwarded,
      timeTakenInSeconds,
      answeredAt,
    });

    if (!quizAnswer) {
      throw new BadRequestException({
        success: false,
        code: 'PARTICIPANT_QUIZ_ANSWER_NOT_CREATED',
        message: 'Quiz participant answer not created.',
        status: 400,
      });
    }

    /*
     * ============================================================
     * 10. UPDATE QUIZ PARTICIPANT
     * ============================================================
     *
     * totalScore is cumulative across all rounds.
     */

    const updatedParticipant = await this.participantRepo.incrementScoreAndTime(
      room.quizId,
      participant.userId,
      scoreAwarded,
      timeTakenInSeconds,
    );

    if (!updatedParticipant) {
      throw new NotFoundException({
        success: false,
        code: 'PARTICIPANT_NOT_FOUND',
        message: 'Quiz participant could not be updated.',
        status: 404,
      });
    }

    /*
     * ============================================================
     * 11. UPDATE QUIZ LEADERBOARD
     * ============================================================
     *
     * The leaderboard contains the participant's summary for THIS
     * round.
     *
     * roundScore = points earned in this round
     * totalScore = cumulative score after this answer
     */

    const updatedLeaderboard =
      await this.leaderboardRepo.upsertAndIncrementEntry({
        quizId: room.quizId,
        roundNumber,
        userId: new Types.ObjectId(userId),
        roundScore: scoreAwarded,
        totalScore: updatedParticipant.totalScore,
        correctAnswers: isCorrect ? 1 : 0,
        answeredQuestions: 1,
        timeTakenInSeconds,
        isEliminated:
          updatedParticipant.status === ParticipantStatus.ELIMINATED,
      });

    const leaderboardEntry = updatedLeaderboard.entries.find(
      (entry) =>
        entry.userId.toString() === new Types.ObjectId(userId).toString(),
    );

    /*
     * ============================================================
     * 12. RETURN RESULT
     * ============================================================
     */

    const selectedAnswer = question.options.find(
      (option) => option._id.toString() === selectedAnswerObjectId.toString(),
    );

    return {
      success: true,
      data: {
        leaderboardData: updatedLeaderboard,
        answerId: quizAnswer._id,
        quizId: room.quizId,
        roomId: room.roomId,
        roundNumber,
        questionId,

        selectedAnswer: selectedAnswer,

        isCorrect,

        /*
         * true only if this participant successfully claimed
         * the points for being the first correct answer.
         */
        isFirstCorrectAnswer,

        scoreAwarded,

        roundScore: leaderboardEntry?.roundScore ?? scoreAwarded,

        totalScore: updatedParticipant.totalScore,

        timeTakenInSeconds,

        message: isCorrect
          ? isFirstCorrectAnswer
            ? 'Correct answer. You received the points for being the first correct participant.'
            : 'Correct answer. Another participant answered correctly first, so no points were awarded.'
          : 'Incorrect answer.',
      },
    };
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }
}
