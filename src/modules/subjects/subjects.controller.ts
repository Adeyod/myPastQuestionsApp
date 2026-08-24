import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { DeviceSessionGuard } from '../../common/guards/device-session.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PlanCode } from '../plans/schemas/plan.schema';
import { Role } from '../users/schemas/user.schema';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { SubjectResponseDto } from './dto/subject-response.dto';
import { SubjectsService } from './subjects.service';

@ApiExtraModels(SubjectResponseDto)
@Controller('subjects')
export class SubjectsController {
  constructor(private subjectsService: SubjectsService) {}

  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @Post('create-subject')
  @SuccessMessage('Subject created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Subject creation',
    description:
      'Creates a new subject. This is the endpoint that admin is going to use to create new subject. It is expecting accessToken from req.headers. it is also expecting DTO from req.body. Only admin can access this endpoint.',
  })
  @ApiResponse({
    status: 201,
    description: 'Subject created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to create subject',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async createSubject(@Body() createSubjectDto: CreateSubjectDto) {
    return await this.subjectsService.createSubject(createSubjectDto);
  }

  @Get('get-all-subjects')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage('Subjects fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'This is for getting all subjects on the app.',
    description:
      'Get all subjects with optional page, searchParams or limit, It is expecting page, limit and searchParams from req.query. This endpoint can only be accessed by admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lists of all subjects with pagination',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(SubjectResponseDto) },
        },

        meta: {
          type: 'object',
          properties: {
            totalPages: { type: 'number' },
            totalCount: { type: 'number' },
            limit: { type: 'number' },
          },
        },
      },
    },
  })
  async getAllSubjects(
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    return await this.subjectsService.getAllSubjects(queryWithPaginationDto);
  }
  @Get('get-all-subjects-per-category/:plan')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier for the user session',
    required: true,
    example: 'device-123456789',
  })
  @SuccessMessage(
    'Subjects For the selected category(Plan) fetched successfully.',
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'This is for getting all subjects based on the selected category(Plan).',
    description:
      'Get all subjects with optional page, searchParams or limit, It is expecting page, limit and searchParams from req.query. This endpoint can be accessed by admin and user.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Lists of all subjects based on selected category(Plan) with pagination',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(SubjectResponseDto) },
        },

        meta: {
          type: 'object',
          properties: {
            totalPages: { type: 'number' },
            totalCount: { type: 'number' },
            limit: { type: 'number' },
          },
        },
      },
    },
  })
  async getAllSubjectsPerCategory(
    @Param('plan') plan: PlanCode,
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    return await this.subjectsService.getAllSubjectsPerCategory(
      plan,
      queryWithPaginationDto,
    );
  }

  @Get(':subjectId')
  @UseGuards(JwtAuthGuard, DeviceSessionGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @SuccessMessage('Subject fetched successfully')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Subject fetched successfully.',
    description:
      'This is to fetch single subject using subjectId. It is expecting the subject ID from req.params',
  })
  @ApiResponse({
    status: 200,
    description: 'Subject fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to find subject',
  })
  @ApiResponse({
    status: 404,
    description: 'Subject not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getSubjectById(@Param('subjectId') subjectId: string) {
    return await this.subjectsService.getSubjectById(subjectId);
  }

  // async getAvailableYearsAndExamTypesBySubjectId(
  //   @Param('subjectId') subjectId: string,
  // ) {
  //   return await this.subjectsService.getAvailableYearsAndExamTypesBySubjectId(
  //     subjectId,
  //   );
  // }
}
