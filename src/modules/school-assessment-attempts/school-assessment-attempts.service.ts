import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';

import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { AcademicSessionsService } from '../academic-sessions/academic-sessions.service';
import {
  AssessmentAnswerKey,
  AssessmentMarkingMode,
  AssessmentQuestionOption,
} from '../school-assessments/schemas/school-assessment.schema';
import { SchoolMembershipDocument } from '../school-memberships/schemas/school-membership.schema';
import { SchoolQuestionType } from '../school-questions/schemas/school-question.schema';
import { SubmitAssessmentAttemptDto } from './dtos/submit-assessment-attempt.dto';
import {
  AssessmentAnswerDto,
  UpdateAssessmentAnswersDto,
} from './dtos/update-assessment-answers.dto';
import { SchoolAssessmentAttemptsRepository } from './repositories/school-assessment-attempts.repository';
import {
  AssessmentAnswerMarkingStatus,
  AssessmentAttemptAnswer,
  AssessmentAttemptFinalizationReason,
  AssessmentAttemptStatus,
  SchoolAssessmentAttempt,
  SchoolAssessmentAttemptDocument,
} from './schemas/school-assessment-attempt.schema';

interface CreateAssessmentAttemptInput {
  schoolId: string;
  assessmentId: string;
  studentId: string;
  studentMembershipId: string;
  classId: string;
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

    private readonly academicSessionsService: AcademicSessionsService,
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

  // async createAssessmentAttempt(input: CreateAssessmentAttemptInput) {
  //   const {
  //     schoolId,
  //     assessmentId,
  //     studentId,
  //     studentMembershipId,
  //     academicSessionId,
  //     durationMinutes,
  //   } = input;
  //   this.validateObjectId(schoolId, 'school ID');
  //   this.validateObjectId(assessmentId, 'assessment ID');
  //   this.validateObjectId(studentId, 'student ID');
  //   this.validateObjectId(studentMembershipId, 'student membership ID');
  //   this.validateObjectId(academicSessionId, 'academic session ID');

  //   if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
  //     throw new BadRequestException({
  //       message: 'Invalid assessment duration.',
  //       success: false,
  //       status: 400,
  //     });
  //   }

  //   const school = new Types.ObjectId(schoolId);
  //   const assessment = new Types.ObjectId(assessmentId);
  //   const studentMembership = new Types.ObjectId(studentMembershipId);
  //   const academicSession = new Types.ObjectId(academicSessionId);

  //   const existingAttempt =
  //     await this.attemptsRepository.findAttemptByAssessmentAndStudent(
  //       school,
  //       assessment,
  //       studentMembership,
  //     );

  //   if (existingAttempt) {
  //     if (
  //       existingAttempt.status === AssessmentAttemptStatus.IN_PROGRESS &&
  //       existingAttempt.expiresAt.getTime() <= Date.now()
  //     ) {
  //       await this.attemptsRepository.updateAttempt(
  //         school,
  //         existingAttempt._id,
  //         studentMembership,
  //         {
  //           status: AssessmentAttemptStatus.EXPIRED,
  //         },
  //       );

  //       throw new ConflictException({
  //         message: 'Your assessment attempt has expired.',
  //         success: false,
  //         status: 409,
  //       });
  //     }

  //     if (existingAttempt.status === AssessmentAttemptStatus.IN_PROGRESS) {
  //       return this.toStudentResponse(existingAttempt);
  //     }

  //     throw new ConflictException({
  //       message: 'You have already attempted this assessment.',
  //       success: false,
  //       status: 409,
  //     });
  //   }

  //   const totalMarks = input.questions.reduce(
  //     (total, question) => total + question.marks,
  //     0,
  //   );

  //   const startedAt = new Date();
  //   const expiresAt = new Date(
  //     startedAt.getTime() + input.durationMinutes * 60 * 1000,
  //   );

