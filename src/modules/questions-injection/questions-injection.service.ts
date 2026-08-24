import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import type { Job, Queue } from 'bull';
import { Model, Types } from 'mongoose';
import { EXAM_PLAN_MAP } from '../../common/utils/maps/exam-plan.map';
import { QuestionsRepository } from '../questions/repositories/questions.repository';
import { SubjectsRepository } from '../subjects/repositories/subjects.repository';
import { InjectQuestionsDto } from './dto/inject-questions.dto';
import { QuestionInjectionDto } from './dto/question-injection.dto';
import {
  SyncProgress,
  SyncProgressDocument,
} from './schemas/sync-progress.schema';

@Injectable()
export class QuestionsInjectionService {
  private readonly logger = new Logger(QuestionsInjectionService.name);

  constructor(
    private readonly questionsRepository: QuestionsRepository,
    private readonly subjectsRepository: SubjectsRepository,

    @InjectModel(SyncProgress.name)
    private readonly progressModel: Model<SyncProgressDocument>,

    @InjectQueue('questions-sync') private queue: Queue,
  ) {}

  async addSyncJob(injectQuestionsDto: InjectQuestionsDto) {
    const { accessUser } = injectQuestionsDto;
    console.log('getting added to queue');
    await this.queue.add('sync-questions', { accessUser });
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async sync(job: Job) {
    const { accessUser } = job.data;
    console.log('sync is called');
    const subjects = [
      // {
      //   name: 'accounting',
      //   _id: '69be2a9e206c0f7de64f07a1',
      // },
      // {
      //   name: 'economics',
      //   _id: '69be2b2c206c0f7de64f0823',
      // },

      // {
      //   name: 'government',
      //   _id: '69be2af5206c0f7de64f0817',
      // },
      {
        name: 'mathematics',
        _id: '69bd4ca6b899fef942c0b067',
      },
      // {
      //   name: 'englishlit',
      //   _id: '69be2adf206c0f7de64f0813',
      // },
      // {
      //   name: 'chemistry',
      //   _id: '69be2ac7206c0f7de64f080f',
      // },
      {
        name: 'physics',
        _id: '69be2ab0206c0f7de64f07a5',
      },

      // {
      //   name: 'crk',
      //   _id: '69be2b08206c0f7de64f081b',
      // },
      {
        name: 'geography',
        _id: '69be2b1a206c0f7de64f081f',
      },

      {
        name: 'irk',
        _id: '69be2b3a206c0f7de64f088d',
      },
      {
        name: 'civiledu',
        _id: '69be2b4c206c0f7de64f0891',
      },
      {
        name: 'insurance',
        _id: '69be2b5e206c0f7de64f0895',
      },
      {
        name: 'currentaffairs',
        _id: '69be2b70206c0f7de64f0899',
      },
      {
        name: 'history',
        _id: '69be2b82206c0f7de64f089d',
      },
      {
        name: 'commerce',
        _id: '69be2a89206c0f7de64f079d',
      },
      {
        name: 'biology',
        _id: '69bd4b05fc84500b1e2bb364',
      },

      {
        name: 'english',
        _id: '69bd417a74676c09ac65bc56',
      },
    ];
    const startYear = 1979;
    const endYear = 2025;

    const API_KEY = accessUser;
    // const API_KEY = process.env.ALOC_API_KEY;

    for (const subject of subjects) {
      for (let year = startYear; year <= endYear; year++) {
        const progress = await this.progressModel.findOne({
          subject: subject.name,
          year,
        });

        let page = progress?.page || 1;
        let hasMore = true;

        const url = `https://questions.aloc.com.ng/api/v2/m/100?subject=${subject.name}&year=${year}`;
        const url2 = 'https://questions.aloc.com.ng/api/v2/q';
        const url3 = `https://questions.aloc.com.ng/api/v2/m?subject=${subject.name}`;
        const url4 = `https://questions.aloc.com.ng/api/v2/q/20?subject=${subject.name}&year=${year}`;

        while (hasMore) {
          try {
            this.logger.log(`Fetching ${subject.name} ${year} page ${page}`);

            const response = await axios.get(url, {
              // params: { subject: subject.name, year, page },
              headers: {
                AccessToken: `${API_KEY}`,
              },
            });
            // console.log('response.data:', response.data);

            let questions = response.data.data;

            // Ensure questions is always an array
            if (!Array.isArray(questions)) {
              questions = questions ? [questions] : [];
            }

            if (!questions || questions.length === 0) {
              hasMore = false;

              await this.progressModel.updateOne(
                { subject: subject.name, year },
                { completed: true },
                { upsert: true },
              );

              break;
            }

            const inserted = await this.questionsRepository.insertQuestions(
              questions.map((q: any) => {
                const examType = q.examtype?.toLowerCase(); // normalize
                const plan = EXAM_PLAN_MAP[examType];

                if (!plan) {
                  this.logger.warn(`Unknown examType: ${q.examtype}`);
                }

                return {
                  question: q.question,
                  options: q.option,
                  apiQuestionId: q.id,
                  plan: plan,
                  apiSubjectName: subject.name,
                  answer: q.answer,
                  examType: examType,
                  examYear: q.examyear,
                  subject: new Types.ObjectId(subject._id),
                };
              }),
            );

            console.log('inserted:', inserted);

            await this.progressModel.updateOne(
              { subject: new Types.ObjectId(subject._id), year },
              { page: page + 1 },
              { upsert: true },
            );

            if (job) {
              await job.progress({
                subject,
                year,
                page,
              });
            }

            page++;

            await this.delay(500);
          } catch (error) {
            this.logger.error(`Error on ${subject.name}-${year}-page-${page}`);
            throw error;
          }
        }
      }
    }
  }

  async addQuestionManually(questionInjectionDto: QuestionInjectionDto) {
    const { year, examType, subject, section, questions, type } =
      questionInjectionDto;

    // console.log('questionInjectionDto:', questionInjectionDto);

    questionInjectionDto.questions.map((q) => {
      console.log('questionInjectionDto:', q);
    });

    const findSubject = await this.subjectsRepository.findByName(
      subject.trim().toLowerCase(),
    );

    if (!findSubject) {
      throw new NotFoundException({
        message: 'Subject not found.',
        success: false,
        status: 404,
      });
    }

    const getExamType = examType?.toLowerCase(); // normalize
    const plan = EXAM_PLAN_MAP[examType];

    if (!plan) {
      this.logger.warn(`Unknown examType: ${examType}`);
    }

    const formattedQuestions = questions.map((q) => {
      // ✅ 1. Extract plain text question from content
      const questionText = q.content
        ?.filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join(' ')
        ?.trim();

      if (!questionText) {
        throw new BadRequestException({
          message: `Question content missing for ID: ${q.id}`,
          success: false,
          status: 400,
        });
      }

      // ✅ 2. Convert options array → object
      const optionsObject =
        q.options?.reduce(
          (acc, opt) => {
            acc[opt.label.toLowerCase()] = opt.value.toLowerCase();
            return acc;
          },
          {} as Record<string, string>,
        ) || {};

      if (!q.options || q.options.length === 0) {
        throw new BadRequestException({
          message: `Options missing for ID: ${q.id}`,
          success: false,
          status: 400,
        });
      }

      // ✅ 3. Extract correct answer
      const answer = q.correctAnswers?.[0]?.toLowerCase();

      if (!answer) {
        throw new BadRequestException({
          message: `Answer missing for ID: ${q.id}`,
          success: false,
          status: 400,
        });
      }

      return {
        examYear: year,
        examType: examType.toLowerCase(),
        apiSubjectName: subject.toLowerCase(),
        subject: findSubject._id,
        section: section.toLowerCase(),
        apiQuestionId: `${examType}-${q.id}`,

        // ✅ FIXED FIELDS
        question: questionText,
        content: q.content,
        options: optionsObject,
        answer,
        imageId: q.imageId,
        explanation: q.explanation,
        explanationSteps: q.explanationSteps,
        type,
        plan,

        difficulty: q.difficulty?.trim().toLowerCase() || 'medium',
        topic: q.topic || null,
      };
    });
    const response =
      await this.questionsRepository.insertQuestions(formattedQuestions);

    return response;
  }
}
