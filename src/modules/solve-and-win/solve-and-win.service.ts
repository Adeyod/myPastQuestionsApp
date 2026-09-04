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
import { UpdateSolveAndWinContestDto } from './dtos/update-contest.dto';
import { SolveAndWinContestRepository } from './repositories/solve-and-win-contest.repository';
import { SolveAndWinParticipationRepository } from './repositories/solve-and-win-participant.repository';
import { SolveAndWinQuestionRepository } from './repositories/solve-and-win-question.repository';
import {
  SolveAndWinContest,
  SolveAndWinContestStatus,
} from './schemas/solve-and-win-contest.schema';

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

    console.log('userPracticeWallet.points:', userPracticeWallet.points);
    console.log('contest.entryPoints:', contest.entryPoints);

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

    // Only drafts should be permanently deleted.
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
}
