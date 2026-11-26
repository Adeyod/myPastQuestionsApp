import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection, Types } from 'mongoose';
import { ClassesService } from '../classes/classes.service';
import {
  SchoolMembershipDocument,
  SchoolRole,
} from '../school-memberships/schemas/school-membership.schema';
import { SchoolSubjectsService } from '../school-subjects/school-subjects.service';
import { StudentEnrollmentsService } from '../student-enrollments/student-enrollments.service';
import { TeachingAssignmentsService } from '../teaching-assignments/teaching-assignments.service';
import {
  CreateSchoolQuestionItemDto,
  CreateSchoolQuestionsDto,
} from './dtos/create-question.dto';
import { UpdateSchoolQuestionStatusDto } from './dtos/update-question-status.dto';
import { QuestionBankRepository } from './repositories/question-bank.repository';
import { SchoolQuestionType } from './schemas/school-question.schema';

@Injectable()
export class SchoolQuestionsService {
  constructor(
    private readonly questionBankRepository: QuestionBankRepository,
    private readonly schoolSubjectsService: SchoolSubjectsService,
    private readonly classesService: ClassesService,
    private readonly studentEnrollmentsService: StudentEnrollmentsService,
    private readonly teachingAssignmentsService: TeachingAssignmentsService,

    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async createQuestions(
    schoolId: string,
    createdByMembershipId: string,
    academicSessionId: string,
    createSchoolQuestionsDto: CreateSchoolQuestionsDto,
  ) {
    const schoolObjectId = this.validateObjectId(schoolId, 'School ID');
    const academicSessionObjectId = this.validateObjectId(
      academicSessionId,
      'Academic Session ID',
    );

    const membershipObjectId = this.validateObjectId(
      createdByMembershipId,
      'Membership ID',
    );

    const normalizedClassIds = this.normalizeIds(
      createSchoolQuestionsDto.classIds,
      'Class IDs',
    );

    const subjectId = this.validateObjectId(
      createSchoolQuestionsDto.subjectId,
      'Subject ID',
    );

    const questions = this.normalizeQuestions(
      createSchoolQuestionsDto.questions,
    );

    this.validateQuestions(questions);

    await this.teachingAssignmentsService.validateTeacherAssignments(
      schoolId,
      createdByMembershipId,
      createSchoolQuestionsDto.subjectId,
      createSchoolQuestionsDto.classIds,
      academicSessionObjectId.toString(),
    );

    const session = await this.connection.startSession();

    try {
      let createdQuestions: any[] = [];

      await session.withTransaction(async () => {
        await this.validateSubjectAndClasses(
          schoolObjectId,
          subjectId,
          normalizedClassIds,
          session,
        );

        createdQuestions = await this.questionBankRepository.createQuestions(
          schoolObjectId,
          subjectId,
          normalizedClassIds,
          membershipObjectId,
          questions,
          new Date(),
          session,
        );
      });

      return {
        totalQuestions: createdQuestions.length,
        questions: createdQuestions,
      };
    } finally {
      await session.endSession();
    }
  }

  // async createQuestionsForAssessment(
  //   schoolId: string,
  //   createdByMembershipId: string,
  //   createSchoolQuestionsDto: CreateSchoolQuestionsDto,
  //   assessmentId: string,
  //   practiceAvailableAt: Date,
  //   session: ClientSession,
  // ) {
  //   const schoolObjectId = this.validateObjectId(schoolId, 'School ID');
  //   const membershipObjectId = this.validateObjectId(
  //     createdByMembershipId,
  //     'Membership ID',
  //   );
  //   const assessmentObjectId = this.validateObjectId(
  //     assessmentId,
  //     'Assessment ID',
  //   );

  //   if (
  //     !(practiceAvailableAt instanceof Date) ||
  //     Number.isNaN(practiceAvailableAt.getTime())
  //   ) {
  //     throw new BadRequestException({
  //       message: 'A valid assessment ending date is required.',
  //       success: false,
  //       status: 400,
  //     });
  //   }

  //   const subjectId = this.validateObjectId(
  //     createSchoolQuestionsDto.subjectId,
  //     'Subject ID',
  //   );

  //   const classIds = this.normalizeIds(
  //     createSchoolQuestionsDto.classIds,
  //     'Class IDs',
  //   );

  //   const questions = this.normalizeQuestions(
  //     createSchoolQuestionsDto.questions,
  //   );

  //   this.validateQuestions(questions);

  //   await this.validateSubjectAndClasses(
  //     schoolObjectId,
  //     subjectId,
  //     classIds,
  //     session,
  //   );

  //   const response = await this.questionBankRepository.createQuestions(
  //     schoolObjectId,
  //     subjectId,
  //     classIds,
  //     membershipObjectId,
  //     questions,
  //     practiceAvailableAt,
  //     session,
  //     assessmentObjectId,
  //   );

  //   return response;
  // }

  async createQuestionsForAssessment(
    schoolId: string,
    createdByMembershipId: string,
    createSchoolQuestionsDto: CreateSchoolQuestionsDto,
    assessmentId: string,
    practiceAvailableAt: Date,
    session: ClientSession,
    validateAnswerKeys = true,
  ) {
    const schoolObjectId = this.validateObjectId(schoolId, 'School ID');

    const membershipObjectId = this.validateObjectId(
      createdByMembershipId,
      'Membership ID',
    );

    const assessmentObjectId = this.validateObjectId(
      assessmentId,
      'Assessment ID',
    );

    if (
      !(practiceAvailableAt instanceof Date) ||
      Number.isNaN(practiceAvailableAt.getTime())
    ) {
      throw new BadRequestException({
        message: 'A valid assessment ending date is required.',
        success: false,
        status: 400,
      });
    }

    const subjectId = this.validateObjectId(
      createSchoolQuestionsDto.subjectId,
      'Subject ID',
    );

    const classIds = this.normalizeIds(
      createSchoolQuestionsDto.classIds,
      'Class IDs',
    );

    const questions = this.normalizeQuestions(
      createSchoolQuestionsDto.questions,
    );

    this.validateQuestions(questions, validateAnswerKeys);

    await this.validateSubjectAndClasses(
      schoolObjectId,
      subjectId,
      classIds,
      session,
    );

    const response = await this.questionBankRepository.createQuestions(
      schoolObjectId,
      subjectId,
      classIds,
      membershipObjectId,
      questions,
      practiceAvailableAt,
      session,
      assessmentObjectId,
    );

    return response;
  }

  async getSpecificNoOfSubjectQuestions(
    schoolId: string,
    membership: SchoolMembershipDocument,
    academicSessionId: string,
    subjectId: string,
    classId: string,
    quantity: number,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException({
        message: 'Quantity is supposed to be greater than 0',
        success: false,
        status: 400,
      });
    }

    if (quantity > 100) {
      throw new BadRequestException({
        message: 'You can only get maximum of 100 questions at ones.',
        success: false,
        status: 400,
      });
    }
    const schoolObjectId = this.validateObjectId(schoolId, 'School ID');

    const subjectObjectId = this.validateObjectId(subjectId, 'Subject ID');

    const classObjectId = this.validateObjectId(classId, 'Class ID');

    const sessionObjectId = this.validateObjectId(
      academicSessionId,
      'Academic Session ID',
    );

    console.log('membership:', membership);

    if (membership.role === SchoolRole.STUDENT) {
      await this.studentEnrollmentsService.validateStudentSubjectEnrollment(
        schoolId,
        membership._id.toString(),
        classId,
        subjectId,
        academicSessionId,
      );
    }

    if (membership.role === SchoolRole.TEACHER) {
      await this.teachingAssignmentsService.validateTeacherAssignments(
        schoolId,
        membership._id.toString(),
        subjectId,
        [classId],
        academicSessionId,
      );
    }

    const response =
      await this.questionBankRepository.getSpecificNoOfSubjectQuestions(
        schoolObjectId,
        subjectObjectId,
        classObjectId,
        quantity,
      );

    return {
      questions: response,
      totalNoOfQuestionsFetched: response.length,
    };
  }