  //   try {
  //     const attempt = await this.attemptsRepository.createAssessmentAttempt({
  //       schoolId: school,
  //       assessmentId: assessment,
  //       studentId: new Types.ObjectId(input.studentId),
  //       studentMembershipId: studentMembership,
  //       academicSessionId: academicSession,
  //       status: AssessmentAttemptStatus.IN_PROGRESS,
  //       markingMode: input.markingMode,
  //       questions: input.questions.map((question) => ({
  //         questionId: new Types.ObjectId(question.questionId),
  //         sourceQuestionId: question.sourceQuestionId ?? null,
  //         order: question.order,
  //         questionType: question.questionType,
  //         questionText: question.questionText,
  //         questionImages: question.questionImages ?? [],
  //         options: (question.options ?? []).map((option) => ({
  //           key: option.key,
  //           text: option.text,
  //           ...(option.imageUrl != null ? { imageUrl: option.imageUrl } : {}),
  //         })),
  //         answerKey:
  //           question.answerKey == null
  //             ? undefined
  //             : {
  //                 ...question.answerKey,
  //               },
  //         explanation: question.explanation ?? '',
  //         marks: question.marks,
  //       })),
  //       answers: [],
  //       startedAt,
  //       expiresAt,
  //       totalMarks,
  //       marksAwarded: 0,
  //       score: null,
  //     });

  //     return this.toStudentResponse(attempt);
  //   } catch (error) {
  //     const mongoError = error as { code?: number };
  //     if (mongoError?.code === 11000) {
  //       const attempt =
  //         await this.attemptsRepository.findAttemptByAssessmentAndStudent(
  //           school,
  //           assessment,
  //           studentMembership,
  //         );

  //       if (attempt) {
  //         if (attempt.status === AssessmentAttemptStatus.IN_PROGRESS) {
  //           return this.toStudentResponse(attempt);
  //         }

  //         throw new ConflictException({
  //           message: 'You have already attempted this assessment.',
  //           success: false,
  //           status: 409,
  //         });
  //       }
  //     }

  //     throw error;
  //   }
  // }

