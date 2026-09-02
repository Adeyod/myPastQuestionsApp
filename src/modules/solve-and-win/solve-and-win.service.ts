import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { AddQuestionsToContestSubjectDto } from './dtos/add-questions-to-contest-subject.dto';
import { AddQuestionsToContestDto } from './dtos/add-questions-to-contest.dto';
import { AddSubjectsToContestDto } from './dtos/add-subjects-to-contest.dto';
import { CreateSolveAndWinContestDto } from './dtos/create-contest.dto';
import { RemoveQuestionsFromContestDto } from './dtos/remove-questions-from-contest.dto';
import { RemoveSubjectsFromContestDto } from './dtos/remove-subjects-from-contest.dto';
import { UpdateSolveAndWinContestDto } from './dtos/update-contest.dto';
import { SolveAndWinContestRepository } from './repositories/solve-and-win-contest.repository';
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
    private readonly solveAndWinQuestionRepo: SolveAndWinQuestionRepository,
  ) {}

  async createSolveAndWinContest(dto: CreateSolveAndWinContestDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException({
        message: 'End date must be after start date.',
        success: false,
        status: 400,
      });
    }

    const subjectIds = dto.subjectIds.map((id) => new Types.ObjectId(id));

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

    const data: Partial<SolveAndWinContest> = {
      title: dto.title.trim(),
      description: dto.description.trim(),
      category: dto.category.trim(),
      amountToBeWonInKobo: dto.amountToBeWonInKobo,
      entryPoints: dto.entryPoints,
      startDate,
      endDate,

      subjects: uniqueSubjectIds.map((subjectId) => ({
        subjectId,
        questions: [],
      })),

      status: SolveAndWinContestStatus.DRAFT,
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

    if (dto.endDate !== undefined) {
      updateData.endDate = new Date(dto.endDate);
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

    if (dto.subjectIds !== undefined) {
      const subjectIds = dto.subjectIds.map(
        (subjectId) => new Types.ObjectId(subjectId),
      );

      const uniqueSubjectIds = [
        ...new Map(
          subjectIds.map((subjectId) => [subjectId.toString(), subjectId]),
        ).values(),
      ];

      updateData.subjects = uniqueSubjectIds.map((subjectId) => ({
        subjectId,
        questions: [],
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

  async addQuestionsToContest(
    contestId: string,
    dto: AddQuestionsToContestDto,
  ) {
    this.validateObjectId(contestId);
    this.validateObjectId(dto.subjectId);

    const contestObjectId = new Types.ObjectId(contestId);
    const subjectObjectId = new Types.ObjectId(dto.subjectId);

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

    const subjectExists = await this.contestRepo.checkSubjectExistInContest(
      contestObjectId,
      subjectObjectId,
    );

    if (!subjectExists) {
      throw new BadRequestException({
        message: 'This subject does not belong to the contest.',
        success: false,
        status: 400,
      });
    }

    const questionIds = dto.questionIds.map((id) => new Types.ObjectId(id));

    for (const questionId of questionIds) {
      const question =
        await this.solveAndWinQuestionRepo.findSolveAndWinQuestionById(
          questionId,
        );

      if (!question) {
        throw new NotFoundException({
          message: `Question ${questionId.toString()} not found.`,
          success: false,
          status: 404,
        });
      }

      if (question.subjectId.toString() !== subjectObjectId.toString()) {
        throw new BadRequestException({
          message: `Question ${questionId.toString()} does not belong to the selected subject.`,
          success: false,
          status: 400,
        });
      }
    }

    const uniqueQuestionIds = [
      ...new Map(
        questionIds.map((questionId) => [questionId.toString(), questionId]),
      ).values(),
    ];

    const response = await this.contestRepo.addQuestionsToSubject(
      contestObjectId,
      subjectObjectId,
      uniqueQuestionIds,
    );

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to add questions to contest.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  // async createManyQuestions(dto: )
  async createQuestionsForASubjectInContest(
    contestId: string,
    subjectId: string,
    dto: AddQuestionsToContestSubjectDto,
  ) {
    this.validateObjectId(contestId);
    this.validateObjectId(subjectId);

    const contestObjectId = new Types.ObjectId(contestId);
    const subjectObjectId = new Types.ObjectId(subjectId);

    const contest =
      await this.contestRepo.findSolveAndWinContestById(contestObjectId);

    if (!contest) {
      throw new NotFoundException({
        message: 'Solve and Win contest not found.',
        success: false,
        status: 404,
      });
    }

    if (contest.status !== SolveAndWinContestStatus.DRAFT) {
      throw new BadRequestException({
        message: 'Questions can only be added to a draft contest.',
        success: false,
        status: 400,
      });
    }

    const contestSubject = contest.subjects?.find(
      (subject) => subject.subjectId.toString() === subjectId,
    );

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

    if (dto.questions.length !== dto.totalNumberOfExpectedQuestions) {
      throw new ConflictException({
        message: `The total number of questions expected is ${dto.totalNumberOfExpectedQuestions} but you are sending ${dto.questions.length} questions.`,
        success: false,
        status: 409,
      });
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // let createdQuestions: SolveAndWinQuestionDocument[];
      // let updatedContest;

      const questionsToCreate = dto.questions.map((question) => ({
        ...question,
        subjectId: subjectObjectId,
      }));
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
      const questionIds = createdQuestions.map((question) => question._id);

      const updatedContest =
        await this.contestRepo.addQuestionsToSubjectWithSession(
          contestObjectId,
          subjectObjectId,
          questionIds,
          session,
        );

      if (!updatedContest) {
        throw new BadRequestException({
          message: 'Unable to attach questions to the contest subject.',
          success: false,
          status: 400,
        });
      }

      return {
        message: 'Questions added to contest subject successfully.',
        success: true,
        status: 201,
        data: {
          contest: updatedContest,
          questions: createdQuestions,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async removeQuestionsFromContest(
    contestId: string,
    dto: RemoveQuestionsFromContestDto,
  ) {
    this.validateObjectId(contestId);
    this.validateObjectId(dto.subjectId);

    const contestObjectId = new Types.ObjectId(contestId);
    const subjectObjectId = new Types.ObjectId(dto.subjectId);

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

    const questionIds = dto.questionIds.map((id) => new Types.ObjectId(id));

    const response = await this.contestRepo.removeQuestionsFromSubject(
      contestObjectId,
      subjectObjectId,
      questionIds,
    );

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to remove questions from contest.',
        success: false,
        status: 400,
      });
    }

    return response;
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

    for (const subject of contest.subjects) {
      if (!subject.questions?.length) {
        throw new BadRequestException({
          message:
            'Every contest subject must have at least one question before activation.',
          success: false,
          status: 400,
        });
      }
    }

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
