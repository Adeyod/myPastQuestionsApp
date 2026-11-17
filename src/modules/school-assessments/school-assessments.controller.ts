import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { SchoolAssessmentsService } from './school-assessments.service';

import { DeviceSessionGuard } from '../../common/guards/device-session.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolMembershipGuard } from '../../common/guards/school-membership.guard';
import { SchoolRolesGuard } from '../../common/guards/school-roles.guard';

import { CurrentSchoolMembership } from '../../common/decorators/current-school-membership.decorator';
import { CurrentSchool } from '../../common/decorators/current-school.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SchoolRoles } from '../../common/decorators/school-roles.decorator';

import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import {
  type SchoolMembershipDocument,
  SchoolRole,
} from '../school-memberships/schemas/school-membership.schema';
import { type SchoolDocument } from '../schools/schemas/schools.schema';
import { Role } from '../users/schemas/user.schema';
import { CreateAssessmentDto } from './dtos/create-assessment.dto';
import { QueryAssessmentsDto } from './dtos/query-assessments.dto';
import { UpdateAssessmentStatusDto } from './dtos/update-assessment-status.dto';

@Controller('school/assessments')
export class SchoolAssessmentsController {
  constructor(
    private readonly schoolAssessmentsService: SchoolAssessmentsService,
  ) {}

  @Post('create-assessment')
  @UseGuards(
    JwtAuthGuard,
    DeviceSessionGuard,
    RolesGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  )
  @Roles(Role.USER)
  @SchoolRoles(SchoolRole.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-school-subdomain',
    description: 'Subdomain identifying the school being accessed.',
    required: true,
    example: 'csae',
  })
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Assessment created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an assessment with multiple questions.',
    description:
      'This is the endpoint that class subject teacher is going to use to Create an assessment with multiple questions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assessment created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to create assessment.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async createAssessment(
    @CurrentSchool() school: SchoolDocument,
    @CurrentSchoolMembership()
    membership: SchoolMembershipDocument,
    @Body() dto: CreateAssessmentDto,
  ) {
    const response = await this.schoolAssessmentsService.createAssessment(
      school._id.toString(),
      membership._id.toString(),
      dto,
    );

    return response;
  }

  @Get('get-all-assessments-of-a-school-in-a-session')
  @UseGuards(
    JwtAuthGuard,
    DeviceSessionGuard,
    RolesGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  )
  @Roles(Role.USER)
  @SchoolRoles(SchoolRole.OWNER, SchoolRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-school-subdomain',
    description: 'Subdomain identifying the school being accessed.',
    required: true,
    example: 'csae',
  })
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Assessments fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get school assessments in a session',
    description:
      'This is the endpoint that owner and admin can use to get all the assessment of a school in a session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assessments fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch assessments.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAllSchoolAssessmentsPerSession(
    @CurrentSchool() school: SchoolDocument,
    @CurrentSchoolMembership()
    membership: SchoolMembershipDocument,
    @Query() query: QueryAssessmentsDto,
  ) {
    const response =
      await this.schoolAssessmentsService.getAllSchoolAssessmentsPerSession(
        school._id.toString(),
        query,
      );

    return response;
  }
  @Get(
    'get-all-assessments-of-class-subject-in-a-session/:academicSessionId/:classId/:subjectId',
  )
  @UseGuards(
    JwtAuthGuard,
    DeviceSessionGuard,
    RolesGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  )
  @Roles(Role.USER)
  @SchoolRoles(
    SchoolRole.OWNER,
    SchoolRole.ADMIN,
    SchoolRole.STUDENT,
    SchoolRole.TEACHER,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-school-subdomain',
    description: 'Subdomain identifying the school being accessed.',
    required: true,
    example: 'csae',
  })
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Subject Assessments fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get school assessments in a session',
    description:
      'This is the endpoint that student, subject teacher, owner and admin can use to get all the class subject assessment of a school in a session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subject Assessments fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch assessments.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAllClassSubjectAssessmentsPerSession(
    @Param('academicSessionId') academicSessionId: string,
    @Param('subjectId') subjectId: string,
    @Param('classId') classId: string,
    @CurrentSchool() school: SchoolDocument,
    @CurrentSchoolMembership()
    membership: SchoolMembershipDocument,
    @Query() query: QueryWithPaginationDto,
  ) {
    const response =
      await this.schoolAssessmentsService.getAllClassSubjectAssessmentsPerSession(
        academicSessionId,
        subjectId,
        classId,
        school._id.toString(),
        query,
        membership,
      );

    return response;
  }

  @Get(
    'get-assessment-by-assessmentId-classId-academicSessionId/:academicSessionId/:classId/:assessmentId',
  )
  @UseGuards(
    JwtAuthGuard,
    DeviceSessionGuard,
    RolesGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  )
  @Roles(Role.USER)
  @SchoolRoles(
    SchoolRole.OWNER,
    SchoolRole.ADMIN,
    SchoolRole.STUDENT,
    SchoolRole.TEACHER,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-school-subdomain',
    description: 'Subdomain identifying the school being accessed.',
    required: true,
    example: 'csae',
  })
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Subject Assessment fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get an assessment by ID in a session',
    description:
      'This is the endpoint that student, subject teacher, owner and admin can use to Get an assessment by ID in a session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subject Assessment fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch assessment.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAssessmentByAssessmentId(
    @CurrentSchool() school: SchoolDocument,
    @Param('academicSessionId') academicSessionId: string,
    @Param('assessmentId') assessmentId: string,
    @Param('classId') classId: string,
    @CurrentSchoolMembership()
    membership: SchoolMembershipDocument,
  ) {
    const response =
      await this.schoolAssessmentsService.getAssessmentByAssessmentId(
        school._id.toString(),
        assessmentId,
        membership,
        academicSessionId,
        classId,
      );

    return response;
  }

  @Patch('update-assessment-status/:assessmentId')
  @UseGuards(
    JwtAuthGuard,
    DeviceSessionGuard,
    RolesGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  )
  @Roles(Role.USER)
  @SchoolRoles(SchoolRole.OWNER, SchoolRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-school-subdomain',
    description: 'Subdomain identifying the school being accessed.',
    required: true,
    example: 'csae',
  })
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @SuccessMessage('Assessment archived successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archive an assessment',
    description:
      'This is the endpoint that owner and admin can use to Archive an assessment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assessment archived successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to archive assessment.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async updateAssessmentStatus(
    @CurrentSchool() school: SchoolDocument,
    @Param('assessmentId') assessmentId: string,
    @Body() dto: UpdateAssessmentStatusDto,
  ) {
    const response = await this.schoolAssessmentsService.updateAssessmentStatus(
      school._id.toString(),
      assessmentId,
      dto,
    );

    return response;
  }
}

