import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtUser } from '../../common/types/jwt-user.type';
import { PracticeWalletService } from '../practice-wallet/practice-wallet.service';
import { SubjectsService } from '../subjects/subjects.service';
import { AddQuestionsToContestSubjectDto } from './dtos/add-questions-to-contest-subject.dto';
import { AddSubjectsToContestDto } from './dtos/add-subjects-to-contest.dto';
import { CreateSolveAndWinContestDto } from './dtos/create-contest.dto';
import { RemoveSubjectsFromContestDto } from './dtos/remove-subjects-from-contest.dto';
import { SubmitSolveAndWinSubjectDto } from './dtos/submit-subject.dto';
import { UpdateParticipationAnswersDto } from './dtos/update-answers.dto';
import { UpdateSolveAndWinContestDto } from './dtos/update-contest.dto';
import { UpdateRemainingTimeDto } from './dtos/update-remaining-time.dto';
import { SolveAndWinContestRepository } from './repositories/solve-and-win-contest.repository';
import { SolveAndWinParticipationRepository } from './repositories/solve-and-win-participant.repository';
import { SolveAndWinQuestionRepository } from './repositories/solve-and-win-question.repository';
import {
  SolveAndWinContest,
  SolveAndWinContestStatus,
} from './schemas/solve-and-win-contest.schema';
import {
  ParticipationQuestion,
  ParticipationSubject,
  SolveAndWinParticipationStatus,
} from './schemas/solve-and-win-participantion.schema';
import { SOLVE_AND_WIN_DIFFICULTY_MARKS } from './schemas/solve-and-win-question.schema';