  async getQuestionById(
    schoolId: string,
    questionId: string,
    membership: SchoolMembershipDocument,
    academicSessionId: string,
    subjectId: string,
    classId: string,
  ) {
    const schoolObjectId = this.validateObjectId(schoolId, 'School ID');
    const questionObjectId = this.validateObjectId(questionId, 'Question ID');

    if (membership.role === SchoolRole.STUDENT) {
      await this.studentEnrollmentsService.validateStudentSubjectEnrollment(
        schoolId,
        membership._id.toString(),
        classId,
        subjectId,
        academicSessionId,
      );
    }

    if (membership.role === SchoolRole.TEACHER) {
      await this.teachingAssignmentsService.validateTeacherAssignments(
        schoolId,
        membership._id.toString(),
        subjectId,
        [classId],
        academicSessionId,
      );
    }

    const question = await this.questionBankRepository.findQuestionById(
      schoolObjectId,
      questionObjectId,
    );

    if (!question) {
      throw new NotFoundException({
        message: 'Question not found.',
        success: false,
        status: 404,
      });
    }

    return question;
  }

  async updateQuestionStatus(
    schoolId: string,
    questionId: string,
    dto: UpdateSchoolQuestionStatusDto,
  ) {
    const schoolObjectId = this.validateObjectId(schoolId, 'School ID');
    const questionObjectId = this.validateObjectId(questionId, 'Question ID');

    const question = await this.questionBankRepository.updateQuestionStatus(
      schoolObjectId,
      questionObjectId,
      dto.isActive,
    );

    if (!question) {
      throw new NotFoundException({
        message: 'Question not found.',
        success: false,
        status: 404,
      });
    }

    return {
      message: 'Question status updated successfully.',
      question,
    };
  }

