import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';

import {
  AssessmentAnswerKey,
  AssessmentMarkingMode,
  AssessmentQuestionOption,
} from '../school-assessments/schemas/school-assessment.schema';
import { SchoolQuestionType } from '../school-questions/schemas/school-question.schema';
import { UpdateAssessmentAnswersDto } from './dtos/update-assessment-answers.dto';
import { SchoolAssessmentAttemptsRepository } from './repositories/school-assessment-attempts.repository';
import {
  AssessmentAttemptStatus,
  SchoolAssessmentAttempt,
  SchoolAssessmentAttemptDocument,
} from './schemas/school-assessment-attempt.schema';

interface CreateAssessmentAttemptInput {
  schoolId: string;
  assessmentId: string;
  studentId: string;
  studentMembershipId: string;
  academicSessionId: string;
  durationMinutes: number;
  markingMode: AssessmentMarkingMode;
  questions: Array<{
    questionId: string | Types.ObjectId;
    sourceQuestionId?: string | Types.ObjectId | null;
    questionType: SchoolQuestionType;
    questionText: string;
    questionImages?: string[];
    options?: AssessmentQuestionOption[];
    marks: number;
    explanation?: string;
    order: number;
    answerKey?: AssessmentAnswerKey | null;
  }>;
}

@Injectable()
export class SchoolAssessmentAttemptsService {
  constructor(
    private readonly attemptsRepository: SchoolAssessmentAttemptsRepository,
  ) {}

  private validateObjectId(value: string, fieldName: string): void {
    if (!isValidObjectId(value)) {
      throw new BadRequestException({
        message: `Invalid ${fieldName}.`,
        success: false,
        status: 400,
      });
    }
  }

  async createAssessmentAttempt(input: CreateAssessmentAttemptInput) {
    const {
      schoolId,
      assessmentId,
      studentId,
      studentMembershipId,
      academicSessionId,
      durationMinutes,
    } = input;
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(assessmentId, 'assessment ID');
    this.validateObjectId(studentId, 'student ID');
    this.validateObjectId(studentMembershipId, 'student membership ID');
    this.validateObjectId(academicSessionId, 'academic session ID');

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      throw new BadRequestException({
        message: 'Invalid assessment duration.',
        success: false,
        status: 400,
      });
    }

    const school = new Types.ObjectId(schoolId);
    const assessment = new Types.ObjectId(assessmentId);
    const studentMembership = new Types.ObjectId(studentMembershipId);
    const academicSession = new Types.ObjectId(academicSessionId);

    const existingAttempt =
      await this.attemptsRepository.findAttemptByAssessmentAndStudent(
        school,
        assessment,
        studentMembership,
      );

    if (existingAttempt) {
      if (
        existingAttempt.status === AssessmentAttemptStatus.IN_PROGRESS &&
        existingAttempt.expiresAt.getTime() <= Date.now()
      ) {
        await this.attemptsRepository.updateAttempt(
          school,
          existingAttempt._id,
          studentMembership,
          {
            status: AssessmentAttemptStatus.EXPIRED,
          },
        );

        throw new ConflictException({
          message: 'Your assessment attempt has expired.',
          success: false,
          status: 409,
        });
      }

      if (existingAttempt.status === AssessmentAttemptStatus.IN_PROGRESS) {
        return this.toStudentResponse(existingAttempt);
      }

      throw new ConflictException({
        message: 'You have already attempted this assessment.',
        success: false,
        status: 409,
      });
    }

    const totalMarks = input.questions.reduce(
      (total, question) => total + question.marks,
      0,
    );

    const startedAt = new Date();
    const expiresAt = new Date(
      startedAt.getTime() + input.durationMinutes * 60 * 1000,
    );

