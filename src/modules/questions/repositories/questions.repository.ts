import { NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { EXAM_PLAN_MAP } from '../../../common/utils/maps/exam-plan.map';
import { GetPracticeQuestionsDto } from '../dto/get-practice-questions.dto';
import { GetQuestionsDto } from '../dto/get-questions.dto';
import { QuestionDocument } from '../schemas/question.schema';

export class QuestionsRepository {
  constructor(
    @InjectModel('Question') private questionModel: Model<QuestionDocument>,
  ) {}

  async findById(id: Types.ObjectId) {
    return await this.questionModel.findById(id);
  }

  async findAll(queryWithPaginationDto: QueryWithPaginationDto) {
    const { page, limit, searchParams } = queryWithPaginationDto;

    let query = this.questionModel.find();

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [
          { apiSubjectName: { $regex: regex } },
          { answer: { $regex: regex } },
          { solution: { $regex: regex } },
        ],
      });
    }

    const count = await query.clone().countDocuments();
    let pages = 0;

    if (page !== undefined && limit !== undefined && count !== 0) {
      const offset = (page - 1) * limit;
      query = query.skip(offset).limit(limit);
      pages = Math.ceil(count / limit);

      if (page > pages) {
        throw new NotFoundException({
          message: 'Page can not be found.',
          status: 404,
          success: false,
        });
      }
    }

    const questions = await query.sort({ createdAt: -1 });

    if (questions.length === 0) {
      throw new NotFoundException({
        message: 'Questions not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      questionObj: questions,
      totalPages: pages,
      totalLimit: limit,
    };

    return response;
  }

  async countQuestionsBySubject(subjectId: Types.ObjectId) {
    const result = await this.questionModel.aggregate([
      {
        $match: { subject: subjectId },
      },

      // 1️⃣ Group by year + examType
      {
        $group: {
          _id: {
            year: '$examYear',
            examType: '$examType',
          },
          count: { $sum: 1 },
        },
      },

      // 2️⃣ Group by year
      {
        $group: {
          _id: '$_id.year',
          totalPerYear: { $sum: '$count' },
          examTypes: {
            $push: {
              examType: '$_id.examType',
              count: '$count',
            },
          },
        },
      },

      {
        $sort: { _id: 1 },
      },

      // 3️⃣ Final grouping (overall total)
      {
        $group: {
          _id: null,
          totalCount: { $sum: '$totalPerYear' },
          years: {
            $push: {
              year: '$_id',
              total: '$totalPerYear',
              examTypes: '$examTypes',
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          totalCount: 1,
          years: 1,
        },
      },
    ]);

    return result[0] || { totalCount: 0, years: [] };
  }

  // async countQuestionsBySubjectAndYear(
  //   subjectId: Types.ObjectId,
  //   year: string,
  // ) {
  //   const question = this.questionModel.find({
  //     subject: subjectId,
  //     examYear: year,
  //   });
  //   const count = question.clone().countDocuments();
  //   return count;
  // }

  async countQuestionsBySubjectAndYear(
    subjectId: Types.ObjectId,
    year: string,
  ) {
    const result = await this.questionModel.aggregate([
      {
        $match: {
          subject: subjectId,
          examYear: year,
        },
      },

      {
        $group: {
          _id: '$examType',
          count: { $sum: 1 },
        },
      },

      {
        $group: {
          _id: null,
          totalCount: { $sum: '$count' },
          examTypes: {
            $push: {
              examType: '$_id',
              count: '$count',
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          totalCount: 1,
          examTypes: 1,
        },
      },
    ]);

    return result[0] || { totalCount: 0, examTypes: [] };
  }

  async getQuestionsSummaryRaw() {
    const summary = await this.questionModel.aggregate([
      {
        $group: {
          _id: {
            subject: '$subject',
            year: '$examYear',
            examType: '$examType',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: {
            subject: '$_id.subject',
            year: '$_id.year',
          },
          totalPerYear: { $sum: '$count' },
          examTypes: {
            $push: {
              examType: '$_id.examType',
              count: '$count',
            },
          },
        },
      },

      {
        $group: {
          _id: '$_id.subject',
          total: { $sum: '$totalPerYear' },
          years: {
            $push: {
              year: '$_id.year',
              total: '$totalPerYear',
              examTypes: '$examTypes',
            },
          },
        },
      },

      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subjectInfo',
        },
      },
      {
        $unwind: '$subjectInfo',
      },
      {
        $project: {
          _id: 0,
          subjectId: '$_id',
          subjectName: '$subjectInfo.name',
          total: 1,
          years: 1,
        },
      },
      {
        $sort: { subjectName: 1 },
      },
    ]);

    console.log('summary:', summary);

    return summary;
  }

  async getQuestionsTotal() {
    return await this.questionModel.countDocuments();
  }
  async getQuestionsSummary() {
    const [summary, totalQuestions] = await Promise.all([
      this.getQuestionsSummaryRaw(),
      this.getQuestionsTotal(),
    ]);

    const result = {
      summary,
      totalQuestions,
    };

    return result;
  }

  async getFreeQuestions(
    getQuestionsDto: GetQuestionsDto,
  ): Promise<QuestionDocument[]> {
    const { plan, subjectId, year, examType } = getQuestionsDto;

    const subject = new Types.ObjectId(subjectId);

    const questions = await this.questionModel
      .find({
        plan,
        examYear: year,
        examType,
        subject,
      })
      .lean();

    return questions;
  }

  async getPaidQuestions(
    getQuestionsDto: GetQuestionsDto,
  ): Promise<QuestionDocument[]> {
    const { plan, subjectId, year, examType } = getQuestionsDto;
    const subject = new Types.ObjectId(subjectId);

    const questions = await this.questionModel
      .find({
        plan,
        examYear: year,
        subject,
        examType,
      })
      .lean();

    console.log('questions:', questions);

    return questions;
  }

  async changeSubjectToMongooseObjectForQuestion(name: string, id: string) {
    const subjectId = new Types.ObjectId(id);
    const result = await this.questionModel.updateMany(
      { apiSubjectName: name },
      {
        $set: {
          subject: subjectId,
        },
      },
    );

    console.log('Updated docs:', result.modifiedCount);

    return result;
  }

  async getPracticeQuestionBySubjectId(
    getPracticeQuestionsDto: GetPracticeQuestionsDto,
  ) {
    const { subjectId, mode, questionCount, duration, examType } =
      getPracticeQuestionsDto;

    const subjectObjectId = new Types.ObjectId(subjectId);

    const questions = await this.questionModel.aggregate([
      {
        $match: {
          subject: subjectObjectId,
          examType,
        },
      },
      {
        $sample: {
          size: questionCount,
        },
      },
    ]);

    return {
      subjectId,
      mode,
      questionCount: questions.length,
      duration,
      questions,
    };
  }

  // async insertQuestions(questions: any[]) {
  //   if (!questions || questions.length === 0) return;

  //   // Normalize questions and remove any with undefined ID
  //   const validQuestions = questions.filter(
  //     (q) => q.apiQuestionId && q.apiSubjectName,
  //   );
  //   if (validQuestions.length === 0) return;

  //   // Remove duplicates inside this batch
  //   const uniqueMap = new Map<string, any>();
  //   validQuestions.forEach((q) => {
  //     const key = `${q.apiQuestionId}_${q.apiSubjectName}`;
  //     if (!uniqueMap.has(key)) {
  //       uniqueMap.set(key, q);
  //     }
  //   });
  //   const uniqueQuestions = Array.from(uniqueMap.values());

  //   console.log('uniqueQuestions:', uniqueQuestions);
  //   if (uniqueQuestions.length === 0) return;

  //   try {
  //     const compoundKeys = uniqueQuestions.map((q) => ({
  //       apiQuestionId: q.apiQuestionId,
  //       apiSubjectName: q.apiSubjectName,
  //     }));

  //     const existing = await this.questionModel
  //       .find({
  //         $or: compoundKeys,
  //       })
  //       .select('apiQuestionId apiSubjectName')
  //       .lean();

  //     const existingSet = new Set(
  //       existing.map((q) => `${q.apiQuestionId}_${q.apiSubjectName}`),
  //     );

  //     const newQuestions = uniqueQuestions.filter(
  //       (q) => !existingSet.has(`${q.apiQuestionId}_${q.apiSubjectName}`),
  //     );

  //     if (newQuestions.length === 0) return;

  //     console.log('newQuestions:', newQuestions);

  //     const res = await this.questionModel.insertMany(newQuestions);
  //     console.log('res:', res);
  //   } catch (error: any) {
  //     if (error.code === 11000) {
  //       console.warn('Duplicate questions skipped.');
  //     } else {
  //       throw error;
  //     }
  //   }
  // }

  async insertQuestions(questions: any[]) {
    if (!questions?.length) {
      return { inserted: 0, skipped: 0 };
    }

    // ✅ 1. Validate required fields
    const validQuestions = questions.filter(
      (q) => q.apiQuestionId && q.apiSubjectName,
    );

    if (!validQuestions.length) {
      return { inserted: 0, skipped: questions.length };
    }

    // ✅ 2. Remove duplicates inside request batch
    const uniqueMap = new Map<string, any>();

    for (const q of validQuestions) {
      const key = `${q.apiQuestionId}_${q.apiSubjectName}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, q);
      }
    }

    const uniqueQuestions = Array.from(uniqueMap.values());

    if (!uniqueQuestions.length) {
      return { inserted: 0, skipped: validQuestions.length };
    }

    try {
      // ✅ 3. Check existing in DB
      const compoundKeys = uniqueQuestions.map((q) => ({
        apiQuestionId: q.apiQuestionId,
        apiSubjectName: q.apiSubjectName,
      }));

      const existing = await this.questionModel
        .find({ $or: compoundKeys })
        .select('apiQuestionId apiSubjectName')
        .lean();

      const existingSet = new Set(
        existing.map((q) => `${q.apiQuestionId}_${q.apiSubjectName}`),
      );

      // ✅ 4. Filter new questions
      const newQuestions = uniqueQuestions.filter(
        (q) => !existingSet.has(`${q.apiQuestionId}_${q.apiSubjectName}`),
      );

      if (!newQuestions.length) {
        return {
          inserted: 0,
          skipped: uniqueQuestions.length,
        };
      }

      // 🔥 HELPER: normalize content → segments
      const normalizeContent = (content: any[], fallbackText: string) => {
        const safeContent =
          content && content.length
            ? content
            : [
                {
                  type: 'text',
                  order: 1,
                  text: fallbackText || '',
                },
              ];

        return safeContent.map((block: any) => {
          if (block.type !== 'text') return block;

          let segments: any[] = [];

          // Case 1: text + segments
          if (block.text && block.segments?.length) {
            segments = [
              {
                text: block.text.endsWith(' ') ? block.text : block.text + ' ',
                styles: [],
              },
              ...block.segments.map((seg: any) => ({
                text: seg.text || '',
                styles: seg.styles || [],
              })),
            ];
          }

          // Case 2: only text
          else if (block.text) {
            segments = [
              {
                text: block.text,
                styles: [],
              },
            ];
          }

          // Case 3: only segments
          else if (block.segments?.length) {
            segments = block.segments.map((seg: any) => ({
              text: seg.text || '',
              styles: seg.styles || [],
            }));
          }

          return {
            type: 'text',
            order: block.order || 1,
            segments,
          };
        });
      };

      // 🔥 HELPER: extract plain text
      const extractQuestionText = (content: any[]) => {
        return content
          .filter((block: any) => block.type === 'text')
          .map(
            (block: any) =>
              block.segments?.map((seg: any) => seg.text).join('') || '',
          )
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      };

      // ✅ 5. FINAL NORMALIZATION
      const normalizedQuestions = newQuestions.map((q) => {
        // ✅ Normalize content FIRST
        const normalizedContent = normalizeContent(q.content, q.question);

        // ✅ Extract clean string
        const questionText = extractQuestionText(normalizedContent);

        return {
          ...q,

          apiSubjectName: q.apiSubjectName.toLowerCase(),
          examType: q.examType.toLowerCase(),
          section: q.section.toLowerCase(),

          answer: q.answer.toLowerCase(),

          // ✅ Options → array format
          options: Object.entries(q.options || {}).map(([label, value]) => ({
            label: label.toLowerCase(),
            value: value as string,
          })),

          correctAnswers: [q.answer.toLowerCase()],

          // ✅ FINAL FIELDS
          content: normalizedContent,
          question: questionText,
        };
      });

      // ✅ 6. Insert
      const insertedDocs =
        await this.questionModel.insertMany(normalizedQuestions);

      return {
        inserted: insertedDocs.length,
        skipped: questions.length - insertedDocs.length,
      };
    } catch (error: any) {
      if (error.writeErrors) {
        error.writeErrors.forEach((err: any, i: number) => {
          console.error(`❌ Error ${i}:`, err.errmsg);
        });
      }

      throw error;
    }
  }

  // async insertQuestions(questions: any[]) {
  //   if (!questions?.length) {
  //     return { inserted: 0, skipped: 0 };
  //   }

  //   // ✅ 1. Validate required fields
  //   const validQuestions = questions.filter(
  //     (q) => q.apiQuestionId && q.apiSubjectName,
  //   );

  //   if (!validQuestions.length) {
  //     // console.log('Question length validation');
  //     return { inserted: 0, skipped: questions.length };
  //   }

  //   // ✅ 2. Remove duplicates inside request batch
  //   const uniqueMap = new Map<string, any>();

  //   for (const q of validQuestions) {
  //     const key = `${q.apiQuestionId}_${q.apiSubjectName}`;
  //     if (!uniqueMap.has(key)) {
  //       uniqueMap.set(key, q);
  //     }
  //   }

  //   const uniqueQuestions = Array.from(uniqueMap.values());

  //   if (!uniqueQuestions.length) {
  //     // console.log('Unique question length');
  //     return { inserted: 0, skipped: validQuestions.length };
  //   }

  //   try {
  //     // ✅ 3. Check existing in DB
  //     const compoundKeys = uniqueQuestions.map((q) => ({
  //       apiQuestionId: q.apiQuestionId,
  //       apiSubjectName: q.apiSubjectName,
  //     }));

  //     const existing = await this.questionModel
  //       .find({ $or: compoundKeys })
  //       .select('apiQuestionId apiSubjectName')
  //       .lean();

  //     const existingSet = new Set(
  //       existing.map((q) => `${q.apiQuestionId}_${q.apiSubjectName}`),
  //     );

  //     // ✅ 4. Filter truly new questions
  //     const newQuestions = uniqueQuestions.filter(
  //       (q) => !existingSet.has(`${q.apiQuestionId}_${q.apiSubjectName}`),
  //     );

  //     if (!newQuestions.length) {
  //       // console.log('new questions length');
  //       return {
  //         inserted: 0,
  //         skipped: uniqueQuestions.length,
  //       };
  //     }
  //     // console.log('newQuestions:', newQuestions);

  //     // ✅ 5. FINAL NORMALIZATION (IMPORTANT 🔥)
  //     const normalizedQuestions = newQuestions.map((q) => {
  //       console.log('FULL CONTENT:', JSON.stringify(q.content, null, 2));
  //       // ✅ 🔥 EXTRACT CLEAN QUESTION TEXT (FIXED)
  //       const questionText =
  //         q.content
  //           ?.filter((block: any) => block.type === 'text')
  //           .map((block: any) => {
  //             console.log('block.segments:', block.segments);
  //             // ✅ ONLY USE SEGMENTS (this is your actual data now)
  //             if (block.segments?.length) {
  //               const response = block.segments
  //                 .map((seg: any) => seg.text)
  //                 .join('');
  //               console.log('block segments:', response);
  //               return response;
  //             }

  //             // fallback (just in case)
  //             return block.text || '';
  //           })
  //           .join(' ')
  //           .trim() ||
  //         q.question ||
  //         '';

  //       return {
  //         ...q,

  //         apiSubjectName: q.apiSubjectName.toLowerCase(),
  //         examType: q.examType.toLowerCase(),
  //         section: q.section.toLowerCase(),

  //         answer: q.answer.toLowerCase(),

  //         // ✅ OPTIONS FIX
  //         options: Object.entries(q.options || {}).map(([label, value]) => ({
  //           label: label.toLowerCase(),
  //           value: (value as string).toLowerCase(),
  //         })),

  //         // ✅ CORRECT ANSWERS FIX
  //         correctAnswers: [q.answer.toLowerCase()],

  //         // ✅ 🔥 CONTENT NORMALIZATION (KEEP YOUR LOGIC)
  //         content: (
  //           q.content || [
  //             {
  //               type: 'text',
  //               order: 1,
  //               text: q.question,
  //             },
  //           ]
  //         ).map((block: any) => {
  //           if (block.type === 'text') {
  //             let segments: any[] = [];

  //             // Case 1: BOTH text + segments
  //             if (block.text && block.segments?.length) {
  //               segments = [
  //                 {
  //                   text: block.text.endsWith(' ')
  //                     ? block.text
  //                     : block.text + ' ',
  //                   styles: [],
  //                 },
  //                 ...block.segments.map((seg: any) => ({
  //                   text: seg.text,
  //                   styles: seg.styles || [],
  //                 })),
  //               ];
  //             }

  //             // Case 2: ONLY text
  //             else if (block.text) {
  //               segments = [
  //                 {
  //                   text: block.text,
  //                   styles: [],
  //                 },
  //               ];
  //             }

  //             // Case 3: ONLY segments
  //             else if (block.segments?.length) {
  //               segments = block.segments.map((seg: any) => ({
  //                 text: seg.text,
  //                 styles: seg.styles || [],
  //               }));
  //             }

  //             return {
  //               type: 'text',
  //               order: block.order,
  //               segments,
  //             };
  //           }

  //           return block;
  //         }),

  //         // ✅ 🔥 FINAL QUESTION STRING (FIXED HERE)
  //         question: questionText,
  //       };
  //     });
  //     // console.log('normalizedQuestions:', normalizedQuestions);

  //     // ✅ 6. Insert
  //     const insertedDocs =
  //       await this.questionModel.insertMany(normalizedQuestions);

  //     return {
  //       inserted: insertedDocs.length,
  //       skipped: questions.length - insertedDocs.length,
  //     };
  //   } catch (error: any) {
  //     // console.error('🔥 FULL ERROR:', error);

  //     if (error.writeErrors) {
  //       error.writeErrors.forEach((err: any, i: number) => {
  //         console.error(`❌ Error ${i}:`, err.errmsg);
  //       });
  //     }

  //     throw error;
  //   }
  // }

  async backfillPlans() {
    const BATCH_SIZE = 2000;

    while (true) {
      const questions = await this.questionModel
        .find({
          $or: [{ plan: { $exists: false } }, { plan: null }],
        })
        .limit(BATCH_SIZE);

      if (questions.length === 0) {
        console.log('✅ Migration complete');
        break;
      }

      const bulkOps = questions
        .map((q) => {
          const examType = q.examType?.trim().toLowerCase();

          console.log('examType:', examType);
          console.log('q:', q);

          const normalizedExamType = examType?.replace(/\s+/g, '-');

          const plan = EXAM_PLAN_MAP[normalizedExamType];

          if (!plan) {
            console.warn(`Unknown examType: ${q.examType}`);
            return null;
          }

          return {
            updateOne: {
              filter: { _id: q._id },
              update: { $set: { plan } },
            },
          };
        })
        .filter(
          (
            op,
          ): op is {
            updateOne: {
              filter: { _id: (typeof questions)[number]['_id'] };
              update: { $set: { plan } };
            };
          } => op !== null,
        );

      if (bulkOps.length > 0) {
        await this.questionModel.bulkWrite(bulkOps);
      }

      console.log(`✅ Updated ${bulkOps.length} questions`);
    }
  }

  async normalizeOptionsToLowerCase() {
    try {
      const affectedYears = [
        '2000',
        '2001',
        '2002',
        '2003',
        '2004',
        '2005',
        '2006',
      ];

      const questions = await this.questionModel.find(
        {
          examType: 'waec',
          examYear: { $in: affectedYears },
        },
        { options: 1, answer: 1 },
      );

      if (!questions.length) {
        console.log('No questions found for normalization.');
        return;
      }

      const bulkOps: any[] = [];

      for (const q of questions) {
        if (!q.options || typeof q.options !== 'object') continue;

        let needsUpdate = false;

        // ✅ Strongly type options
        const options = q.options as Record<string, any>;

        const normalizedOptions: Record<string, string> = {};

        for (const [key, value] of Object.entries(options)) {
          const newKey = key.toLowerCase();

          const newValue =
            typeof value === 'string'
              ? value.toLowerCase()
              : String(value).toLowerCase();

          if (newKey !== key || newValue !== value) {
            needsUpdate = true;
          }

          normalizedOptions[newKey] = newValue;
        }

        // ✅ Normalize answer
        const normalizedAnswer =
          typeof q.answer === 'string' ? q.answer.toLowerCase() : q.answer;

        if (q.answer && normalizedAnswer !== q.answer) {
          needsUpdate = true;
        }

        if (needsUpdate) {
          bulkOps.push({
            updateOne: {
              filter: { _id: q._id },
              update: {
                $set: {
                  options: normalizedOptions,
                  answer: normalizedAnswer,
                },
              },
            },
          });
        }
      }

      if (bulkOps.length === 0) {
        console.log('No updates needed. Already normalized.');
        return;
      }

      // 🚀 MASS UPDATE (FAST)
      const result = await this.questionModel.bulkWrite(bulkOps);

      console.log(`✅ Normalization complete!`);
      console.log(`Matched: ${result.matchedCount}`);
      console.log(`Modified: ${result.modifiedCount}`);
    } catch (error) {
      console.error('❌ Error normalizing questions:', error);
      throw error;
    }
  }

  // async getQuestionsByExamYear() {
  //   const EXAM_TYPES = [
  //     'utme',
  //     'post-utme',
  //     'wassce',
  //     'jamb',
  //     'neco',
  //     'ijmb',
  //     'nursing',
  //     'medical',
  //     'law',
  //     'coren',
  //     'ican',
  //     'anna',
  //     'ielts',
  //   ];

  //   const docs = await this.questionModel.find({
  //     examYear: { $in: EXAM_TYPES },
  //     examType: { $regex: /^\d{4}$/ },
  //   });
  //   console.log('docs:', docs.length);

  //   const bulkOps = docs.map((doc) => ({
  //     updateOne: {
  //       filter: { _id: doc._id },
  //       update: {
  //         $set: {
  //           examType: doc.examYear,
  //           examYear: doc.examType,
  //         },
  //       },
  //     },
  //   }));

  //   await this.questionModel.bulkWrite(bulkOps);
  //   console.log('bulkOps:', bulkOps.length);
  // }

  async getAllExamTypes(): Promise<string[]> {
    const examTypes = await this.questionModel.distinct('examType');

    console.log('examTypes:', examTypes);
    return examTypes;
  }
  async getAllExamYears(): Promise<string[]> {
    const examYears = await this.questionModel.distinct('examYear');

    console.log('examYears:', examYears);
    return examYears;
  }

  async changeExamYearByExamIds(examIds: string[]) {
    for (const id of examIds) {
      const exam = await this.questionModel.findOneAndUpdate(
        {
          apiQuestionId: id,
        },
        {
          examYear: '2008',
        },
      );
    }
  }

  // async flattenOptions() {
  //   // Step 1: Fetch all questions where options is an array with exactly 1 element
  //   const questions = await this.questionModel.find({
  //     options: { $type: 'array', $size: 1 },
  //   });

  //   console.log('questionslength:', questions.length);

  //   if (questions.length === 0) {
  //     console.log('No questions need flattening.');
  //     return;
  //   }

  //   // Step 2: Prepare bulk operations
  //   const bulkOps = questions.map((q) => ({
  //     updateOne: {
  //       filter: { _id: q._id },
  //       update: { $set: { options: q.options && q.options[0] } },
  //     },
  //   }));

  //   // Step 3: Execute bulkWrite
  //   const result = await this.questionModel.bulkWrite(bulkOps, {
  //     ordered: false,
  //   });

  //   console.log(
  //     `Flattened options successfully for: ${result.modifiedCount} questions`,
  //   );
  //   console.log(
  //     `Failed to flatten options for: ${questions.length - result.modifiedCount} questions`,
  //   );
  // }

  async flattenOptions() {
    const questions = await this.questionModel.find({
      options: { $type: 'array', $size: 1 },
    });

    console.log('questions length:', questions.length);

    if (questions.length === 0) {
      console.log('No questions need flattening.');
      return;
    }

    const bulkOps = questions
      .map((q) => {
        if (!Array.isArray(q.options) || q.options.length !== 1) {
          return null;
        }

        return {
          updateOne: {
            filter: { _id: q._id },
            update: {
              $set: {
                options: [q.options[0]],
              },
            },
          },
        };
      })
      .filter((op): op is NonNullable<typeof op> => op !== null);

    if (bulkOps.length === 0) {
      console.log('No valid operations to perform.');
      return;
    }

    const result = await this.questionModel.bulkWrite(bulkOps, {
      ordered: false,
    });

    console.log(
      `Flattened options successfully for: ${result.modifiedCount} questions`,
    );
  }
}