  async createAssessmentAttempt(input: CreateAssessmentAttemptInput) {
    const {
      schoolId,
      assessmentId,
      studentId,
      classId,
      studentMembershipId,
      academicSessionId,
      durationMinutes,
    } = input;

    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(classId, 'class ID');
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
    const student = new Types.ObjectId(studentId);
    const classID = new Types.ObjectId(classId);
    const studentMembership = new Types.ObjectId(studentMembershipId);
    const academicSession = new Types.ObjectId(academicSessionId);

    const existingAttempt =
      await this.attemptsRepository.findAttemptByAssessmentAndStudent(
        school,
        assessment,
        studentMembership,
      );

    if (existingAttempt) {
      console.log('Returning existing document...');
      return await this.resumeOrFinalizeAttempt(
        school,
        studentMembership,
        existingAttempt,
      );
    }

    const totalMarks = input.questions.reduce(
      (total, question) => total + question.marks,
      0,
    );

    const startedAt = new Date();

    const expiresAt = new Date(
      startedAt.getTime() + durationMinutes * 60 * 1000,
    );

    try {
      const attempt = await this.attemptsRepository.createAssessmentAttempt({
        schoolId: school,
        assessmentId: assessment,
        studentId: student,
        classId: classID,
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
        // Another request may have created the attempt simultaneously.
        const attempt =
          await this.attemptsRepository.findAttemptByAssessmentAndStudent(
            school,
            assessment,
            studentMembership,
          );

        if (attempt) {
          return await this.resumeOrFinalizeAttempt(
            school,
            studentMembership,
            attempt,
          );
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

    const validatedAnswers = this.buildValidatedAnswers(attempt, dto.answers);

    const updatedAnswers = [...attempt.answers];

    for (const answer of validatedAnswers) {
      const answerIndex = updatedAnswers.findIndex(
        (existingAnswer) =>
          existingAnswer.questionId.toString() === answer.questionId.toString(),
      );

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

  async submitAssessmentAttempt(
    schoolId: string,
    attemptId: string,
    studentMembershipId: string,
    dto: SubmitAssessmentAttemptDto,
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
      return this.finalizeAssessmentAttempt(
        schoolObjectId,
        attemptObjectId,
        membershipObjectId,
        attempt,
        AssessmentAttemptFinalizationReason.TIME_EXPIRED,
      );
    }

    let finalAnswers: AssessmentAttemptAnswer[] | undefined;

    if (dto.answers !== undefined) {
      finalAnswers = this.buildValidatedAnswers(attempt, dto.answers);
    }

    return this.finalizeAssessmentAttempt(
      schoolObjectId,
      attemptObjectId,
      membershipObjectId,
      attempt,
      AssessmentAttemptFinalizationReason.STUDENT_SUBMISSION,
      finalAnswers,
    );
  }

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

  async getMySessionAssessmentAttemptByAcademicSessionId(
    schoolId: string,
    academicSessionId: string,
    membership: SchoolMembershipDocument,
    queryDto: QueryWithPaginationDto,
  ) {
    this.validateObjectId(schoolId, 'school ID');
    this.validateObjectId(academicSessionId, 'academic session ID');

    await this.academicSessionsService.getAcademicSessionById(
      schoolId,
      academicSessionId,
    );

    const assessmentAttempts =
      await this.attemptsRepository.findMyAttemptsInASession(
        membership._id,
        new Types.ObjectId(academicSessionId),
        new Types.ObjectId(schoolId),
        queryDto,
      );

    if (assessmentAttempts.assessmentAttemptObj.length === 0) {
      throw new NotFoundException({
        message:
          'Assessment not found for the student in this academic session.',
        success: false,
        status: 404,
      });
    }

    return assessmentAttempts;
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

  private async finalizeAssessmentAttempt(
    schoolId: Types.ObjectId,
    attemptId: Types.ObjectId,
    studentMembershipId: Types.ObjectId,
    attempt: SchoolAssessmentAttemptDocument,
    finalizationReason: AssessmentAttemptFinalizationReason,
    finalAnswers?: AssessmentAttemptAnswer[],
  ) {
    const now = new Date();

    const answers = finalAnswers ?? attempt.answers;

    const attemptForMarking = {
      ...attempt.toObject(),
      answers,
    } as SchoolAssessmentAttemptDocument;

    const update: Partial<SchoolAssessmentAttempt> = {
      answers: attemptForMarking.answers,
      submittedAt: now,
      finalizationReason,
    };

    if (attempt.markingMode === AssessmentMarkingMode.AUTOMATIC) {
      const marksAwarded = this.calculateAutomaticScore(attemptForMarking);

      update.status = AssessmentAttemptStatus.SUBMITTED;

      update.answers = attemptForMarking.answers;

      update.marksAwarded = marksAwarded;

      update.score =
        attempt.totalMarks > 0
          ? Number(((marksAwarded / attempt.totalMarks) * 100).toFixed(2))
          : 0;
    } else {
      update.status = AssessmentAttemptStatus.AWAITING_MARKING;
    }

    const finalizedAttempt = await this.attemptsRepository.updateAttempt(
      schoolId,
      attemptId,
      studentMembershipId,
      update,
    );

    if (!finalizedAttempt) {
      throw new ConflictException({
        message: 'The assessment attempt could not be finalized.',
        success: false,
        status: 409,
      });
    }

    return this.toStudentResponse(finalizedAttempt);
  }

  private async resumeOrFinalizeAttempt(
    schoolId: Types.ObjectId,
    studentMembershipId: Types.ObjectId,
    attempt: SchoolAssessmentAttemptDocument,
  ) {
    if (attempt.status !== AssessmentAttemptStatus.IN_PROGRESS) {
      throw new ConflictException({
        message: 'You have already attempted this assessment.',
        success: false,
        status: 409,
      });
    }

    if (attempt.expiresAt.getTime() <= Date.now()) {
      return await this.finalizeAssessmentAttempt(
        schoolId,
        attempt._id,
        studentMembershipId,
        attempt,
        AssessmentAttemptFinalizationReason.TIME_EXPIRED,
      );
    }

    return this.toStudentResponse(attempt);
  }

  private calculateAutomaticScore(
    attempt: SchoolAssessmentAttemptDocument,
  ): number {
    let totalMarksAwarded = 0;

    for (const question of attempt.questions) {
      const answer = attempt.answers.find(
        (item) => item.questionId.toString() === question.questionId.toString(),
      );

      if (!answer || !question.answerKey) {
        continue;
      }

      const answerKey = question.answerKey;
      let isCorrect = false;

      switch (question.questionType) {
        case SchoolQuestionType.SINGLE_CHOICE: {
          isCorrect =
            answer.selectedOptionKeys.length === 1 &&
            answer.selectedOptionKeys[0] === answerKey.correctOptionKey;
          break;
        }

        case SchoolQuestionType.MULTIPLE_CHOICE: {
          const expected = [...(answerKey.correctOptionKeys ?? [])].sort();
          const selected = [...answer.selectedOptionKeys].sort();

          isCorrect =
            expected.length > 0 &&
            expected.length === selected.length &&
            expected.every((key, index) => key === selected[index]);

          break;
        }

        case SchoolQuestionType.TRUE_FALSE: {
          const selectedOptionKey = answer.selectedOptionKeys[0];

          const selectedOption = question.options.find(
            (option) => option.key === selectedOptionKey,
          );

          isCorrect =
            !!selectedOption &&
            typeof answerKey.correctBoolean === 'boolean' &&
            selectedOption.text.trim().toLowerCase() ===
              String(answerKey.correctBoolean);

          break;
        }

        case SchoolQuestionType.SHORT_ANSWER: {
          const acceptedAnswers: string[] = answerKey.acceptedAnswers ?? [];

          const submittedText = answer.textAnswer?.trim().toLowerCase();

          isCorrect =
            !!submittedText &&
            acceptedAnswers.some(
              (accepted) => accepted.trim().toLowerCase() === submittedText,
            );

          break;
        }
      }

      answer.isCorrect = isCorrect;
      answer.marksAwarded = isCorrect ? question.marks : 0;
      answer.markingStatus = AssessmentAnswerMarkingStatus.MARKED;

      totalMarksAwarded += answer.marksAwarded;
    }

    return totalMarksAwarded;
  }

  private toStudentResponse(attempt: SchoolAssessmentAttemptDocument) {
    const showExplanations =
      attempt.status === AssessmentAttemptStatus.SUBMITTED ||
      attempt.status === AssessmentAttemptStatus.MARKED;

    return {
      _id: attempt._id,
      assessmentId: attempt.assessmentId,
      status: attempt.status,
      classId: attempt.classId,
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

  private buildValidatedAnswers(
    attempt: SchoolAssessmentAttemptDocument,
    submittedAnswers: AssessmentAnswerDto[],
  ): AssessmentAttemptAnswer[] {
    const validatedAnswers: AssessmentAttemptAnswer[] = [];
    const processedQuestionIds = new Set<string>();

    for (const submittedAnswer of submittedAnswers) {
      const questionId = submittedAnswer.questionId.toLowerCase();

      if (processedQuestionIds.has(questionId)) {
        throw new BadRequestException({
          message: `Question ${submittedAnswer.questionId} was submitted more than once.`,
          success: false,
          status: 400,
        });
      }

      processedQuestionIds.add(questionId);

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

      validatedAnswers.push({
        questionId: new Types.ObjectId(submittedAnswer.questionId),
        selectedOptionKeys,
        textAnswer: submittedAnswer.textAnswer?.trim(),
        answeredAt: new Date(),

        isCorrect: null,
        marksAwarded: 0,
        markingStatus: AssessmentAnswerMarkingStatus.PENDING,
      });
    }

    return validatedAnswers;
  }
}