    try {
      const attempt = await this.attemptsRepository.createAssessmentAttempt({
        schoolId: school,
        assessmentId: assessment,
        studentId: new Types.ObjectId(input.studentId),
        studentMembershipId: studentMembership,
        academicSessionId: academicSession,
        status: AssessmentAttemptStatus.IN_PROGRESS,
        markingMode: input.markingMode,
        questions: input.questions.map((question) => ({
          questionId: new Types.ObjectId(question.questionId),
          sourceQuestionId: question.sourceQuestionId ?? null,
          order: question.order,
          questionType: question.questionType,
          questionText: question.questionText,
          questionImages: question.questionImages ?? [],
          options: (question.options ?? []).map((option) => ({
            key: option.key,
            text: option.text,
            ...(option.imageUrl != null ? { imageUrl: option.imageUrl } : {}),
          })),
          answerKey:
            question.answerKey == null
              ? undefined
              : {
                  ...question.answerKey,
                },
          explanation: question.explanation ?? '',
          marks: question.marks,
        })),
        answers: [],
        startedAt,
        expiresAt,
        totalMarks,
        marksAwarded: 0,
        score: null,
      });

      return this.toStudentResponse(attempt);
    } catch (error) {
      const mongoError = error as { code?: number };
      if (mongoError?.code === 11000) {
        const attempt =
          await this.attemptsRepository.findAttemptByAssessmentAndStudent(
            school,
            assessment,
            studentMembership,
          );

        if (attempt) {
          if (attempt.status === AssessmentAttemptStatus.IN_PROGRESS) {
            return this.toStudentResponse(attempt);
          }

          throw new ConflictException({
            message: 'You have already attempted this assessment.',
            success: false,
            status: 409,
          });
        }
      }

      throw error;
    }
  }

  async updateAssessmentAnswers(
    schoolId: string,
    attemptId: string,
    studentMembershipId: string,
    dto: UpdateAssessmentAnswersDto,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(attemptId, 'attempt ID');
    this.validateObjectId(studentMembershipId, 'student membership ID');

    const schoolObjectId = new Types.ObjectId(schoolId);
    const attemptObjectId = new Types.ObjectId(attemptId);
    const membershipObjectId = new Types.ObjectId(studentMembershipId);

    const attempt = await this.attemptsRepository.findAttemptById(
      schoolObjectId,
      attemptObjectId,
      membershipObjectId,
    );

    if (!attempt) {
      throw new NotFoundException({
        message: 'Assessment attempt not found.',
        success: false,
        status: 404,
      });
    }

    this.ensureAttemptCanBeUpdated(attempt);

    const updatedAnswers = [...attempt.answers];

    for (const submittedAnswer of dto.answers) {
      const question = attempt.questions.find(
        (item) => item.questionId.toString() === submittedAnswer.questionId,
      );

      if (!question) {
        throw new BadRequestException({
          message: `Question ${submittedAnswer.questionId} does not belong to this assessment attempt.`,
          success: false,
          status: 400,
        });
      }

      const selectedOptionKeys = submittedAnswer.selectedOptionKeys ?? [];

      if (selectedOptionKeys.length > 0) {
        if (question.questionType === SchoolQuestionType.SHORT_ANSWER) {
          throw new BadRequestException({
            message: 'Short-answer questions cannot have selected options.',
            success: false,
            status: 400,
          });
        }

        const validOptionKeys = new Set(
          question.options.map((option) => option.key),
        );

        const invalidOption = selectedOptionKeys.find(
          (key) => !validOptionKeys.has(key),
        );

        if (invalidOption) {
          throw new BadRequestException({
            message: `Invalid option selected for question ${submittedAnswer.questionId}.`,
            success: false,
            status: 400,
          });
        }

        if (
          question.questionType === SchoolQuestionType.SINGLE_CHOICE &&
          selectedOptionKeys.length > 1
        ) {
          throw new BadRequestException({
            message: 'Only one option can be selected for this question.',
            success: false,
            status: 400,
          });
        }

        if (
          question.questionType === SchoolQuestionType.TRUE_FALSE &&
          selectedOptionKeys.length > 1
        ) {
          throw new BadRequestException({
            message:
              'Only one option can be selected for a true/false question.',
            success: false,
            status: 400,
          });
        }
      }

      if (
        question.questionType === SchoolQuestionType.SHORT_ANSWER &&
        !submittedAnswer.textAnswer?.trim()
      ) {
        throw new BadRequestException({
          message: 'A text answer is required for this question.',
          success: false,
          status: 400,
        });
      }

      const answerIndex = updatedAnswers.findIndex(
        (answer) => answer.questionId.toString() === submittedAnswer.questionId,
      );

      const answer = {
        questionId: new Types.ObjectId(submittedAnswer.questionId),
        selectedOptionKeys,
        textAnswer: submittedAnswer.textAnswer?.trim(),
        answeredAt: new Date(),
      };

      if (answerIndex >= 0) {
        updatedAnswers[answerIndex] = answer;
      } else {
        updatedAnswers.push(answer);
      }
    }

    const updatedAttempt = await this.attemptsRepository.updateAttemptAnswers(
      schoolObjectId,
      attemptObjectId,
      membershipObjectId,
      updatedAnswers,
    );

    if (!updatedAttempt) {
      throw new ConflictException({
        message: 'The assessment attempt is no longer available for updating.',
        success: false,
        status: 409,
      });
    }

    return this.toStudentResponse(updatedAttempt);
  }

  /**
   * Submit the student's assessment.
   */
  async submitAssessmentAttempt(
    schoolId: string,
    attemptId: string,
    studentMembershipId: string,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(attemptId, 'attempt ID');
    this.validateObjectId(studentMembershipId, 'student membership ID');

    const schoolObjectId = new Types.ObjectId(schoolId);
    const attemptObjectId = new Types.ObjectId(attemptId);
    const membershipObjectId = new Types.ObjectId(studentMembershipId);

    const attempt = await this.attemptsRepository.findAttemptById(
      schoolObjectId,
      attemptObjectId,
      membershipObjectId,
    );

    if (!attempt) {
      throw new NotFoundException({
        message: 'Assessment attempt not found.',
        success: false,
        status: 404,
      });
    }

    if (attempt.status !== AssessmentAttemptStatus.IN_PROGRESS) {
      throw new ConflictException({
        message:
          'This assessment attempt has already been submitted or closed.',
        success: false,
        status: 409,
      });
    }

    const now = new Date();

    if (attempt.expiresAt.getTime() <= now.getTime()) {
      // The attempt is expired. Do not silently discard saved answers.
      const expiredAttempt = await this.attemptsRepository.updateAttempt(
        schoolObjectId,
        attemptObjectId,
        membershipObjectId,
        {
          status: AssessmentAttemptStatus.EXPIRED,
        },
      );

      if (!expiredAttempt) {
        throw new ConflictException({
          message: 'The assessment attempt could not be finalized.',
          success: false,
          status: 409,
        });
      }

      throw new ConflictException({
        message: 'Your assessment time has expired.',
        success: false,
        status: 409,
      });
    }

    const update: Partial<SchoolAssessmentAttempt> = {
      submittedAt: now,
    };

    if (attempt.markingMode === AssessmentMarkingMode.AUTOMATIC) {
      const marksAwarded = this.calculateAutomaticScore(attempt);

      update.status = AssessmentAttemptStatus.SUBMITTED;
      update.marksAwarded = marksAwarded;
      update.score =
        attempt.totalMarks > 0
          ? Number(((marksAwarded / attempt.totalMarks) * 100).toFixed(2))
          : 0;
    } else {
      update.status = AssessmentAttemptStatus.AWAITING_MARKING;
    }

    const submittedAttempt = await this.attemptsRepository.updateAttempt(
      schoolObjectId,
      attemptObjectId,
      membershipObjectId,
      update,
    );

    if (!submittedAttempt) {
      throw new ConflictException({
        message: 'The assessment attempt could not be submitted.',
        success: false,
        status: 409,
      });
    }

    return this.toStudentResponse(submittedAttempt);
  }

  /**
   * Retrieve a student's own attempt.
   */
  async getAssessmentAttemptById(
    schoolId: string,
    attemptId: string,
    studentMembershipId: string,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(attemptId, 'attempt ID');
    this.validateObjectId(studentMembershipId, 'student membership ID');

    const attempt = await this.attemptsRepository.findAttemptById(
      new Types.ObjectId(schoolId),
      new Types.ObjectId(attemptId),
      new Types.ObjectId(studentMembershipId),
    );

    if (!attempt) {
      throw new NotFoundException({
        message: 'Assessment attempt not found.',
        success: false,
        status: 404,
      });
    }

    return this.toStudentResponse(attempt);
  }

  private ensureAttemptCanBeUpdated(
    attempt: SchoolAssessmentAttemptDocument,
  ): void {
    if (attempt.status !== AssessmentAttemptStatus.IN_PROGRESS) {
      throw new ConflictException({
        message: 'This assessment attempt is no longer accepting answers.',
        success: false,
        status: 409,
      });
    }

    if (attempt.expiresAt.getTime() <= Date.now()) {
      throw new ConflictException({
        message: 'Your assessment time has expired.',
        success: false,
        status: 409,
      });
    }
  }

  /**
   * Automatic marking for supported question types.
   */
  private calculateAutomaticScore(
    attempt: SchoolAssessmentAttemptDocument,
  ): number {
    let marksAwarded = 0;

    for (const question of attempt.questions) {
      const answer = attempt.answers.find(
        (item) => item.questionId.toString() === question.questionId.toString(),
      );

      if (!answer || !question.answerKey) {
        continue;
      }

      const answerKey = question.answerKey;

      if (question.questionType === SchoolQuestionType.SINGLE_CHOICE) {
        if (
          answer.selectedOptionKeys.length === 1 &&
          answer.selectedOptionKeys[0] === answerKey.correctOptionKey
        ) {
          marksAwarded += question.marks;
        }
      } else if (question.questionType === SchoolQuestionType.MULTIPLE_CHOICE) {
        const expected = [...(answerKey.correctOptionKeys ?? [])].sort();
        const selected = [...answer.selectedOptionKeys].sort();

        if (
          expected.length > 0 &&
          expected.length === selected.length &&
          expected.every((key, index) => key === selected[index])
        ) {
          marksAwarded += question.marks;
        }
      } else if (question.questionType === SchoolQuestionType.TRUE_FALSE) {
        const selectedOptionKey = answer.selectedOptionKeys[0];

        const selectedOption = question.options.find(
          (option) => option.key === selectedOptionKey,
        );

        if (
          selectedOption &&
          typeof answerKey.correctBoolean === 'boolean' &&
          selectedOption.text.trim().toLowerCase() ===
            String(answerKey.correctBoolean)
        ) {
          marksAwarded += question.marks;
        }
      } else if (question.questionType === SchoolQuestionType.SHORT_ANSWER) {
        const acceptedAnswers: string[] = answerKey.acceptedAnswers ?? [];

        const submittedText = answer.textAnswer?.trim().toLowerCase();

        if (
          submittedText &&
          acceptedAnswers.some(
            (accepted) => accepted.trim().toLowerCase() === submittedText,
          )
        ) {
          marksAwarded += question.marks;
        }
      }
    }

    return marksAwarded;
  }

  /**
   * Never expose answer keys or explanations to students.
   */
  private toStudentResponse(attempt: SchoolAssessmentAttemptDocument) {
    const showExplanations =
      attempt.status === AssessmentAttemptStatus.SUBMITTED ||
      attempt.status === AssessmentAttemptStatus.MARKED;

    return {
      _id: attempt._id,
      assessmentId: attempt.assessmentId,
      status: attempt.status,
      markingMode: attempt.markingMode,
      questions: attempt.questions.map((question) => ({
        questionId: question.questionId,
        questionType: question.questionType,
        questionText: question.questionText,
        questionImages: question.questionImages,
        options: question.options,
        marks: question.marks,
        ...(showExplanations ? { explanation: question.explanation } : {}),
      })),
      answers: attempt.answers,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      submittedAt: attempt.submittedAt,
      totalMarks: attempt.totalMarks,
      marksAwarded: attempt.marksAwarded,
      score: attempt.score,
    };
  }
}