  private async validateSubjectAndClasses(
    schoolId: Types.ObjectId,
    subjectId: Types.ObjectId,
    classIds: Types.ObjectId[],
    session: ClientSession,
  ) {
    const subject = await this.schoolSubjectsService.getSchoolActiveSubjectById(
      schoolId.toString(),
      subjectId.toString(),
      session,
    );

    const classes = await this.classesService.getSchoolActiveClassesByIds(
      schoolId,
      classIds,
      session,
    );

    if (classes.length !== classIds.length) {
      throw new BadRequestException({
        message:
          'One or more selected classes do not exist, are inactive, or do not belong to this school.',
        success: false,
        status: 400,
      });
    }
  }

  private normalizeIds(ids: string[], fieldName: string): Types.ObjectId[] {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException({
        message: `${fieldName} must not be empty.`,
        success: false,
        status: 400,
      });
    }

    const uniqueIds = [...new Set(ids)];

    if (uniqueIds.length !== ids.length) {
      throw new BadRequestException({
        message: `${fieldName} must not contain duplicates.`,
        success: false,
        status: 400,
      });
    }

    return uniqueIds.map((id) => this.validateObjectId(id, fieldName));
  }

  private normalizeQuestions(
    questions: CreateSchoolQuestionItemDto[],
  ): CreateSchoolQuestionItemDto[] {
    const response = questions.map((question) => ({
      ...question,
      questionText: question.questionText?.trim(),
      options: question.options?.map((option) => ({
        ...option,
        key: option.key.trim().toUpperCase(),
        text: option.text.trim(),
      })),
      answerKey: question.answerKey
        ? {
            ...question.answerKey,
            correctOptionKey: question.answerKey.correctOptionKey
              ?.trim()
              .toUpperCase(),
            correctOptionKeys: question.answerKey.correctOptionKeys?.map(
              (key) => key.trim().toUpperCase(),
            ),
            acceptedAnswers: question.answerKey.acceptedAnswers?.map((answer) =>
              answer.trim(),
            ),
          }
        : undefined,
    }));

    return response;
  }

  // private validateQuestions(questions: CreateSchoolQuestionItemDto[]) {
  //   if (!Array.isArray(questions) || questions.length === 0) {
  //     throw new BadRequestException({
  //       message: 'At least one question must be supplied.',
  //       success: false,
  //       status: 400,
  //     });
  //   }

  //   for (const [index, question] of questions.entries()) {
  //     const label = `Question ${index + 1}`;

  //     if (!question.questionText?.trim()) {
  //       throw new BadRequestException({
  //         message: `${label}: question text is required.`,
  //         success: false,
  //         status: 400,
  //       });
  //     }

  //     const options = question.options ?? [];
  //     const optionKeys = options.map((option) => option.key);

  //     if (new Set(optionKeys).size !== optionKeys.length) {
  //       throw new BadRequestException({
  //         message: `${label}: option keys must be unique.`,
  //         success: false,
  //         status: 400,
  //       });
  //     }

  //     if (
  //       [
  //         SchoolQuestionType.SINGLE_CHOICE,
  //         SchoolQuestionType.MULTIPLE_CHOICE,
  //       ].includes(question.questionType)
  //     ) {
  //       if (options.length < 2) {
  //         throw new BadRequestException({
  //           message: `${label}: at least two options are required.`,
  //           success: false,
  //           status: 400,
  //         });
  //       }

  //       if (
  //         options.some((option) => !option.key?.trim() || !option.text?.trim())
  //       ) {
  //         throw new BadRequestException({
  //           message: `${label}: every option must have a key and text.`,
  //           success: false,
  //           status: 400,
  //         });
  //       }
  //     } else if (options.length > 0) {
  //       throw new BadRequestException({
  //         message: `${label}: options are not supported for this question type.`,
  //         success: false,
  //         status: 400,
  //       });
  //     }

  //     const answerKey = question.answerKey;

  //     if (!answerKey) {
  //       continue;
  //     }

  //     if (question.questionType === SchoolQuestionType.SINGLE_CHOICE) {
  //       if (
  //         !answerKey.correctOptionKey ||
  //         !optionKeys.includes(answerKey.correctOptionKey)
  //       ) {
  //         throw new BadRequestException({
  //           message: `${label}: the correct option must match one of the supplied options.`,
  //           success: false,
  //           status: 400,
  //         });
  //       }
  //     }

  //     if (question.questionType === SchoolQuestionType.MULTIPLE_CHOICE) {
  //       const correctKeys = answerKey.correctOptionKeys ?? [];

  //       if (
  //         correctKeys.length === 0 ||
  //         new Set(correctKeys).size !== correctKeys.length ||
  //         correctKeys.some((key) => !optionKeys.includes(key))
  //       ) {
  //         throw new BadRequestException({
  //           message: `${label}: provide valid, unique correct option keys.`,
  //           success: false,
  //           status: 400,
  //         });
  //       }
  //     }

  //     if (
  //       question.questionType === SchoolQuestionType.TRUE_FALSE &&
  //       typeof answerKey.correctBoolean !== 'boolean'
  //     ) {
  //       throw new BadRequestException({
  //         message: `${label}: a true/false answer key is required.`,
  //         success: false,
  //         status: 400,
  //       });
  //     }

  //     if (
  //       question.questionType === SchoolQuestionType.SHORT_ANSWER &&
  //       (!answerKey.acceptedAnswers || answerKey.acceptedAnswers.length === 0)
  //     ) {
  //       throw new BadRequestException({
  //         message: `${label}: provide at least one accepted answer.`,
  //         success: false,
  //         status: 400,
  //       });
  //     }
  //   }
  // }

  private validateQuestions(
    questions: CreateSchoolQuestionItemDto[],
    validateAnswerKeys = true,
  ) {
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new BadRequestException({
        message: 'At least one question must be supplied.',
        success: false,
        status: 400,
      });
    }

    for (const [index, question] of questions.entries()) {
      const label = `Question ${index + 1}`;

      if (!question.questionText?.trim()) {
        throw new BadRequestException({
          message: `${label}: question text is required.`,
          success: false,
          status: 400,
        });
      }

      const options = question.options ?? [];
      const optionKeys = options.map((option) =>
        option.key.trim().toUpperCase(),
      );

      if (new Set(optionKeys).size !== optionKeys.length) {
        throw new BadRequestException({
          message: `${label}: option keys must be unique.`,
          success: false,
          status: 400,
        });
      }

      // Validate options according to question type.
      switch (question.questionType) {
        case SchoolQuestionType.SINGLE_CHOICE:
        case SchoolQuestionType.MULTIPLE_CHOICE: {
          if (options.length < 2) {
            throw new BadRequestException({
              message: `${label}: at least two options are required.`,
              success: false,
              status: 400,
            });
          }

          if (
            options.some(
              (option) => !option.key?.trim() || !option.text?.trim(),
            )
          ) {
            throw new BadRequestException({
              message: `${label}: every option must have a key and text.`,
              success: false,
              status: 400,
            });
          }

          break;
        }

        case SchoolQuestionType.TRUE_FALSE: {
          const optionTexts = options.map((option) =>
            option.text?.trim().toLowerCase(),
          );

          if (
            options.length !== 2 ||
            options.some(
              (option) => !option.key?.trim() || !option.text?.trim(),
            ) ||
            !optionTexts.includes('true') ||
            !optionTexts.includes('false')
          ) {
            throw new BadRequestException({
              message: `${label}: true/false questions must have one True option and one False option.`,
              success: false,
              status: 400,
            });
          }

          break;
        }

        case SchoolQuestionType.SHORT_ANSWER: {
          if (options.length > 0) {
            throw new BadRequestException({
              message: `${label}: options are not supported for short-answer questions.`,
              success: false,
              status: 400,
            });
          }

          break;
        }

        case SchoolQuestionType.ESSAY: {
          if (options.length > 0) {
            throw new BadRequestException({
              message: `${label}: options are not supported for essay questions.`,
              success: false,
              status: 400,
            });
          }

          break;
        }

        default:
          throw new BadRequestException({
            message: `${label}: unsupported question type.`,
            success: false,
            status: 400,
          });
      }

      // Manual marking does not require a complete answer key.
      if (!validateAnswerKeys) {
        continue;
      }

      const answerKey = question.answerKey;

      // Questions without answer keys are allowed in the general question bank.
      if (!answerKey) {
        continue;
      }

      switch (question.questionType) {
        case SchoolQuestionType.SINGLE_CHOICE: {
          const correctKey = answerKey.correctOptionKey?.trim().toUpperCase();

          if (!correctKey || !optionKeys.includes(correctKey)) {
            throw new BadRequestException({
              message: `${label}: the correct option must match one of the supplied options.`,
              success: false,
              status: 400,
            });
          }

          break;
        }

        case SchoolQuestionType.MULTIPLE_CHOICE: {
          const correctKeys =
            answerKey.correctOptionKeys?.map((key) =>
              key.trim().toUpperCase(),
            ) ?? [];

          if (
            correctKeys.length === 0 ||
            new Set(correctKeys).size !== correctKeys.length ||
            correctKeys.some((key) => !optionKeys.includes(key))
          ) {
            throw new BadRequestException({
              message: `${label}: provide valid, unique correct option keys.`,
              success: false,
              status: 400,
            });
          }

          break;
        }

        case SchoolQuestionType.TRUE_FALSE:
          if (typeof answerKey.correctBoolean !== 'boolean') {
            throw new BadRequestException({
              message: `${label}: a true/false answer key is required.`,
              success: false,
              status: 400,
            });
          }

          break;

        case SchoolQuestionType.SHORT_ANSWER:
          if (!answerKey.acceptedAnswers?.some((answer) => answer.trim())) {
            throw new BadRequestException({
              message: `${label}: provide at least one accepted answer.`,
              success: false,
              status: 400,
            });
          }

          break;

        case SchoolQuestionType.ESSAY:
          throw new BadRequestException({
            message: `${label}: essay questions cannot use automatic marking.`,
            success: false,
            status: 400,
          });
      }
    }
  }

  // private validateQuestions(questions: CreateSchoolQuestionItemDto[]) {
  //   if (!Array.isArray(questions) || questions.length === 0) {
  //     throw new BadRequestException({
  //       message: 'At least one question must be supplied.',
  //       success: false,
  //       status: 400,
  //     });
  //   }

  //   for (const [index, question] of questions.entries()) {
  //     const label = `Question ${index + 1}`;

  //     if (!question.questionText?.trim()) {
  //       throw new BadRequestException({
  //         message: `${label}: question text is required.`,
  //         success: false,
  //         status: 400,
  //       });
  //     }

  //     const options = question.options ?? [];
  //     const optionKeys = options.map((option) => option.key);

  //     if (new Set(optionKeys).size !== optionKeys.length) {
  //       throw new BadRequestException({
  //         message: `${label}: option keys must be unique.`,
  //         success: false,
  //         status: 400,
  //       });
  //     }

  //     // Validate options according to question type.
  //     switch (question.questionType) {
  //       case SchoolQuestionType.SINGLE_CHOICE:
  //       case SchoolQuestionType.MULTIPLE_CHOICE: {
  //         if (options.length < 2) {
  //           throw new BadRequestException({
  //             message: `${label}: at least two options are required.`,
  //             success: false,
  //             status: 400,
  //           });
  //         }

  //         if (
  //           options.some(
  //             (option) => !option.key?.trim() || !option.text?.trim(),
  //           )
  //         ) {
  //           throw new BadRequestException({
  //             message: `${label}: every option must have a key and text.`,
  //             success: false,
  //             status: 400,
  //           });
  //         }

  //         break;
  //       }

  //       case SchoolQuestionType.TRUE_FALSE: {
  //         if (options.length !== 2) {
  //           throw new BadRequestException({
  //             message: `${label}: exactly two options are required for true/false questions.`,
  //             success: false,
  //             status: 400,
  //           });
  //         }

  //         const optionTexts = options.map((option) =>
  //           option.text?.trim().toLowerCase(),
  //         );

  //         if (
  //           options.some(
  //             (option) => !option.key?.trim() || !option.text?.trim(),
  //           ) ||
  //           !optionTexts.includes('true') ||
  //           !optionTexts.includes('false')
  //         ) {
  //           throw new BadRequestException({
  //             message: `${label}: true/false questions must have one True option and one False option.`,
  //             success: false,
  //             status: 400,
  //           });
  //         }

  //         break;
  //       }

  //       case SchoolQuestionType.SHORT_ANSWER: {
  //         if (options.length > 0) {
  //           throw new BadRequestException({
  //             message: `${label}: options are not supported for short-answer questions.`,
  //             success: false,
  //             status: 400,
  //           });
  //         }

  //         break;
  //       }

  //       default:
  //         throw new BadRequestException({
  //           message: `${label}: unsupported question type.`,
  //           success: false,
  //           status: 400,
  //         });
  //     }

  //     const answerKey = question.answerKey;

  //     // Allow questions to be saved without an answer key.
  //     if (!answerKey) {
  //       continue;
  //     }

  //     if (question.questionType === SchoolQuestionType.SINGLE_CHOICE) {
  //       if (
  //         !answerKey.correctOptionKey ||
  //         !optionKeys.includes(answerKey.correctOptionKey)
  //       ) {
  //         throw new BadRequestException({
  //           message: `${label}: the correct option must match one of the supplied options.`,
  //           success: false,
  //           status: 400,
  //         });
  //       }
  //     }

  //     if (question.questionType === SchoolQuestionType.MULTIPLE_CHOICE) {
  //       const correctKeys = answerKey.correctOptionKeys ?? [];

  //       if (
  //         correctKeys.length === 0 ||
  //         new Set(correctKeys).size !== correctKeys.length ||
  //         correctKeys.some((key) => !optionKeys.includes(key))
  //       ) {
  //         throw new BadRequestException({
  //           message: `${label}: provide valid, unique correct option keys.`,
  //           success: false,
  //           status: 400,
  //         });
  //       }
  //     }

  //     if (
  //       question.questionType === SchoolQuestionType.TRUE_FALSE &&
  //       typeof answerKey.correctBoolean !== 'boolean'
  //     ) {
  //       throw new BadRequestException({
  //         message: `${label}: a true/false answer key is required.`,
  //         success: false,
  //         status: 400,
  //       });
  //     }

  //     if (
  //       question.questionType === SchoolQuestionType.SHORT_ANSWER &&
  //       (!answerKey.acceptedAnswers || answerKey.acceptedAnswers.length === 0)
  //     ) {
  //       throw new BadRequestException({
  //         message: `${label}: provide at least one accepted answer.`,
  //         success: false,
  //         status: 400,
  //       });
  //     }
  //   }
  // }

  private validateObjectId(value: string, fieldName: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException({
        message: `Invalid ${fieldName}.`,
        success: false,
        status: 400,
      });
    }

    return new Types.ObjectId(value);
  }
}