@Injectable()
export class SolveAndWinService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly contestRepo: SolveAndWinContestRepository,
    private readonly participationRepo: SolveAndWinParticipationRepository,
    private readonly solveAndWinQuestionRepo: SolveAndWinQuestionRepository,

    private readonly subjectService: SubjectsService,
    private readonly practiceWalletService: PracticeWalletService,
  ) {}

  async createSolveAndWinContest(dto: CreateSolveAndWinContestDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(
      startDate.getTime() + dto.windowPeriod * 24 * 60 * 60 * 1000,
    );

    if (startDate >= endDate) {
      throw new BadRequestException({
        message: 'End date must be after start date.',
        success: false,
        status: 400,
      });
    }

    const subjectIds = dto.subjects.map(
      (id) => new Types.ObjectId(id.subjectId),
    );

    const uniqueSubjectIds = [
      ...new Map(subjectIds.map((id) => [id.toString(), id])).values(),
    ];

    if (uniqueSubjectIds.length !== subjectIds.length) {
      throw new BadRequestException({
        message: 'Duplicate subjects are not allowed.',
        success: false,
        status: 400,
      });
    }

    for (const subject of dto.subjects) {
      const { expectedNoOfQuestions, difficultyBreakdown } = subject;

      const totalDifficultyQuestions =
        difficultyBreakdown.easy +
        difficultyBreakdown.medium +
        difficultyBreakdown.hard;

      if (totalDifficultyQuestions !== expectedNoOfQuestions) {
        throw new BadRequestException({
          message: `The difficulty breakdown for subject ${subject.subjectId} must equal the expected number of questions.`,
          success: false,
          status: 400,
        });
      }
    }

    const data: Partial<SolveAndWinContest> = {
      title: dto.title.trim(),
      description: dto.description.trim(),
      category: dto.category.trim(),
      amountToBeWonInKobo: dto.amountToBeWonInKobo,
      entryPoints: dto.entryPoints,
      startDate,
      endDate,
      windowPeriod: dto.windowPeriod,

      subjects: dto.subjects.map((item) => ({
        subjectId: new Types.ObjectId(item.subjectId),
        expectedNoOfQuestions: item.expectedNoOfQuestions,
        difficultyBreakdown: item.difficultyBreakdown,
        durationInSeconds: item.durationInMinutes * 60,
      })),

      status: dto.status,
    };

    const response = await this.contestRepo.createSolveAndWinContest(data);

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to create solve and win contest.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  async findAllSolveAndWinContests(queryDto: QueryWithPaginationDto) {
    const response =
      await this.contestRepo.findAllSolveAndWinContests(queryDto);

    return response;
  }

  async findActiveContests() {
    const response = await this.contestRepo.findActiveContests();

    return response;
  }

  async findSolveAndWinContestByIdWithSubjects(contestId: string) {
    const id = new Types.ObjectId(contestId);

    const response =
      await this.contestRepo.findSolveAndWinContestByIdWithSubjects(id);

    if (!response) {
      throw new NotFoundException({
        message: 'Solve and win contest not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }
  async findSolveAndWinContestById(contestId: string) {
    const id = new Types.ObjectId(contestId);

    const response = await this.contestRepo.findSolveAndWinContestById(id);

    if (!response) {
      throw new NotFoundException({
        message: 'Solve and win contest not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }

  async joinSolveAndWinContestById(user: JwtUser, contestId: string) {
    const id = new Types.ObjectId(contestId);
    const contest = await this.contestRepo.findSolveAndWinContestById(id);

    if (!contest) {
      throw new NotFoundException({
        message: 'Solve and win contest not found.',
        success: false,
        status: 404,
      });
    }

    const userPracticeWallet =
      await this.practiceWalletService.getOrCreateUserPracticeWallet(user);

    if (userPracticeWallet.points < contest.entryPoints) {
      throw new BadRequestException({
        message:
          'Insufficient Practice points. Please practice more of our practice questions to earn more points before participating in this competition.',
        success: false,
        status: 400,
      });
    }

    const userId = new Types.ObjectId(user.sub.toString());

    const alreadyJoinedContest =
      await this.participationRepo.findSolveAndWinParticipationByIdAndUserId(
        contest._id,
        userId,
      );

    if (alreadyJoinedContest) {
      throw new ConflictException({
        message: 'You have joined this contest earlier.',
        success: false,
        status: 409,
      });
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const payload = {
        userId: user.sub.toString(),
        points: contest.entryPoints,
        description: `Points is to be deducted for ${contest.title} with contest ID: ${contest._id.toString()}.`,
        contestId: contest._id.toString(),
        session,
      };

      const debitContestPoint =
        await this.practiceWalletService.debitPracticePointsForContest(payload);

      const contestParticipation =
        await this.participationRepo.createSolveAndWinParticipation(
          contest._id,
          userId,
          contest.entryPoints,
        );

      await session.commitTransaction();

      return contestParticipation;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getAllMyContestParticipations(
    user: JwtUser,
    dto: QueryWithPaginationDto,
  ) {
    const userId = new Types.ObjectId(user.sub.toString());

    const response = await this.participationRepo.getAllMyContestParticipations(
      userId,
      dto,
    );

    return response;
  }

  async findSolveAndWinByStatus(status: SolveAndWinContestStatus) {
    const response = await this.contestRepo.findSolveAndWinByStatus(status);

    if (response.length === 0) {
      throw new NotFoundException({
        message: 'Solve and win contests not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }

  async updateSolveAndWinById(
    contestId: string,
    dto: UpdateSolveAndWinContestDto,
  ) {
    const id = new Types.ObjectId(contestId);

    const contest = await this.contestRepo.findSolveAndWinContestById(id);

    if (!contest) {
      throw new NotFoundException({
        message: 'Solve and Win contest not found.',
        success: false,
        status: 404,
      });
    }

    this.ensureDraft(contest);

    const updateData: Partial<SolveAndWinContest> = {};

    if (dto.title !== undefined) {
      updateData.title = dto.title.trim();
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description.trim();
    }

    if (dto.amountToBeWonInKobo !== undefined) {
      updateData.amountToBeWonInKobo = dto.amountToBeWonInKobo;
    }

    if (dto.entryPoints !== undefined) {
      updateData.entryPoints = dto.entryPoints;
    }

    if (dto.startDate !== undefined) {
      updateData.startDate = new Date(dto.startDate);
    }

    if (dto.windowPeriod !== undefined) {
      const windowPeriod = dto.windowPeriod;

      updateData.windowPeriod = windowPeriod;

      const startDate = dto.startDate
        ? new Date(dto.startDate)
        : contest.startDate;

      updateData.endDate = new Date(
        startDate.getTime() + windowPeriod * 24 * 60 * 60 * 1000,
      );
    }

    const finalStartDate = updateData.startDate ?? contest.startDate;

    const finalEndDate = updateData.endDate ?? contest.endDate;

    if (finalStartDate >= finalEndDate) {
      throw new BadRequestException({
        message: 'End date must be after start date.',
        success: false,
        status: 400,
      });
    }

    if (dto.subjects !== undefined) {
      const subjectIds = dto.subjects.map(
        (item) => new Types.ObjectId(item.subjectId),
      );

      const uniqueSubjectIds = [
        ...new Map(
          subjectIds.map((subjectId) => [subjectId.toString(), subjectId]),
        ).values(),
      ];

      updateData.subjects = dto.subjects.map((item) => ({
        subjectId: new Types.ObjectId(item.subjectId),
        expectedNoOfQuestions: item.expectedNoOfQuestions,
        difficultyBreakdown: item.difficultyBreakdown,
        durationInSeconds: item.durationInMinutes * 60,
      }));
    }

    const response = await this.contestRepo.updateSolveAndWinById(
      id,
      updateData,
    );

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to update solve and win.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  async addQuestionsForASubjectInsideSolveAndWinQuestionDatabase(
    subjectId: string,
    dto: AddQuestionsToContestSubjectDto,
  ) {
    this.validateObjectId(subjectId);

    const subjectObjectId = new Types.ObjectId(subjectId);

    const contestSubject = await this.subjectService.getSubjectById(subjectId);

    if (!contestSubject) {
      throw new BadRequestException({
        message: 'The selected subject does not belong to this contest.',
        success: false,
        status: 400,
      });
    }

    if (!dto.questions?.length) {
      throw new BadRequestException({
        message: 'At least one question is required.',
        success: false,
        status: 400,
      });
    }

    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const questionsToCreate = dto.questions.map((question) => {
        const options = question.options.map((option) => ({
          _id: new Types.ObjectId(),
          label: option.label,
          value: option.value,
        }));

        const correctOptions = options.filter((option) =>
          question.correctAnswers.includes(option.value),
        );

        if (correctOptions.length !== question.correctAnswers.length) {
          throw new BadRequestException({
            message: `One or more correct answers do not exist in the options for question: "${question.question}"`,
            success: false,
            status: 400,
          });
        }

        const correctAnswers = correctOptions.map((option) => option._id);

        return {
          ...question,
          subjectId: subjectObjectId,
          options,
          correctAnswers,
        };
      });

      const createdQuestions =
        await this.solveAndWinQuestionRepo.createManySolveAndWinQuestions(
          questionsToCreate,
          session,
        );
      if (!createdQuestions.length) {
        throw new BadRequestException({
          message: 'Unable to create questions.',
          success: false,
          status: 400,
        });
      }

      await session.commitTransaction();

      return createdQuestions;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async activateContest(contestId: string) {
    this.validateObjectId(contestId);

    const id = new Types.ObjectId(contestId);

    const contest = await this.contestRepo.findSolveAndWinContestById(id);

    if (!contest) {
      throw new NotFoundException({
        message: 'Solve and Win contest not found.',
        success: false,
        status: 404,
      });
    }

    if (contest.status !== SolveAndWinContestStatus.DRAFT) {
      throw new BadRequestException({
        message: 'Only a draft contest can be activated.',
        success: false,
        status: 400,
      });
    }

    if (!contest.subjects?.length) {
      throw new BadRequestException({
        message: 'Contest must have at least one subject before activation.',
        success: false,
        status: 400,
      });
    }

    // for (const subject of contest.subjects) {
    //   if (!subject.questions?.length) {
    //     throw new BadRequestException({
    //       message:
    //         'Every contest subject must have at least one question before activation.',
    //       success: false,
    //       status: 400,
    //     });
    //   }
    // }

    const now = new Date();

    let status: SolveAndWinContestStatus;

    if (contest.startDate > now) {
      status = SolveAndWinContestStatus.UPCOMING;
    } else if (contest.startDate <= now && contest.endDate > now) {
      status = SolveAndWinContestStatus.ACTIVE;
    } else {
      throw new BadRequestException({
        message: 'The contest end date has already passed.',
        success: false,
        status: 400,
      });
    }

    const response = await this.contestRepo.updateSolveAndWinById(id, {
      status,
    });

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to activate contest.',
        success: false,
        status: 400,
      });
    }

    return response;
  }
  async deactivateContest(contestId: string) {
    this.validateObjectId(contestId);

    const id = new Types.ObjectId(contestId);

    const contest = await this.contestRepo.findSolveAndWinContestById(id);

    if (!contest) {
      throw new NotFoundException({
        message: 'Solve and Win contest not found.',
        success: false,
        status: 404,
      });
    }

    // for (const subject of contest.subjects) {
    //   if (!subject.questions?.length) {
    //     throw new BadRequestException({
    //       message:
    //         'Every contest subject must have at least one question before activation.',
    //       success: false,
    //       status: 400,
    //     });
    //   }
    // }

    const response = await this.contestRepo.deactivateContest(id);

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to de-activate contest.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  async cancelContest(contestId: string) {
    this.validateObjectId(contestId);

    const id = new Types.ObjectId(contestId);

    const contest = await this.contestRepo.findSolveAndWinContestById(id);

    if (!contest) {
      throw new NotFoundException({
        message: 'Solve and Win contest not found.',
        success: false,
        status: 404,
      });
    }

    if (contest.status === SolveAndWinContestStatus.COMPLETED) {
      throw new BadRequestException({
        message: 'A completed contest cannot be cancelled.',
        success: false,
        status: 400,
      });
    }

    if (contest.status === SolveAndWinContestStatus.CANCELLED) {
      throw new BadRequestException({
        message: 'Contest is already cancelled.',
        success: false,
        status: 400,
      });
    }

    const response = await this.contestRepo.updateSolveAndWinById(id, {
      status: SolveAndWinContestStatus.CANCELLED,
    });

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to cancel contest.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  async deleteContest(contestId: string) {
    this.validateObjectId(contestId);

    const id = new Types.ObjectId(contestId);

    const contest = await this.contestRepo.findSolveAndWinContestById(id);

    if (!contest) {
      throw new NotFoundException({
        message: 'Solve and Win contest not found.',
        success: false,
        status: 404,
      });
    }

    if (contest.status !== SolveAndWinContestStatus.DRAFT) {
      throw new BadRequestException({
        message: 'Only draft contests can be permanently deleted.',
        success: false,
        status: 400,
      });
    }

    const response = await this.contestRepo.deleteContest(id);

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to delete contest.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  async addSubjectsToContest(contestId: string, dto: AddSubjectsToContestDto) {
    this.validateObjectId(contestId);

    const contestObjectId = new Types.ObjectId(contestId);

    const contest =
      await this.contestRepo.findSolveAndWinContestById(contestObjectId);

    if (!contest) {
      throw new NotFoundException({
        message: 'Solve and Win contest not found.',
        success: false,
        status: 404,
      });
    }

    this.ensureDraft(contest);

    // Convert IDs
    const subjectIds = dto.subjectIds.map(
      (subjectId) => new Types.ObjectId(subjectId),
    );

    const uniqueSubjectIds = [
      ...new Map(
        subjectIds.map((subjectId) => [subjectId.toString(), subjectId]),
      ).values(),
    ];

    for (const subjectId of uniqueSubjectIds) {
      const exists = await this.contestRepo.checkSubjectExistInContest(
        contestObjectId,
        subjectId,
      );

      if (exists) {
        throw new ConflictException({
          message: `Subject ${subjectId.toString()} already exists in this contest.`,
          success: false,
          status: 409,
        });
      }
    }

    const response = await this.contestRepo.addSubjectsToContest(
      contestObjectId,
      uniqueSubjectIds,
    );

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to add subjects to contest.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  async removeSubjectsFromContest(
    contestId: string,
    dto: RemoveSubjectsFromContestDto,
  ) {
    this.validateObjectId(contestId);

    const contestObjectId = new Types.ObjectId(contestId);

    const contest =
      await this.contestRepo.findSolveAndWinContestById(contestObjectId);

    if (!contest) {
      throw new NotFoundException({
        message: 'Solve and Win contest not found.',
        success: false,
        status: 404,
      });
    }

    this.ensureDraft(contest);

    const subjectIds = dto.subjectIds.map(
      (subjectId) => new Types.ObjectId(subjectId),
    );

    const uniqueSubjectIds = [
      ...new Map(
        subjectIds.map((subjectId) => [subjectId.toString(), subjectId]),
      ).values(),
    ];

    for (const subjectId of uniqueSubjectIds) {
      const exists = await this.contestRepo.checkSubjectExistInContest(
        contestObjectId,
        subjectId,
      );

      if (!exists) {
        throw new NotFoundException({
          message: `Subject ${subjectId.toString()} does not belong to this contest.`,
          success: false,
          status: 404,
        });
      }
    }

    const response = await this.contestRepo.removeSubjectsFromContest(
      contestObjectId,
      uniqueSubjectIds,
    );

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to remove subjects from contest.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  async getAllContestParticipations(queryDto: QueryWithPaginationDto) {
    const response =
      await this.participationRepo.getAllContestParticipations(queryDto);

    return response;
  }
  async getAllContestParticipationsOfLoggedInUser(
    user: JwtUser,
    queryDto: QueryWithPaginationDto,
  ) {
    const response = await this.participationRepo.getAllMyContestParticipations(
      new Types.ObjectId(user.sub.toString()),
      queryDto,
    );

    return response;
  }
  async getAllContestParticipationsYetToStart(
    user: JwtUser,
    userId: string,
    queryDto: QueryWithPaginationDto,
  ) {
    if (userId !== user.sub.toString()) {
      throw new ConflictException({
        message: 'You can only view the contest that you have joined.',
        success: false,
        status: 409,
      });
    }

    const response =
      await this.participationRepo.getAllContestParticipationsYetToStart(
        new Types.ObjectId(user.sub.toString()),
        queryDto,
      );

    return response;
  }

  async startSolveAndWinContest(
    contestId: string,
    subjectId: string,
    user: JwtUser,
  ) {
    const id = new Types.ObjectId(contestId);
    const subId = new Types.ObjectId(subjectId);
    const userId = new Types.ObjectId(user.sub.toString());

    const participationDoc =
      await this.participationRepo.findSolveAndWinParticipationByIdAndUserId(
        id,
        userId,
      );

    if (!participationDoc) {
      throw new NotFoundException({
        message: `You did not put in for the solve and win contest with ID: ${contestId}.`,
        success: false,
        status: 404,
      });
    }

    const contest = await this.contestRepo.findSolveAndWinContestById(id);

    if (!contest) {
      throw new NotFoundException({
        message: `Contest with ID: ${contestId} is not found.`,
        success: false,
        status: 404,
      });
    }

    const now = new Date();

    if (contest.startDate && now < new Date(contest.startDate)) {
      throw new BadRequestException({
        message: `This contest will officially start on ${new Date(contest.startDate).toLocaleString()}.`,
        // message: `This contest has officially closed on ${new Date(contest.endDate).toISOString()}.`,
        success: false,
        status: 400,
      });
    }

    if (contest.endDate && now > new Date(contest.endDate)) {
      throw new BadRequestException({
        message: `This contest has officially closed on ${new Date(contest.endDate).toLocaleString()}.`,
        // message: `This contest has officially closed on ${new Date(contest.endDate).toISOString()}.`,
        success: false,
        status: 400,
      });
    }

    if (participationDoc.subjects && participationDoc.subjects.length > 0) {
      const existingSubject = participationDoc.subjects.find(
        (s) => s.subjectId.toString() === subId.toString(),
      );

      if (!existingSubject) {
        throw new BadRequestException({
          message: `The selected subject is not part of this contest or your registered subjects.`,
          success: false,
          status: 400,
        });
      }

      if (existingSubject.submittedAt) {
        throw new BadRequestException({
          message: `You have already submitted this subject in this contest.`,
          success: false,
          status: 400,
        });
      }

      if (existingSubject.startedAt) {
        const elapsedSeconds = Math.floor(
          (now.getTime() - new Date(existingSubject.startedAt).getTime()) /
            1000,
        );

        const currentDuration =
          existingSubject.remainingDurationInSeconds ??
          existingSubject.durationInSeconds;

        existingSubject.remainingDurationInSeconds = Math.max(
          0,
          currentDuration - elapsedSeconds,
        );
      } else {
        existingSubject.remainingDurationInSeconds =
          existingSubject.remainingDurationInSeconds ||
          existingSubject.durationInSeconds;

        // existingSubject.remainingDurationInSeconds =
        //   existingSubject.remainingDurationInSeconds ??
        //   existingSubject.durationInSeconds;
      }

      if (existingSubject.remainingDurationInSeconds <= 0) {
        throw new BadRequestException({
          message: `Your allocated time for this subject has expired.`,
          success: false,
          status: 400,
        });
      }

      // const calculatedSessionEndBefore = new Date(
      //   now.getDate() + existingSubject.remainingDurationInSeconds * 1000,
      // );

      const calculatedSessionEnd = new Date(
        now.getTime() + existingSubject.remainingDurationInSeconds * 1000,
      );

      console.log('calculatedSessionEnd:', calculatedSessionEnd);

      existingSubject.startedAt = now;
      existingSubject.endsAt =
        contest.endDate && calculatedSessionEnd > new Date(contest.endDate)
          ? new Date(contest.endDate)
          : calculatedSessionEnd;

      await this.participationRepo.updateParticipationSubjects(
        participationDoc._id,
        participationDoc.subjects,
      );

      const plainDoc = participationDoc.toObject();
      plainDoc.subjects = [existingSubject];

      return this.sanitizeParticipation(plainDoc);
    }

    const targetedContestSubject = contest.subjects.find(
      (s) => s.subjectId.toString() === subId.toString(),
    );

    if (!targetedContestSubject) {
      throw new BadRequestException({
        message: `Subject with ID: ${subjectId} is not offered in this contest.`,
        success: false,
        status: 400,
      });
    }

    const subjects: ParticipationSubject[] = [];

    for (const contestSubject of contest.subjects) {
      const difficultyTotal =
        contestSubject.difficultyBreakdown.easy +
        contestSubject.difficultyBreakdown.medium +
        contestSubject.difficultyBreakdown.hard;

      if (difficultyTotal !== contestSubject.expectedNoOfQuestions) {
        throw new BadRequestException({
          message: `Difficulty breakdown does not match expected number of questions.`,
          success: false,
          status: 400,
        });
      }

      const questions =
        await this.solveAndWinQuestionRepo.findRandomQuestionsByContestSubject(
          contestSubject.subjectId,
          contestSubject.difficultyBreakdown,
        );

      if (questions.length !== contestSubject.expectedNoOfQuestions) {
        throw new BadRequestException({
          message: `There are not enough questions available for one of the contest subjects.`,
          success: false,
          status: 400,
        });
      }

      const questionSnapshots: ParticipationQuestion[] = questions.map(
        (question) => ({
          questionId: question._id,
          question: question.question,
          instruction: question.instruction,
          content: question.content,
          media: question.media,
          options: this.shuffleArray(question.options),
          section: question.section,
          questionType: question.questionType,
          correctAnswers: question.correctAnswers,
          isMultipleAnswer: question.isMultipleAnswer,
          explanation: question.explanation,
          explanationSteps: question.explanationSteps,
          difficulty: question.difficulty,
          marks: SOLVE_AND_WIN_DIFFICULTY_MARKS[question.difficulty],
          selectedOption: null,
          isCorrect: null,
          marksAwarded: 0,
        }),
      );

      const isSelectedSubject =
        contestSubject.subjectId.toString() === subId.toString();

      let subjectStartedAt: Date | null = null;
      let subjectEndsAt: Date | null = null;

      if (isSelectedSubject) {
        subjectStartedAt = now;

        const calculatedSessionEnd = new Date(
          now.getTime() + contestSubject.durationInSeconds * 1000,
        );

        subjectEndsAt =
          contest.endDate && calculatedSessionEnd > new Date(contest.endDate)
            ? new Date(contest.endDate)
            : calculatedSessionEnd;
      }

      subjects.push({
        subjectId: contestSubject.subjectId,
        questions: questionSnapshots,
        correctAnswers: 0,
        wrongAnswers: 0,
        unansweredQuestions: questionSnapshots.length,
        score: 0,
        durationInSeconds: contestSubject.durationInSeconds,
        remainingDurationInSeconds: contestSubject.durationInSeconds,
        startedAt: subjectStartedAt,
        endsAt: subjectEndsAt,
        submittedAt: null,
      });
    }

    const updatedParticipation =
      await this.participationRepo.updateParticipationSubjects(
        participationDoc._id,
        subjects,
      );

    if (!updatedParticipation) {
      throw new BadRequestException({
        message: 'Unable to save the generated contest questions.',
        success: false,
        status: 400,
      });
    }

    const plainDoc = updatedParticipation.toObject();
    plainDoc.subjects = plainDoc.subjects.filter(
      (s) => s.subjectId.toString() === subId.toString(),
    );

    const response = this.sanitizeParticipation(plainDoc);

    return response;
  }
  async updateSolveAndWinContestSubjectQuestionAnswers(
    contestId: string,
    subjectId: string,
    user: JwtUser,
    dto: UpdateParticipationAnswersDto,
  ) {
    const cId = new Types.ObjectId(contestId);
    const sId = new Types.ObjectId(subjectId);
    const userId = new Types.ObjectId(user.sub.toString());

    const contest = await this.contestRepo.findSolveAndWinContestById(cId);

    if (!contest) {
      throw new NotFoundException({
        message: `Contest with ID: ${contestId} not found.`,
        success: false,
        status: 404,
      });
    }

    const now = new Date();
    const contestEndDate = new Date(contest.endDate);
    const contestStartDate = new Date(contest.startDate);

    if (now < contestStartDate) {
      throw new BadRequestException({
        message: `You can not update solve and win contest when contest has not officially started. Contest starts date is: ${contestStartDate.toISOString()}.`,
        success: false,
        status: 400,
      });
    }

    if (now > contestEndDate) {
      throw new BadRequestException({
        message: `You can not update solve and win contest when contest has ended. Contest end date is: ${contestEndDate.toISOString()}.`,
        success: false,
        status: 400,
      });
    }

    const participationDoc =
      await this.participationRepo.findSolveAndWinParticipationByIdAndUserId(
        cId,
        userId,
      );

    if (!participationDoc) {
      throw new NotFoundException({
        message: 'Participation record not found for this contest.',
        success: false,
        status: 404,
      });
    }

    const targetSubject = participationDoc.subjects.find(
      (s) => s.subjectId.toString() === sId.toString(),
    );

    if (!targetSubject) {
      throw new BadRequestException({
        message:
          'Target subject is not part of your active contest participation.',
        success: false,
        status: 400,
      });
    }

    if (targetSubject.submittedAt) {
      throw new BadRequestException({
        message: 'This subject has already been submitted.',
        success: false,
        status: 400,
      });
    }

    if (!targetSubject.startedAt) {
      throw new BadRequestException({
        message:
          'You must start the subject session before submitting answers.',
        success: false,
        status: 400,
      });
    }

    const elapsedSeconds = Math.floor(
      (now.getTime() - new Date(targetSubject.startedAt).getTime()) / 1000,
    );
    const remainingTime = Math.max(
      0,
      targetSubject.durationInSeconds - elapsedSeconds,
    );

    if (remainingTime <= 0) {
      throw new BadRequestException({
        message: 'Your allocated time for this subject has expired.',
        success: false,
        status: 400,
      });
    }

    targetSubject.remainingDurationInSeconds = remainingTime;

    const answerMap = new Map(
      dto.answers.map((item) => [item.questionId, item.selectedOption]),
    );

    targetSubject.questions.forEach((question) => {
      const qId = question.questionId.toString();
      if (answerMap.has(qId)) {
        const selectedOpt = new Types.ObjectId(answerMap.get(qId));
        question.selectedOption = selectedOpt;

        const isCorrect = question.correctAnswers.some(
          (ca) => ca.toString() === selectedOpt.toString(),
        );

        question.isCorrect = isCorrect;
        question.marksAwarded = isCorrect ? question.marks : 0;
      }
    });

    let subjectCorrect = 0;
    let subjectWrong = 0;
    let subjectUnanswered = 0;
    let subjectScore = 0;

    targetSubject.questions.forEach((q) => {
      if (!q.selectedOption) {
        subjectUnanswered++;
      } else if (q.isCorrect) {
        subjectCorrect++;
        subjectScore += q.marksAwarded;
      } else {
        subjectWrong++;
      }
    });

    targetSubject.correctAnswers = subjectCorrect;
    targetSubject.wrongAnswers = subjectWrong;
    targetSubject.unansweredQuestions = subjectUnanswered;
    targetSubject.score = subjectScore;

    let overallScore = 0;
    let overallCorrect = 0;
    let overallWrong = 0;
    let overallUnanswered = 0;

    participationDoc.subjects.forEach((sub) => {
      overallScore += sub.score;
      overallCorrect += sub.correctAnswers;
      overallWrong += sub.wrongAnswers;
      overallUnanswered += sub.unansweredQuestions;
    });

    const updatedDoc = await this.participationRepo.updateSubjectAnswers(
      participationDoc._id,
      participationDoc.subjects,
      overallScore,
      overallCorrect,
      overallWrong,
      overallUnanswered,
    );

    if (!updatedDoc) {
      throw new BadRequestException({
        message: 'Failed to record your answers.',
        success: false,
        status: 400,
      });
    }

    const plainDoc = updatedDoc.toObject();
    plainDoc.subjects = plainDoc.subjects.filter(
      (s) => s.subjectId.toString() === sId.toString(),
    );

    return this.sanitizeParticipation(plainDoc);
  }
  async submitSolveAndWinContestSubjectQuestion(
    contestId: string,
    subjectId: string,
    user: JwtUser,
    dto: SubmitSolveAndWinSubjectDto,
  ) {
    const cId = new Types.ObjectId(contestId);
    const sId = new Types.ObjectId(subjectId);
    const userId = new Types.ObjectId(user.sub.toString());

    const contest = await this.contestRepo.findSolveAndWinContestById(cId);

    if (!contest) {
      throw new NotFoundException({
        message: `Contest with ID: ${contestId} not found.`,
        success: false,
        status: 404,
      });
    }

    const now = new Date();
    const contestEndDate = new Date(contest.endDate);

    if (now > contestEndDate) {
      throw new BadRequestException({
        message: `You can not submit when contest has ended. Contest end date is: ${contestEndDate.toISOString()}.`,
        success: false,
        status: 400,
      });
    }

    const participationDoc =
      await this.participationRepo.findSolveAndWinParticipationByIdAndUserId(
        cId,
        userId,
      );

    if (!participationDoc) {
      throw new NotFoundException({
        message: 'Participation record not found for this contest.',
        success: false,
        status: 404,
      });
    }

    const targetSubject = participationDoc.subjects.find(
      (s) => s.subjectId.toString() === sId.toString(),
    );

    if (!targetSubject) {
      throw new BadRequestException({
        message:
          'Target subject is not part of your active contest participation.',
        success: false,
        status: 400,
      });
    }

    if (targetSubject.submittedAt) {
      throw new BadRequestException({
        message: 'You have already submitted this subject.',
        success: false,
        status: 400,
      });
    }

    if (!targetSubject.startedAt) {
      throw new BadRequestException({
        message: 'You must start the subject session before submitting.',
        success: false,
        status: 400,
      });
    }

    if (dto.answers && dto.answers.length > 0) {
      const answerMap = new Map(
        dto.answers.map((item) => [item.questionId, item.selectedOption]),
      );

      targetSubject.questions.forEach((question) => {
        const qId = question.questionId.toString();
        if (answerMap.has(qId)) {
          question.selectedOption = new Types.ObjectId(answerMap.get(qId));
        }
      });
    }

    let subjectCorrect = 0;
    let subjectWrong = 0;
    let subjectUnanswered = 0;
    let subjectScore = 0;

    targetSubject.questions.forEach((question) => {
      if (!question.selectedOption) {
        question.isCorrect = false;
        question.marksAwarded = 0;
        subjectUnanswered++;
      } else {
        const isCorrect = question.correctAnswers.some(
          (ca) => ca.toString() === question.selectedOption!.toString(),
        );

        question.isCorrect = isCorrect;
        question.marksAwarded = isCorrect ? question.marks : 0;

        if (isCorrect) {
          subjectCorrect++;
          subjectScore += question.marks;
        } else {
          subjectWrong++;
        }
      }
    });

    targetSubject.correctAnswers = subjectCorrect;
    targetSubject.wrongAnswers = subjectWrong;
    targetSubject.unansweredQuestions = subjectUnanswered;
    targetSubject.score = subjectScore;
    targetSubject.remainingDurationInSeconds = 0;
    targetSubject.submittedAt = now;

    let overallScore = 0;
    let overallCorrect = 0;
    let overallWrong = 0;
    let overallUnanswered = 0;
    let totalPossibleMarks = 0;

    participationDoc.subjects.forEach((sub) => {
      overallScore += sub.score;
      overallCorrect += sub.correctAnswers;
      overallWrong += sub.wrongAnswers;
      overallUnanswered += sub.unansweredQuestions;

      sub.questions.forEach((q) => {
        totalPossibleMarks += q.marks;
      });
    });

    const overallPercentage =
      totalPossibleMarks > 0
        ? Number(((overallScore / totalPossibleMarks) * 100).toFixed(2))
        : 0;

    const allSubjectsSubmitted = participationDoc.subjects.every(
      (sub) => sub.submittedAt !== null,
    );

    const contestStatus = allSubjectsSubmitted
      ? SolveAndWinParticipationStatus.COMPLETED
      : SolveAndWinParticipationStatus.IN_PROGRESS;

    const overallSubmittedAt = allSubjectsSubmitted ? now : null;

    const updatedDoc = await this.participationRepo.submitSubjectParticipation(
      participationDoc._id,
      participationDoc.subjects,
      overallScore,
      overallCorrect,
      overallWrong,
      overallUnanswered,
      overallPercentage,
      contestStatus,
      overallSubmittedAt,
    );

    if (!updatedDoc) {
      throw new BadRequestException({
        message: 'Unable to process subject submission.',
        success: false,
        status: 400,
      });
    }

    const plainDoc = updatedDoc.toObject();
    plainDoc.subjects = plainDoc.subjects.filter(
      (s) => s.subjectId.toString() === sId.toString(),
    );

    return this.sanitizeParticipation(plainDoc);
  }

  async updateSolveAndWinContestSubjectRemainingTime(
    contestId: string,
    subjectId: string,
    dto: UpdateRemainingTimeDto,
    user: JwtUser,
  ) {
    const cId = new Types.ObjectId(contestId);
    const sId = new Types.ObjectId(subjectId);
    const userId = new Types.ObjectId(user.sub.toString());

    const contest = await this.contestRepo.findSolveAndWinContestById(cId);

    if (!contest) {
      throw new NotFoundException({
        message: `Contest with ID: ${contestId} not found.`,
        success: false,
        status: 404,
      });
    }

    const now = new Date();
    const contestEndDate = new Date(contest.endDate);

    const contestStartDate = new Date(contest.startDate);

    if (now < contestStartDate) {
      throw new BadRequestException({
        message: `You can not update solve and win time when contest has not officially started. Contest starts date is: ${contestStartDate.toISOString()}.`,
        success: false,
        status: 400,
      });
    }

    if (now > contestEndDate) {
      throw new BadRequestException({
        message: `You can not update solve and win time when contest has ended. Contest end date is: ${contestEndDate.toISOString()}.`,
        success: false,
        status: 400,
      });
    }

    const participationDoc =
      await this.participationRepo.findSolveAndWinParticipationByIdAndUserId(
        cId,
        userId,
      );

    if (!participationDoc) {
      throw new NotFoundException({
        message: 'Participation record not found for this contest.',
        success: false,
        status: 404,
      });
    }

    const targetSubject = participationDoc.subjects.find(
      (s) => s.subjectId.toString() === sId.toString(),
    );

    if (!targetSubject) {
      throw new BadRequestException({
        message:
          'Target subject is not part of your active contest participation.',
        success: false,
        status: 400,
      });
    }

    if (targetSubject.submittedAt) {
      throw new BadRequestException({
        message: 'This subject has already been submitted.',
        success: false,
        status: 400,
      });
    }

    if (!targetSubject.startedAt) {
      throw new BadRequestException({
        message: 'You have not started this subject session yet.',
        success: false,
        status: 400,
      });
    }

    const serverElapsedSeconds = Math.floor(
      (now.getTime() - new Date(targetSubject.startedAt).getTime()) / 1000,
    );

    const calculatedServerRemaining = Math.max(
      0,
      targetSubject.durationInSeconds - serverElapsedSeconds,
    );

    const synchronizedRemaining = Math.min(
      dto.remainingDurationInSeconds,
      calculatedServerRemaining,
    );

    targetSubject.remainingDurationInSeconds = Math.max(
      0,
      synchronizedRemaining,
    );

    if (targetSubject.remainingDurationInSeconds <= 0) {
      targetSubject.remainingDurationInSeconds = 0;
      targetSubject.submittedAt = now;
    }

    const updatedDoc = await this.participationRepo.updateSubjectRemainingTime(
      participationDoc._id,
      participationDoc.subjects,
    );

    if (!updatedDoc) {
      throw new BadRequestException({
        message: 'Unable to sync remaining time.',
        success: false,
        status: 400,
      });
    }

    const plainDoc = updatedDoc.toObject();
    plainDoc.subjects = plainDoc.subjects.filter(
      (s) => s.subjectId.toString() === sId.toString(),
    );

    return this.sanitizeParticipation(plainDoc);
  }

  async pauseSolveAndWinContest(
    contestId: string,
    subjectId: string,
    user: JwtUser,
  ) {
    const id = new Types.ObjectId(contestId);
    const subId = new Types.ObjectId(subjectId);
    const userId = new Types.ObjectId(user.sub.toString());

    const participationDoc =
      await this.participationRepo.findSolveAndWinParticipationByIdAndUserId(
        id,
        userId,
      );

    if (!participationDoc) {
      throw new NotFoundException({
        message: `You did not put in for the solve and win contest with ID: ${contestId}.`,
        success: false,
        status: 404,
      });
    }

    const subject = participationDoc.subjects.find(
      (s) => s.subjectId.toString() === subId.toString(),
    );

    if (!subject) {
      throw new BadRequestException({
        message: `Subject with ID: ${subjectId} was not found in your participation record.`,
        success: false,
        status: 400,
      });
    }

    if (subject.submittedAt) {
      throw new BadRequestException({
        message: `Cannot pause a subject that has already been submitted.`,
        success: false,
        status: 400,
      });
    }

    if (subject.startedAt) {
      const now = new Date();
      const elapsedSeconds = Math.floor(
        (now.getTime() - new Date(subject.startedAt).getTime()) / 1000,
      );

      const currentDuration =
        subject.remainingDurationInSeconds ?? subject.durationInSeconds;

      subject.remainingDurationInSeconds = Math.max(
        0,
        currentDuration - elapsedSeconds,
      );

      subject.startedAt = null;
      subject.endsAt = null;

      const response = await this.participationRepo.updateParticipationSubjects(
        participationDoc._id,
        participationDoc.subjects,
      );

      return response;
    }

    return {
      message: 'Contest paused successfully.',
    };
  }

  private validateObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException({
        message: `Invalid ID: ${id}`,
        success: false,
        status: 400,
      });
    }
  }

  private ensureDraft(contest: SolveAndWinContest): void {
    if (contest.status !== SolveAndWinContestStatus.DRAFT) {
      throw new BadRequestException({
        message:
          'This contest can no longer be modified because it is not in draft status.',
        success: false,
        status: 400,
      });
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  // private sanitizeParticipation(participation: Record<string, any>) {
  //   const data =
  //     typeof participation?.toObject === 'function'
  //       ? participation.toObject()
  //       : participation;

  //   return {
  //     ...data,

  //     subjects: data.subjects.map((subject) => ({
  //       ...subject,

  //       questions: subject.questions.map((question) => {
  //         const {
  //           correctAnswers,
  //           explanation,
  //           explanationSteps,
  //           ...safeQuestion
  //         } = question;

  //         return safeQuestion;
  //       }),
  //     })),
  //   };
  // }
  private sanitizeParticipation(participation: any) {
    const rawData =
      participation._doc ||
      (typeof participation.toObject === 'function'
        ? participation.toObject()
        : participation);

    const cleanData = JSON.parse(JSON.stringify(rawData));

    return {
      ...cleanData,
      subjects: (cleanData.subjects || []).map((subject: any) => ({
        ...subject,
        questions: (subject.questions || []).map((question: any) => {
          const {
            correctAnswers,
            explanation,
            explanationSteps,
            ...safeQuestion
          } = question;

          return safeQuestion;
        }),
      })),
    };
  }
}
