// import { Type } from 'class-transformer';
// import {
//   IsArray,
//   IsBoolean,
//   IsEnum,
//   IsInt,
//   IsOptional,
//   IsString,
//   Min,
//   ValidateNested,
// } from 'class-validator';

// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// import { ExamType } from '../../../common/enums/exam-type.enum';
// import {
//   SolveAndWinContentBlock,
//   SolveAndWinDifficulty,
//   SolveAndWinExamSection,
// } from '../schemas/solve-and-win-question.schema';

// export class CreateSolveAndWinOptionDto {
//   @ApiProperty()
//   @IsString()
//   label!: string;

//   @ApiProperty()
//   @IsString()
//   value!: string;
// }

// export class CreateSolveAndWinQuestionDto {
//   @ApiProperty({
//     type: [SolveAndWinContentBlock],
//   })
//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => SolveAndWinContentBlock)
//   content!: SolveAndWinContentBlock[];

//   @ApiProperty()
//   @IsString()
//   question!: string;

//   @ApiPropertyOptional()
//   @IsOptional()
//   @IsString()
//   instruction?: string;

//   @ApiPropertyOptional()
//   @IsOptional()
//   @IsString()
//   topic?: string;

//   @ApiPropertyOptional()
//   @IsOptional()
//   @IsEnum(SolveAndWinExamSection)
//   section?: SolveAndWinExamSection;

//   @ApiProperty({
//     type: [CreateSolveAndWinOptionDto],
//   })
//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => CreateSolveAndWinOptionDto)
//   options!: CreateSolveAndWinOptionDto[];

//   @ApiProperty({
//     type: [String],
//   })
//   @IsArray()
//   @IsString({ each: true })
//   correctAnswers!: string[];

//   @ApiPropertyOptional()
//   @IsOptional()
//   @IsString()
//   answer?: string;

//   // @ApiPropertyOptional()
//   // @IsOptional()
//   // @IsString()
//   // solution?: string;

//   @ApiPropertyOptional()
//   @IsOptional()
//   @IsString()
//   explanation?: string;

//   @ApiPropertyOptional({
//     type: [String],
//   })
//   @IsOptional()
//   @IsArray()
//   @IsString({ each: true })
//   explanationSteps?: string[];

//   @ApiPropertyOptional()
//   @IsOptional()
//   @IsEnum(SolveAndWinDifficulty)
//   difficulty?: SolveAndWinDifficulty;

//   // @ApiPropertyOptional()
//   // @IsOptional()
//   // @IsString()
//   // category?: string;

//   @ApiPropertyOptional()
//   @IsOptional()
//   @IsString()
//   examType?: ExamType;

//   @ApiPropertyOptional()
//   @IsOptional()
//   @IsString()
//   apiSubjectName?: string;

//   @ApiPropertyOptional()
//   @IsOptional()
//   @IsBoolean()
//   isMultipleAnswer?: boolean;

//   @ApiPropertyOptional()
//   @IsOptional()
//   @IsInt()
//   @Min(1)
//   marks?: number;
// }

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { ExamType } from '../../../common/enums/exam-type.enum';
import { TextStyle } from '../../../common/enums/question-type.enum';
import {
  SolveAndWinContentType,
  SolveAndWinDifficulty,
  SolveAndWinExamSection,
} from '../schemas/solve-and-win-question.schema';

/* =========================================================
   SEGMENT
========================================================= */

export class CreateSolveAndWinSegmentDto {
  @ApiProperty({
    example: 'The mitochondria is the powerhouse of the cell.',
  })
  @IsString()
  text!: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['bold'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  styles?: TextStyle[];
}

/* =========================================================
   IMAGE
========================================================= */

export class CreateSolveAndWinImageDto {
  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/example/image/upload/sample.jpg',
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/images/sample.jpg',
  })
  @IsOptional()
  @IsString()
  publicUrl?: string;
}

/* =========================================================
   GRAPH DATASET
========================================================= */

export class CreateSolveAndWinGraphDatasetDto {
  @ApiProperty({
    example: 'Sales',
  })
  @IsString()
  label!: string;

