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

  @Get('start-assessment/:academicSessionId/:classId/:assessmentId')
  @UseGuards(
    JwtAuthGuard,
    DeviceSessionGuard,
    RolesGuard,
    SchoolMembershipGuard,
    SchoolRolesGuard,
  )
  @Roles(Role.USER)
  @SchoolRoles(SchoolRole.STUDENT)
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
  @SuccessMessage('Assessment started successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start assessment in a session',
    description:
      'This is the endpoint that student is going to use to start an assessment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assessment started successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to start assessment.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async startAssessmentByAssessmentId(
    @CurrentSchool() school: SchoolDocument,
    @Param('academicSessionId') academicSessionId: string,
    @Param('assessmentId') assessmentId: string,
    @Param('classId') classId: string,
    @CurrentSchoolMembership()
    membership: SchoolMembershipDocument,
  ) {
    const response =
      await this.schoolAssessmentsService.startAssessmentByAssessmentId(
        school._id.toString(),
        assessmentId,
        membership,
        academicSessionId,
        classId,
      );

    return response;
  }

  @Get('get-class-assessment-attempts-by-assessmentId/:assessmentId/:classId')
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
  @SuccessMessage('Subject Assessment attempts fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get an assessment by ID in a session',
    description:
      'This is the endpoint that subject teacher can use to Get student attempts for any assessment in a class.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subject Assessment attempts fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch assessment attempts.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getAssessmentAttemptsInAClassByAssessmentId(
    @CurrentSchool() school: SchoolDocument,
    @Param('assessmentId') assessmentId: string,
    @Param('classId') classId: string,
    @CurrentSchoolMembership()
    membership: SchoolMembershipDocument,
  ) {
    const response =
      await this.schoolAssessmentsService.getAssessmentAttemptsInAClassByAssessmentId(
        school._id.toString(),
        assessmentId,
        membership,
        classId,
      );

    return response;
  }
}

