import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { JwtUser } from '../../common/types/jwt-user.type';
import { PlansService } from '../plans/plans.service';
import { PracticeWalletService } from '../practice-wallet/practice-wallet.service';
import { PracticeModeService } from '../practice/services/practice-mode.service';
import { PracticeService } from '../practice/services/practice.service';
import { SubjectsRepository } from '../subjects/repositories/subjects.repository';
import { WalletsService } from '../wallets/wallets.service';
import { GetPracticeQuestionsDto } from './dto/get-practice-questions.dto';
import { GetQuestionsDto } from './dto/get-questions.dto';
import { SubmitPracticeDto } from './dto/submit-practice.dto';
import { QuestionsRepository } from './repositories/questions.repository';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private questionsRepository: QuestionsRepository,
    private subjectsRepository: SubjectsRepository,
    private walletService: WalletsService,
    private practiceModeService: PracticeModeService,
    private practiceService: PracticeService,
    private practiceWalletService: PracticeWalletService,
    private plansService: PlansService,
  ) {}

  async getPracticeQuestionBySubjectId(
    getPracticeQuestionsDto: GetPracticeQuestionsDto,
    user: JwtUser,
  ) {
    const userWallet = await this.walletService.findWalletByUserId(
      user.sub.toString(),
      user,
    );

    const practiceMode = await this.practiceModeService.getPracticeModeByName(
      getPracticeQuestionsDto.mode,
    );

    console.log('practiceMode:', practiceMode);

    if (!practiceMode.isActive) {
      throw new BadRequestException({
        message: 'This practice mode is currently unavailable.',
        success: false,
        status: 400,
      });
    }

    if (
      practiceMode.timePerQuestion * getPracticeQuestionsDto.questionCount !==
      getPracticeQuestionsDto.duration
    ) {
      throw new BadRequestException({
        message: 'Invalid duration for the practice.',
        success: false,
        status: 400,
      });
    }

    const plan = await this.plansService.getPlanByExamType(
      getPracticeQuestionsDto.examType,
    );

    console.log('userWallet:', userWallet);

    const totalAmountInKobo =
      plan.pricePerPracticeQuestionInKobo *
      getPracticeQuestionsDto.questionCount;
    console.log('totalAmountInKobo:', totalAmountInKobo);
    console.log('userWallet.balance:', userWallet.balanceInKobo);

    if (userWallet.balanceInKobo < totalAmountInKobo) {
      throw new BadRequestException({
        message: 'Insufficient wallet balance.',
        success: false,
        status: 400,
      });
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const chargeWallet = await this.walletService.chargeForPracticeQuestions({
        userWalletId: userWallet._id.toString(),
        amountInKobo: totalAmountInKobo,
        questionCount: getPracticeQuestionsDto.questionCount,
        examType: getPracticeQuestionsDto.examType,
        subjectId: getPracticeQuestionsDto.subjectId,
        session,
      });

      console.log('chargeWallet:', chargeWallet);
      const response =
        await this.questionsRepository.getPracticeQuestionBySubjectId(
          getPracticeQuestionsDto,
          session,
        );
      console.log('response:', response);

      const questionLength = response.questions.length;

      const practiceQuestions = response.questions.map((question) => ({
        questionId: question._id,
        selectedOption: null,
        isSelectedAnswerCorrect: null,
        marksAwarded: 0,
        pointsAwarded: 0,
      }));

      const payload = {
        subjectId: response.subjectId,
        examType: getPracticeQuestionsDto.examType,
        practiceModeId: practiceMode._id.toString(),
        questionCount: questionLength,
        questions: practiceQuestions,
        totalDurationInSeconds: practiceMode.timePerQuestion * questionLength,
        timePerQuestion: practiceMode.timePerQuestion,
        awardedPointPerCorrectAnswer: practiceMode.awardedPointPerCorrectAnswer,
      };

      const practice = await this.practiceService.createPractice(
        payload,
        user,
        session,
      );

      await session.commitTransaction();

      const input = {
        practiceId: practice._id,
        practiceMode,
        ...response,
      };

      console.log('input:', input);
      return input;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findById(questionId: string) {
    const id = new Types.ObjectId(questionId);
    const question = await this.questionsRepository.findById(id);
    if (!question) {
      throw new NotFoundException({
        message: 'Question not found.',
        success: false,
        status: 404,
      });
    }
    return question;
  }

  async countQuestionsBySubjectId(subjectId: string) {
    const id = new Types.ObjectId(subjectId);
    return await this.questionsRepository.countQuestionsBySubject(id);
  }

  async getQuestionsSummary() {
    return await this.questionsRepository.getQuestionsSummary();
  }

  async countQuestionsBySubjectIdAndYear(subjectId: string, year: string) {
    const id = new Types.ObjectId(subjectId);
    return await this.questionsRepository.countQuestionsBySubjectAndYear(
      id,
      year,
    );
  }

  async getFreeQuestionsPerPlan(getQuestionsDto: GetQuestionsDto) {
    const { plan, year, subjectId, examType } = getQuestionsDto;

    const freeYears = ['2000', '2001'];
    const freeSubjects = ['mathematics', 'english'];

    if (!freeYears.includes(getQuestionsDto.year)) {
      throw new ForbiddenException({
        message: `You need to subscribe to view ${getQuestionsDto.year} questions.`,
        status: 403,
        success: false,
      });
    }

    const subject = new Types.ObjectId(subjectId);

    const getSubject = await this.subjectsRepository.findById(subject);

    if (!getSubject) {
      throw new NotFoundException({
        message: 'Subject not found',
        success: false,
        status: 404,
      });
    }

    if (!freeSubjects.includes(getSubject.name.toLowerCase())) {
      throw new ForbiddenException({
        message: `${getSubject.name} is not included in free plan. Please subscribe to ${plan} plan to proceed.`,
        success: false,
        status: 403,
      });
    }

    const input = {
      plan,
      year,
      subjectId: getSubject._id.toString(),
      examType,
    };
    return await this.questionsRepository.getFreeQuestions(input);
  }

  async getPaidQuestionsPerPlan(getQuestionsDto: GetQuestionsDto) {
    const { plan, year, subjectId, examType } = getQuestionsDto;

    const subject = new Types.ObjectId(subjectId);

    const getSubject = await this.subjectsRepository.findById(subject);

    if (!getSubject) {
      throw new NotFoundException({
        message: 'Subject not found',
        success: false,
        status: 404,
      });
    }

    const input = {
      plan,
      year,
      subjectId: getSubject._id.toString(),
      examType,
    };
    const questions = await this.questionsRepository.getPaidQuestions(input);
    console.log(
      'service questions:',
      questions.map((q) => q.apiQuestionId),
    );
    console.log('service questions length:', questions.length);
    return questions;
  }

  async markPracticeQuestionsByPracticeId(
    practiceId: string,
    user: JwtUser,
    submitPracticeDto: SubmitPracticeDto,
  ) {
    const { questions } = submitPracticeDto;

    const findPracticeForMarking =
      await this.practiceService.findPracticeByIdAndUserIdForMarking(
        practiceId,
        user,
      );

    console.log('findPracticeForMarking:', findPracticeForMarking);

    const practiceMode = await this.practiceModeService.getPracticeModeById(
      findPracticeForMarking.practiceModeId.toString(),
    );

    const practiceObjectId = findPracticeForMarking._id;

    const userObjectId = new Types.ObjectId(user.sub.toString());

    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unansweredQuestions = 0;
    let totalPointsAwarded = 0;
    let totalMarksAwarded = 0;

    const submittedQuestionsMap = new Map(
      questions.map((question) => [question.questionId.toString(), question]),
    );

    const markedQuestions = findPracticeForMarking.questions.map(
      (practiceQuestion) => {
        /*
         * questionId is populated with the Question document.
         */
        const populatedQuestion = practiceQuestion.questionId as any;

        const questionId = populatedQuestion._id.toString();
        const submittedQuestion = submittedQuestionsMap.get(questionId);

        const selectedOption = submittedQuestion?.selectedOption ?? null;

        if (!selectedOption) {
          unansweredQuestions++;

          return {
            questionId: populatedQuestion._id,
            selectedOption: null,
            isSelectedAnswerCorrect: null,
            marksAwarded: 0,
            pointsAwarded: 0,
          };
        }

        const isCorrect =
          populatedQuestion.correctAnswers.includes(selectedOption);

        if (isCorrect) {
          correctAnswers++;

          const marksAwarded = populatedQuestion.marks ?? 1;

          const pointsAwarded = practiceMode.awardedPointPerCorrectAnswer;

          totalMarksAwarded += marksAwarded;
          totalPointsAwarded += pointsAwarded;

          return {
            questionId: populatedQuestion._id,
            selectedOption,
            isSelectedAnswerCorrect: true,
            marksAwarded,
            pointsAwarded,
          };
        }

        wrongAnswers++;

        return {
          questionId: populatedQuestion._id,
          selectedOption,
          isSelectedAnswerCorrect: false,
          marksAwarded: 0,
          pointsAwarded: 0,
        };
      },
    );

    console.log('markedQuestions:', markedQuestions);

    const totalQuestions = findPracticeForMarking.questions.length;

    const score = totalMarksAwarded;

    const totalAvailableMarks = findPracticeForMarking.questions.reduce(
      (total, practiceQuestion) => {
        const populatedQuestion = practiceQuestion.questionId as any;

        return total + (populatedQuestion.marks ?? 1);
      },
      0,
    );

    const percentage =
      totalAvailableMarks > 0
        ? Number(((totalMarksAwarded / totalAvailableMarks) * 100).toFixed(2))
        : 0;

    if (!findPracticeForMarking.startedAt) {
      throw new BadRequestException({
        message: 'Practice start time is missing.',
        success: false,
        status: 400,
      });
    }

    const durationInSeconds = Math.floor(
      (Date.now() - new Date(findPracticeForMarking.startedAt).getTime()) /
        1000,
    );

    totalPointsAwarded = Number(totalPointsAwarded.toFixed(6));

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const response =
        await this.practiceService.completePracticeMarkingProcess(
          practiceObjectId,
          userObjectId,
          {
            questions: markedQuestions,
            correctAnswers,
            wrongAnswers,
            unansweredQuestions,
            score,
            percentage,
            totalPointsAwarded,
            durationInSeconds,
            submittedAt: new Date(),
          },
          session,
        );

      console.log('CompletePracticeMarkingProcess response:', response);

      // Add totalPointsAwarded to the solve and win wallet balance

      const description = `Point for practice session with ID: ${practiceId}.`;

      await this.practiceWalletService.creditPracticePoints({
        userId: user.sub.toString(),
        points: totalPointsAwarded,
        practiceId,
        description,
        session,
      });

      await session.commitTransaction();
      return response;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
