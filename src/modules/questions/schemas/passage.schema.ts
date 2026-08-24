import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ContentBlock } from './question.schema';

export type PassageDocument = Passage & Document;

@Schema({ timestamps: true })
export class Passage {
  // Main passage content (rich text, images, etc.)
  @Prop({ type: [ContentBlock], required: true })
  content!: ContentBlock[];

  // Optional title (e.g. "Passage 1")
  @Prop({ trim: true })
  title?: string;

  // Optional instruction (VERY useful)
  @Prop({ default: '' })
  instruction?: string;

  // Example:
  // "Read the passage carefully and answer the questions below"

  // Link to subject
  @Prop({ required: true, ref: 'Subject' })
  subject!: Types.ObjectId;

  // Exam metadata (helps filtering)
  @Prop({ default: '' })
  examType?: string;

  @Prop({ default: '' })
  examYear?: string;

  // Difficulty (optional but useful)
  @Prop({
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  })
  difficulty?: string;

  // Questions linked to this passage
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Question' }], default: [] })
  questionIds?: Types.ObjectId[];

  // For ordering passages in exams
  @Prop({ default: 1 })
  order?: number;

  // Extra flexible metadata
  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;
}

export const PassageSchema = SchemaFactory.createForClass(Passage);

// 🔥 Helpful indexes
PassageSchema.index({ subject: 1, examType: 1 });
PassageSchema.index({ examYear: 1 });