/*

{
  "subjectId": "6af43a3cdb43ea8761d9f4bd",
  "academicSessionId": "6af1af312933e3bc003b75d2",
  "academicPeriodId": "6af1d5d154f00b3f69039829",
  "classIds": [
    "6af43da9718344bf7ca92e3e"
  ],
  "title": "First Continuous Assessment",
  "description": "string",
  "instructions": "string",
  "assessmentType": "QUIZ",
  "markingMode": "AUTOMATIC",
  "durationMinutes": 45,
  "passMark": 100,
  "startsAt": "2026-12-01T09:00:00.000Z",
  "endsAt": "2026-12-01T10:00:00.000Z",

  "questions": [
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Choose the word that correctly completes this sentence: Neither the teacher nor the students _____ present at the meeting.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "was" },
        { "key": "B", "text": "were" },
        { "key": "C", "text": "is" },
        { "key": "D", "text": "has" }
      ],
      "answerKey": {
        "correctOptionKey": "B"
      },
      "difficulty": "MEDIUM",
      "topic": "Subject-Verb Agreement",
      "explanation": "When subjects are joined by neither...nor, the verb agrees with the subject closer to it. Students is plural, so were is correct.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Choose the correct plural form of the word 'criterion'.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Criterions" },
        { "key": "B", "text": "Criterias" },
        { "key": "C", "text": "Criteria" },
        { "key": "D", "text": "Criteriones" }
      ],
      "answerKey": {
        "correctOptionKey": "C"
      },
      "difficulty": "MEDIUM",
      "topic": "Plural Forms",
      "explanation": "Criterion is singular, while criteria is its correct plural form.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Identify the adverb in this sentence: The boy ran quickly to the market.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Boy" },
        { "key": "B", "text": "Ran" },
        { "key": "C", "text": "Quickly" },
        { "key": "D", "text": "Market" }
      ],
      "answerKey": {
        "correctOptionKey": "C"
      },
      "difficulty": "EASY",
      "topic": "Parts of Speech",
      "explanation": "Quickly describes how the boy ran. Words that modify verbs are adverbs.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Choose the correct sentence.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "She don't like rice." },
        { "key": "B", "text": "She doesn't likes rice." },
        { "key": "C", "text": "She doesn't like rice." },
        { "key": "D", "text": "She not like rice." }
      ],
      "answerKey": {
        "correctOptionKey": "C"
      },
      "difficulty": "EASY",
      "topic": "Grammar",
      "explanation": "Doesn't is followed by the base form of the verb, which is like.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "What is the opposite of the word 'generous'?",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Kind" },
        { "key": "B", "text": "Selfish" },
        { "key": "C", "text": "Helpful" },
        { "key": "D", "text": "Friendly" }
      ],
      "answerKey": {
        "correctOptionKey": "B"
      },
      "difficulty": "EASY",
      "topic": "Antonyms",
      "explanation": "A generous person is willing to give or share. A selfish person is unwilling to do so.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Choose the word nearest in meaning to 'abundant'.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Scarce" },
        { "key": "B", "text": "Plentiful" },
        { "key": "C", "text": "Limited" },
        { "key": "D", "text": "Insufficient" }
      ],
      "answerKey": {
        "correctOptionKey": "B"
      },
      "difficulty": "EASY",
      "topic": "Synonyms",
      "explanation": "Abundant means existing in large quantities. Plentiful has the same meaning.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Identify the figure of speech in this sentence: The wind whispered through the trees.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Simile" },
        { "key": "B", "text": "Hyperbole" },
        { "key": "C", "text": "Personification" },
        { "key": "D", "text": "Irony" }
      ],
      "answerKey": {
        "correctOptionKey": "C"
      },
      "difficulty": "MEDIUM",
      "topic": "Figures of Speech",
      "explanation": "Personification gives human qualities or actions to non-human things. The wind is described as whispering.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Choose the correct past tense of 'teach'.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Teached" },
        { "key": "B", "text": "Taught" },
        { "key": "C", "text": "Teaching" },
        { "key": "D", "text": "Taughted" }
      ],
      "answerKey": {
        "correctOptionKey": "B"
      },
      "difficulty": "EASY",
      "topic": "Tenses",
      "explanation": "Teach is an irregular verb. Its past tense and past participle are taught.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Which of the following is a conjunction?",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Beautiful" },
        { "key": "B", "text": "Although" },
        { "key": "C", "text": "Slowly" },
        { "key": "D", "text": "Honesty" }
      ],
      "answerKey": {
        "correctOptionKey": "B"
      },
      "difficulty": "EASY",
      "topic": "Parts of Speech",
      "explanation": "Although is a subordinating conjunction used to connect clauses and express contrast.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Choose the correctly punctuated sentence.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Where are you going." },
        { "key": "B", "text": "Where are you going!" },
        { "key": "C", "text": "Where are you going?" },
        { "key": "D", "text": "Where, are you going." }
      ],
      "answerKey": {
        "correctOptionKey": "C"
      },
      "difficulty": "EASY",
      "topic": "Punctuation",
      "explanation": "A direct question should end with a question mark.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Choose the correct indirect speech form of: He said, 'I am tired.'",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "He said that I am tired." },
        { "key": "B", "text": "He said that he was tired." },
        { "key": "C", "text": "He says that he was tired." },
        { "key": "D", "text": "He said that he is tiring." }
      ],
      "answerKey": {
        "correctOptionKey": "B"
      },
      "difficulty": "MEDIUM",
      "topic": "Reported Speech",
      "explanation": "In reported speech, the present tense am changes to the past tense was when the reporting verb is in the past. The pronoun I changes to he.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Which word is correctly spelt?",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Accomodation" },
        { "key": "B", "text": "Acommodation" },
        { "key": "C", "text": "Accommodation" },
        { "key": "D", "text": "Accommondation" }
      ],
      "answerKey": {
        "correctOptionKey": "C"
      },
      "difficulty": "EASY",
      "topic": "Spelling",
      "explanation": "The correct spelling is accommodation, with two c's and two m's.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Identify the noun in this sentence: Honesty is the best policy.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Best" },
        { "key": "B", "text": "Honesty" },
        { "key": "C", "text": "Is" },
        { "key": "D", "text": "The" }
      ],
      "answerKey": {
        "correctOptionKey": "B"
      },
      "difficulty": "EASY",
      "topic": "Parts of Speech",
      "explanation": "Honesty is an abstract noun because it names a quality or idea rather than a physical object.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Choose the correct comparative form of 'good'.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Gooder" },
        { "key": "B", "text": "Best" },
        { "key": "C", "text": "Better" },
        { "key": "D", "text": "More good" }
      ],
      "answerKey": {
        "correctOptionKey": "C"
      },
      "difficulty": "EASY",
      "topic": "Degrees of Comparison",
      "explanation": "Good is an irregular adjective. Its comparative form is better and its superlative form is best.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Choose the correct preposition: The meeting will begin _____ 9 o'clock.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "In" },
        { "key": "B", "text": "On" },
        { "key": "C", "text": "At" },
        { "key": "D", "text": "By" }
      ],
      "answerKey": {
        "correctOptionKey": "C"
      },
      "difficulty": "EASY",
      "topic": "Prepositions",
      "explanation": "At is used with specific clock times, such as at 9 o'clock.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "What does the idiom 'to hit the nail on the head' mean?",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "To cause an accident" },
        { "key": "B", "text": "To describe something accurately" },
        { "key": "C", "text": "To work as a carpenter" },
        { "key": "D", "text": "To make a serious mistake" }
      ],
      "answerKey": {
        "correctOptionKey": "B"
      },
      "difficulty": "MEDIUM",
      "topic": "Idioms",
      "explanation": "The idiom means to say or do exactly the right thing or identify the exact point.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Which of these sentences is in the passive voice?",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "The boy kicked the ball." },
        { "key": "B", "text": "The ball was kicked by the boy." },
        { "key": "C", "text": "The boy is kicking the ball." },
        { "key": "D", "text": "The boy will kick the ball." }
      ],
      "answerKey": {
        "correctOptionKey": "B"
      },
      "difficulty": "MEDIUM",
      "topic": "Active and Passive Voice",
      "explanation": "In the passive voice, the receiver of the action becomes the subject. The ball receives the action of being kicked.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Choose the word that has the same vowel sound as the word 'seat'.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Sit" },
        { "key": "B", "text": "Set" },
        { "key": "C", "text": "Beat" },
        { "key": "D", "text": "Sat" }
      ],
      "answerKey": {
        "correctOptionKey": "C"
      },
      "difficulty": "MEDIUM",
      "topic": "Vowel Sounds",
      "explanation": "Seat and beat contain the same long /iː/ vowel sound.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Which of the following is a complex sentence?",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "The sun rose and the birds sang." },
        { "key": "B", "text": "She came, she saw, she conquered." },
        { "key": "C", "text": "Although it was raining, we went to school." },
        { "key": "D", "text": "The boy is intelligent." }
      ],
      "answerKey": {
        "correctOptionKey": "C"
      },
      "difficulty": "MEDIUM",
      "topic": "Sentence Structure",
      "explanation": "A complex sentence contains an independent clause and at least one dependent clause. Although it was raining is dependent, while we went to school is independent.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Choose the correct question tag: You have finished your assignment, _____?",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Have you" },
        { "key": "B", "text": "Haven't you" },
        { "key": "C", "text": "Don't you" },
        { "key": "D", "text": "Did you" }
      ],
      "answerKey": {
        "correctOptionKey": "B"
      },
      "difficulty": "MEDIUM",
      "topic": "Question Tags",
      "explanation": "A positive statement generally takes a negative question tag. The auxiliary have is retained in the tag.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Choose the correct word to complete the sentence: The principal, together with the teachers, _____ attending the ceremony.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Are" },
        { "key": "B", "text": "Were" },
        { "key": "C", "text": "Is" },
        { "key": "D", "text": "Have" }
      ],
      "answerKey": {
        "correctOptionKey": "C"
      },
      "difficulty": "MEDIUM",
      "topic": "Subject-Verb Agreement",
      "explanation": "The main subject is principal, which is singular. The phrase together with the teachers does not change the subject's number.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "What is the synonym of 'reluctant'?",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Unwilling" },
        { "key": "B", "text": "Excited" },
        { "key": "C", "text": "Confident" },
        { "key": "D", "text": "Willing" }
      ],
      "answerKey": {
        "correctOptionKey": "A"
      },
      "difficulty": "MEDIUM",
      "topic": "Synonyms",
      "explanation": "Reluctant means unwilling or hesitant to do something.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Which of these words is a homophone of 'write'?",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Written" },
        { "key": "B", "text": "Right" },
        { "key": "C", "text": "Riteful" },
        { "key": "D", "text": "Writer" }
      ],
      "answerKey": {
        "correctOptionKey": "B"
      },
      "difficulty": "EASY",
      "topic": "Homophones",
      "explanation": "Write and right have the same pronunciation but different meanings and spellings.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Identify the figure of speech in: He is as brave as a lion.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Metaphor" },
        { "key": "B", "text": "Simile" },
        { "key": "C", "text": "Personification" },
        { "key": "D", "text": "Oxymoron" }
      ],
      "answerKey": {
        "correctOptionKey": "B"
      },
      "difficulty": "EASY",
      "topic": "Figures of Speech",
      "explanation": "A simile compares two things using words such as like or as. This sentence compares his bravery to that of a lion.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Choose the correct form of the verb: If I _____ you, I would apologise.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Am" },
        { "key": "B", "text": "Was" },
        { "key": "C", "text": "Were" },
        { "key": "D", "text": "Be" }
      ],
      "answerKey": {
        "correctOptionKey": "C"
      },
      "difficulty": "MEDIUM",
      "topic": "Conditional Sentences",
      "explanation": "In a hypothetical or unreal condition, were is traditionally used with all subjects in formal English: If I were you.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Which word is an abstract noun?",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Table" },
        { "key": "B", "text": "Courage" },
        { "key": "C", "text": "Bottle" },
        { "key": "D", "text": "Teacher" }
      ],
      "answerKey": {
        "correctOptionKey": "B"
      },
      "difficulty": "EASY",
      "topic": "Nouns",
      "explanation": "Courage is an abstract noun because it describes a quality that cannot be physically touched or seen.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Choose the correctly spelt word.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Pronounciation" },
        { "key": "B", "text": "Pronunciation" },
        { "key": "C", "text": "Pronounciacion" },
        { "key": "D", "text": "Pronuncation" }
      ],
      "answerKey": {
        "correctOptionKey": "B"
      },
      "difficulty": "EASY",
      "topic": "Spelling",
      "explanation": "The correct spelling is pronunciation, without the second o found in the related word pronounce.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "What is the superlative form of 'little' when referring to quantity?",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Littlest" },
        { "key": "B", "text": "Less" },
        { "key": "C", "text": "Least" },
        { "key": "D", "text": "More little" }
      ],
      "answerKey": {
        "correctOptionKey": "C"
      },
      "difficulty": "MEDIUM",
      "topic": "Degrees of Comparison",
      "explanation": "When little refers to quantity, its comparative form is less and its superlative form is least.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Choose the correct preposition: She is good _____ Mathematics.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "In" },
        { "key": "B", "text": "At" },
        { "key": "C", "text": "On" },
        { "key": "D", "text": "With" }
      ],
      "answerKey": {
        "correctOptionKey": "B"
      },
      "difficulty": "EASY",
      "topic": "Prepositions",
      "explanation": "The expression good at is used to describe someone's ability in an activity or subject.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Identify the main verb in this sentence: The children have been playing football.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Children" },
        { "key": "B", "text": "Have" },
        { "key": "C", "text": "Been" },
        { "key": "D", "text": "Playing" }
      ],
      "answerKey": {
        "correctOptionKey": "D"
      },
      "difficulty": "MEDIUM",
      "topic": "Verbs",
      "explanation": "Playing is the main lexical verb. Have and been function as auxiliary verbs in the present perfect continuous construction.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Which of the following is an example of an oxymoron?",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Deafening silence" },
        { "key": "B", "text": "Bright sunshine" },
        { "key": "C", "text": "Tall building" },
        { "key": "D", "text": "Cold water" }
      ],
      "answerKey": {
        "correctOptionKey": "A"
      },
      "difficulty": "MEDIUM",
      "topic": "Figures of Speech",
      "explanation": "An oxymoron combines two apparently contradictory terms. Deafening suggests loudness, while silence suggests the absence of sound.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Choose the correct passive form of: They are building a new school.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "A new school is built by them." },
        { "key": "B", "text": "A new school was being built by them." },
        { "key": "C", "text": "A new school is being built by them." },
        { "key": "D", "text": "A new school has built by them." }
      ],
      "answerKey": {
        "correctOptionKey": "C"
      },
      "difficulty": "MEDIUM",
      "topic": "Active and Passive Voice",
      "explanation": "The present continuous active construction are building changes to is being built in the passive voice. A new school is singular.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Which of the following is a collective noun?",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Honesty" },
        { "key": "B", "text": "Team" },
        { "key": "C", "text": "Beauty" },
        { "key": "D", "text": "Quickly" }
      ],
      "answerKey": {
        "correctOptionKey": "B"
      },
      "difficulty": "EASY",
      "topic": "Nouns",
      "explanation": "A collective noun names a group of people, animals or things considered as a unit. Team is a collective noun.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Choose the word that is opposite in meaning to 'transparent'.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Clear" },
        { "key": "B", "text": "Obvious" },
        { "key": "C", "text": "Opaque" },
        { "key": "D", "text": "Visible" }
      ],
      "answerKey": {
        "correctOptionKey": "C"
      },
      "difficulty": "MEDIUM",
      "topic": "Antonyms",
      "explanation": "Transparent means allowing light to pass through so objects can be seen clearly. Opaque means not allowing light to pass through.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Choose the correct sentence using the word 'fewer'.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "There is fewer water in the tank." },
        { "key": "B", "text": "She has fewer books than I do." },
        { "key": "C", "text": "He needs fewer sugar." },
        { "key": "D", "text": "We have fewer money now." }
      ],
      "answerKey": {
        "correctOptionKey": "B"
      },
      "difficulty": "MEDIUM",
      "topic": "Quantifiers",
      "explanation": "Fewer is used with countable plural nouns, such as books. Less is generally used with uncountable nouns such as water, sugar and money.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "What is the meaning of the idiom 'once in a blue moon'?",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Every night" },
        { "key": "B", "text": "Very rarely" },
        { "key": "C", "text": "Very quickly" },
        { "key": "D", "text": "At the right time" }
      ],
      "answerKey": {
        "correctOptionKey": "B"
      },
      "difficulty": "EASY",
      "topic": "Idioms",
      "explanation": "Once in a blue moon describes something that happens very rarely or infrequently.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Identify the type of sentence: Please close the door.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Interrogative" },
        { "key": "B", "text": "Exclamatory" },
        { "key": "C", "text": "Imperative" },
        { "key": "D", "text": "Declarative" }
      ],
      "answerKey": {
        "correctOptionKey": "C"
      },
      "difficulty": "EASY",
      "topic": "Sentence Types",
      "explanation": "An imperative sentence gives a command, instruction, request or advice. Please close the door is a polite instruction.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Choose the correct verb form: By the time we arrived, the train _____.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Leaves" },
        { "key": "B", "text": "Has left" },
        { "key": "C", "text": "Had left" },
        { "key": "D", "text": "Will leave" }
      ],
      "answerKey": {
        "correctOptionKey": "C"
      },
      "difficulty": "MEDIUM",
      "topic": "Tenses",
      "explanation": "The past perfect tense had left describes an action completed before another past action, which is arriving.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Which of these words is a pronoun?",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Himself" },
        { "key": "B", "text": "Quickly" },
        { "key": "C", "text": "Honest" },
        { "key": "D", "text": "Running" }
      ],
      "answerKey": {
        "correctOptionKey": "A"
      },
      "difficulty": "EASY",
      "topic": "Parts of Speech",
      "explanation": "Himself is a reflexive pronoun. It refers back to the subject of a sentence.",
      "marks": 5
    },
    {
      "questionType": "SINGLE_CHOICE",
      "questionText": "Select the correct word to complete the sentence: The news _____ encouraging.",
      "questionImages": [],
      "options": [
        { "key": "A", "text": "Are" },
        { "key": "B", "text": "Were" },
        { "key": "C", "text": "Is" },
        { "key": "D", "text": "Have" }
      ],
      "answerKey": {
        "correctOptionKey": "C"
      },
      "difficulty": "MEDIUM",
      "topic": "Subject-Verb Agreement",
      "explanation": "News is an uncountable noun that takes a singular verb, despite ending in s.",
      "marks": 5
    }
  ]

}
  classId: "6af43da9718344bf7ca92e3e"
  teacherId: "6af43ebad06e76c3a1c10053"
  "teacher email": "gbolagade@gmail.com",
  "owner email": "omoklazik@gmail.com",

  owner: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YWVjNDdlM2E5NjRkZGJiOWIwYmVlYzYiLCJlbWFpbCI6Im9tb2tsYXppa0BnbWFpbC5jb20iLCJyb2xlIjoiVVNFUiIsInBsYW5zIjpbXSwiaWF0IjoxNzk0ODkzNjQwLCJleHAiOjE3OTUxNTI4NDB9.5hF-UT0Hmf3q98U9xqmuDVyFKUpmzNwd8ZPu9SSl7ss"

  */