/*
{
        "questionId": "6afefb3ae8c342fe6222b13d",
        "questionType": "SINGLE_CHOICE",
        "questionText": "Choose the word nearest in meaning to 'abundant'.",
        "questionImages": [],
        "options": [
          {
            "key": "A",
            "text": "Scarce"
          },
          {
            "key": "B",
            "text": "Plentiful"
          },
          {
            "key": "C",
            "text": "Limited"
          },
          {
            "key": "D",
            "text": "Insufficient"
          }
        ],
        "marks": 5
      },




  classId: "6af43da9718344bf7ca92e3e"
  teacherId: "6af43ebad06e76c3a1c10053"
  "teacher email": "gbolagade@gmail.com",
  "owner email": "omoklazik@gmail.com",
  "student email": "omotolaade@gmail.com",
academicSessionId: "6af1af312933e3bc003b75d2"
subjectId: "6af43a3cdb43ea8761d9f4bd"
schoolId: "6aec47e4a964ddbb9b0beec9"

  owner:
  teacher: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YWY0M2ViOWQwNmU3NmMzYTFjMTAwNTAiLCJlbWFpbCI6Imdib2xhZ2FkZUBnbWFpbC5jb20iLCJyb2xlIjoiVVNFUiIsInBsYW5zIjpbXSwiaWF0IjoxNzk1NjkxMzI1LCJleHAiOjE3OTU5NTA1MjV9.Fw14zjsaKXH195brAzIUCSfW7oMrIpgM3-amk_FxCsY
  student: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YWYyOTVkM2M3NThjYjFlODZhN2U2NWIiLCJlbWFpbCI6Im9tb3RvbGFhZGVAZ21haWwuY29tIiwicm9sZSI6IlVTRVIiLCJwbGFucyI6W10sImlhdCI6MTc5NTcwODIyMywiZXhwIjoxNzk1OTY3NDIzfQ.IdJLNGlIrJdrA3Q7WLzumXL59ru4sTOb1mP4-l72rVI

  "questions": [
    {
      "questionType": "ESSAY",
      "questionText": "Write an essay of about 200 words on the importance of education in society.",
      "answerKey": {
        "modelAnswer": "Education develops knowledge, skills and values. It helps individuals become responsible citizens, improves employment opportunities and contributes to national development.",
        "markingGuide": "Award up to 5 marks: relevance to the topic (2 marks), organization and coherence (1 mark), grammar and vocabulary (1 mark), and spelling and punctuation (1 mark)."
      },
      "difficulty": "MEDIUM",
      "topic": "Essay Writing",
      "explanation": "A good essay should have a clear introduction, organized body paragraphs and a meaningful conclusion.",
      "marks": 5
    },
    {
      "questionType": "ESSAY",
      "questionText": "Describe three ways students can maintain discipline in school.",
      "answerKey": {
        "modelAnswer": "Students can maintain discipline by obeying school rules, respecting teachers and fellow students, and attending classes regularly.",
        "markingGuide": "Award up to 5 marks: one mark for each valid point (3 marks), clarity of explanation (1 mark), and correct grammar (1 mark)."
      },
      "difficulty": "EASY",
      "topic": "Essay Writing",
      "explanation": "Students should provide relevant points and explain how each contributes to discipline.",
      "marks": 5
    },
    {
      "questionType": "SHORT_ANSWER",
      "questionText": "Explain what a metaphor is and provide one example.",
      "answerKey": {
        "modelAnswer": "A metaphor is a figure of speech that describes one thing as another to suggest a similarity. Example: Time is money.",
        "markingGuide": "Award 2 marks for a correct definition and 3 marks for a relevant example with a clear explanation."
      },
      "difficulty": "MEDIUM",
      "topic": "Figures of Speech",
      "explanation": "A metaphor makes a direct comparison without using 'like' or 'as'.",
      "marks": 5
    },
    {
      "questionType": "SHORT_ANSWER",
      "questionText": "Differentiate between a phrase and a clause.",
      "answerKey": {
        "modelAnswer": "A phrase is a group of words that does not contain a subject and a finite verb combination. A clause is a group of words that contains a subject and a verb.",
        "markingGuide": "Award 2 marks for explaining a phrase and 2 marks for explaining a clause. Award 1 mark for a clear distinction."
      },
      "difficulty": "MEDIUM",
      "topic": "Grammar",
      "explanation": "A clause contains a subject and a verb, while a phrase does not form a complete subject-verb unit.",
      "marks": 5
    },
    {
      "questionType": "ESSAY",
      "questionText": "Write a letter to your friend explaining how you spent your last holiday.",
      "answerKey": {
        "modelAnswer": "The letter should describe activities undertaken during the holiday, places visited, people met and experiences enjoyed.",
        "markingGuide": "Award 1 mark for the address and date, 1 mark for salutation and introduction, 2 marks for the body, and 1 mark for the closing."
      },
      "difficulty": "MEDIUM",
      "topic": "Letter Writing",
      "explanation": "An informal letter should have the appropriate format, friendly tone and relevant details.",
      "marks": 5
    },
    {
      "questionType": "SHORT_ANSWER",
      "questionText": "What is the difference between active voice and passive voice?",
      "difficulty": "MEDIUM",
      "topic": "Voice",
      "explanation": "Active voice emphasizes the doer of an action, while passive voice emphasizes the receiver.",
      "marks": 5
    },
    {
      "questionType": "ESSAY",
      "questionText": "Discuss five causes of poor reading habits among secondary school students.",
      "difficulty": "MEDIUM",
      "topic": "Comprehension and Composition",
      "explanation": "Students should identify relevant causes and briefly explain each one.",
      "marks": 5
    },
    {
      "questionType": "SHORT_ANSWER",
      "questionText": "Explain the meaning of the idiom 'To bite off more than one can chew'.",
      "difficulty": "MEDIUM",
      "topic": "Idioms",
      "explanation": "The idiom refers to accepting more responsibility than one can handle.",
      "marks": 5
    },
    {
      "questionType": "ESSAY",
      "questionText": "Write a composition on the topic: The advantages and disadvantages of social media.",
      "difficulty": "MEDIUM",
      "topic": "Composition",
      "explanation": "A balanced composition should discuss both the positive and negative effects of social media.",
      "marks": 5
    },
    {
      "questionType": "SHORT_ANSWER",
      "questionText": "What is a conjunction? Give two examples.",
      "difficulty": "EASY",
      "topic": "Parts of Speech",
      "explanation": "Conjunctions connect grammatical units in sentences.",
      "marks": 5
    }
  ]
  */