/**
 * {
  "year": "2021",
  "examType": "jamb",
  "subject": "English",
  "section": "objective",
  "type": "mcq",
  "questions": [
    {
      "id": "eng-2021-1",
      "content": [
        {
          "type": "text",
          "order": 1,
          "text": "Choose the option nearest in meaning to the underlined word.",
          "segments": [
            {
              "text": "The man was very eloquent.",
              "styles": ["italic"]
            }
          ]
        }
      ],
      "options": [
        { "label": "A", "value": "confused" },
        { "label": "B", "value": "fluent" },
        { "label": "C", "value": "silent" },
        { "label": "D", "value": "angry" }
      ],
      "correctAnswers": ["B"],
      "explanation": "Eloquent means fluent or persuasive in speech.",
      "instruction": "Choose the correct answer",
      "topic": "Lexis and Structure",
      "difficulty": "medium"
    },

    {
      "id": "eng-2021-2",
      "content": [
        {
          "type": "text",
          "order": 1,
          "text": "Choose the word opposite in meaning to:",
          "segments": [
            {
              "text": "scarce",
              "styles": ["bold"]
            }
          ]
        }
      ],
      "options": [
        { "label": "A", "value": "rare" },
        { "label": "B", "value": "plenty" },
        { "label": "C", "value": "few" },
        { "label": "D", "value": "little" }
      ],
      "correctAnswers": ["B"],
      "explanation": "Scarce means limited; opposite is plenty.",
      "instruction": "Choose the correct answer",
      "topic": "Antonyms",
      "difficulty": "easy"
    },

    {
      "id": "eng-2021-3",
      "content": [
        {
          "type": "text",
          "order": 1,
          "text": "Fill in the gap:",
          "segments": [
            {
              "text": "She has been waiting here ___ morning.",
              "styles": []
            }
          ]
        }
      ],
      "options": [
        { "label": "A", "value": "since" },
        { "label": "B", "value": "for" },
        { "label": "C", "value": "from" },
        { "label": "D", "value": "by" }
      ],
      "correctAnswers": ["A"],
      "explanation": "‘Since’ is used with a point in time.",
      "instruction": "Choose the correct answer",
      "topic": "Grammar",
      "difficulty": "medium"
    },

    {
      "id": "eng-2021-4",
      "content": [
        {
          "type": "text",
          "order": 1,
          "text": "Choose the correct spelling.",
          "segments": []
        }
      ],
      "options": [
        { "label": "A", "value": "Occassion" },
        { "label": "B", "value": "Occasion" },
        { "label": "C", "value": "Ocassion" },
        { "label": "D", "value": "Ocasion" }
      ],
      "correctAnswers": ["B"],
      "explanation": "Correct spelling is Occasion.",
      "instruction": "Choose the correct answer",
      "topic": "Spelling",
      "difficulty": "easy"
    },

    {
      "id": "eng-2021-5",
      "content": [
        {
          "type": "text",
          "order": 1,
          "text": "Choose the correct sentence.",
          "segments": []
        }
      ],
      "options": [
        { "label": "A", "value": "He don't like rice." },
        { "label": "B", "value": "He doesn't likes rice." },
        { "label": "C", "value": "He doesn't like rice." },
        { "label": "D", "value": "He not like rice." }
      ],
      "correctAnswers": ["C"],
      "explanation": "Correct subject-verb agreement.",
      "instruction": "Choose the correct answer",
      "topic": "Grammar",
      "difficulty": "easy"
    },

    {
      "id": "eng-2021-6",
      "content": [
        {
          "type": "text",
          "order": 1,
          "text": "Choose the appropriate interpretation:",
          "segments": [
            {
              "text": "He kicked the bucket.",
              "styles": ["italic"]
            }
          ]
        }
      ],
      "options": [
        { "label": "A", "value": "He fell down" },
        { "label": "B", "value": "He died" },
        { "label": "C", "value": "He got angry" },
        { "label": "D", "value": "He played football" }
      ],
      "correctAnswers": ["B"],
      "explanation": "Idiomatic expression meaning he died.",
      "instruction": "Choose the correct answer",
      "topic": "Idioms",
      "difficulty": "medium"
    },

    {
      "id": "eng-2021-7",
      "content": [
        {
          "type": "text",
          "order": 1,
          "text": "Choose the word that has the same vowel sound as:",
          "segments": [
            {
              "text": "seat",
              "styles": ["bold"]
            }
          ]
        }
      ],
      "options": [
        { "label": "A", "value": "sit" },
        { "label": "B", "value": "set" },
        { "label": "C", "value": "beat" },
        { "label": "D", "value": "sat" }
      ],
      "correctAnswers": ["C"],
      "explanation": "Seat and beat share /i:/ sound.",
      "instruction": "Choose the correct answer",
      "topic": "Oral English",
      "difficulty": "medium"
    },

    {
      "id": "eng-2021-8",
      "content": [
        {
          "type": "text",
          "order": 1,
          "text": "Identify the stressed syllable in:",
          "segments": [
            {
              "text": "reCORD (verb)",
              "styles": ["bold"]
            }
          ]
        }
      ],
      "options": [
        { "label": "A", "value": "first syllable" },
        { "label": "B", "value": "second syllable" },
        { "label": "C", "value": "both" },
        { "label": "D", "value": "none" }
      ],
      "correctAnswers": ["B"],
      "explanation": "Verb form stresses second syllable.",
      "instruction": "Choose the correct answer",
      "topic": "Oral English",
      "difficulty": "medium"
    },

    {
      "id": "eng-2021-9",
      "content": [
        {
          "type": "text",
          "order": 1,
          "text": "Fill in the gap:",
          "segments": [
            {
              "text": "Neither John nor his friends ___ coming.",
              "styles": []
            }
          ]
        }
      ],
      "options": [
        { "label": "A", "value": "is" },
        { "label": "B", "value": "are" },
        { "label": "C", "value": "was" },
        { "label": "D", "value": "be" }
      ],
      "correctAnswers": ["B"],
      "explanation": "Verb agrees with nearest subject.",
      "instruction": "Choose the correct answer",
      "topic": "Grammar",
      "difficulty": "medium"
    },

    {
      "id": "eng-2021-10",
      "content": [
        {
          "type": "text",
          "order": 1,
          "text": "Choose the synonym of:",
          "segments": [
            {
              "text": "abundant",
              "styles": ["bold"]
            }
          ]
        }
      ],
      "options": [
        { "label": "A", "value": "scarce" },
        { "label": "B", "value": "plentiful" },
        { "label": "C", "value": "little" },
        { "label": "D", "value": "rare" }
      ],
      "correctAnswers": ["B"],
      "explanation": "Abundant means plentiful.",
      "instruction": "Choose the correct answer",
      "topic": "Synonyms",
      "difficulty": "easy"
    }
  ]
}
 */