  @ApiProperty({
    type: [Number],
    example: [10, 20, 30, 40],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  data!: number[];
}

/* =========================================================
   GRAPH
========================================================= */

export class CreateSolveAndWinGraphDto {
  @ApiProperty({
    enum: ['line', 'bar', 'pie'],
    example: 'bar',
  })
  @IsString()
  type!: 'line' | 'bar' | 'pie';

  @ApiProperty({
    type: [String],
    example: ['January', 'February', 'March'],
  })
  @IsArray()
  @IsString({ each: true })
  labels!: string[];

  @ApiProperty({
    type: [CreateSolveAndWinGraphDatasetDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSolveAndWinGraphDatasetDto)
  datasets!: CreateSolveAndWinGraphDatasetDto[];
}

/* =========================================================
   CONTENT BLOCK
========================================================= */

export class CreateSolveAndWinContentBlockDto {
  @ApiProperty({
    enum: SolveAndWinContentType,
    example: SolveAndWinContentType.TEXT,
  })
  @IsEnum(SolveAndWinContentType)
  type!: SolveAndWinContentType;

  @ApiProperty({
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  order!: number;

  /* ---------------- TEXT ---------------- */

  @ApiPropertyOptional({
    type: [CreateSolveAndWinSegmentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSolveAndWinSegmentDto)
  segments?: CreateSolveAndWinSegmentDto[];

  /* ---------------- IMAGE ---------------- */

  // @ApiPropertyOptional({
  //   type: CreateSolveAndWinImageDto,
  // })
  // @IsOptional()
  // @ValidateNested()
  // @Type(() => CreateSolveAndWinImageDto)
  // image?: CreateSolveAndWinImageDto;

  // @ApiPropertyOptional({
  //   example: 'Diagram showing the structure of a cell',
  // })
  // @IsOptional()
  // @IsString()
  // alt?: string;

  /* ---------------- EQUATION ---------------- */

  @ApiPropertyOptional({
    example: 'E = mc^2',
  })
  @IsOptional()
  @IsString()
  latex?: string;

  /* ---------------- TABLE ---------------- */

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    example: [
      ['Name', 'Age', 'Score'],
      ['John', '15', '80'],
      ['Mary', '16', '90'],
    ],
  })
  @IsOptional()
  @IsArray()
  table?: string[][];

  /* ---------------- GRAPH ---------------- */

  @ApiPropertyOptional({
    type: CreateSolveAndWinGraphDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSolveAndWinGraphDto)
  graph?: CreateSolveAndWinGraphDto;

  /* ---------------- LIST ---------------- */

  // @ApiPropertyOptional({
  //   type: [String],
  //   example: [
  //     'Photosynthesis occurs in plants.',
  //     'Chlorophyll absorbs light energy.',
  //   ],
  // })
  // @IsOptional()
  // @IsArray()
  // @IsString({ each: true })
  // items?: string[];

  /* ---------------- METADATA ---------------- */

  // @ApiPropertyOptional({
  //   type: Object,
  //   example: {
  //     alignment: 'center',
  //     fontSize: 16,
  //   },
  // })
  // @IsOptional()
  // @IsObject()
  // metadata?: Record<string, any>;
}

/* =========================================================
   OPTION
========================================================= */

export class CreateSolveAndWinOptionDto {
  @ApiProperty({
    example: 'A',
  })
  @IsString()
  label!: string;

  @ApiProperty({
    example: 'Mitochondria',
  })
  @IsString()
  value!: string;
}

/* =========================================================
   QUESTION
========================================================= */

export class CreateSolveAndWinQuestionDto {
  @ApiProperty({
    type: [CreateSolveAndWinContentBlockDto],
    description: 'Rich content blocks that make up the question.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSolveAndWinContentBlockDto)
  content!: CreateSolveAndWinContentBlockDto[];

  @ApiProperty({
    example: 'Which organelle is known as the powerhouse of the cell?',
  })
  @IsString()
  question!: string;

  @ApiPropertyOptional({
    example: 'Choose the correct answer.',
  })
  @IsOptional()
  @IsString()
  instruction?: string;

  @ApiPropertyOptional({
    example: 'Cell Biology',
  })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({
    enum: SolveAndWinExamSection,
    example: SolveAndWinExamSection.OBJECTIVE,
  })
  @IsOptional()
  @IsEnum(SolveAndWinExamSection)
  section?: SolveAndWinExamSection;

  @ApiProperty({
    type: [CreateSolveAndWinOptionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSolveAndWinOptionDto)
  options!: CreateSolveAndWinOptionDto[];

  @ApiProperty({
    type: [String],
    example: ['Mitochondria'],
  })
  @IsArray()
  @IsString({ each: true })
  correctAnswers!: string[];

  // @ApiPropertyOptional({
  //   example: 'Mitochondria',
  // })
  // @IsOptional()
  // @IsString()
  // answer?: string;

  @ApiPropertyOptional({
    example:
      'Mitochondria is called the powerhouse of the cell because it produces ATP.',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({
    type: [String],
    example: [
      'Mitochondria contain enzymes required for cellular respiration.',
      'Cellular respiration produces ATP.',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  explanationSteps?: string[];

  @ApiPropertyOptional({
    enum: SolveAndWinDifficulty,
    example: SolveAndWinDifficulty.EASY,
  })
  @IsOptional()
  @IsEnum(SolveAndWinDifficulty)
  difficulty?: SolveAndWinDifficulty;

  @ApiPropertyOptional({
    enum: ExamType,
  })
  @IsOptional()
  @IsEnum(ExamType)
  examType?: ExamType;

  @ApiPropertyOptional({
    example: 'Biology',
  })
  @IsOptional()
  @IsString()
  apiSubjectName?: string;

  @ApiPropertyOptional({
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isMultipleAnswer?: boolean;

  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  marks?: number;
}
