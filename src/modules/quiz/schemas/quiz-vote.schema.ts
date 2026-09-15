import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuizVoteDocument = QuizVote & Document;

@Schema({ timestamps: true })
export class QuizVote {
  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true, index: true })
  quizId!: Types.ObjectId;

  @Prop({ required: true })
  roundNumber!: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  voterUserId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  votedParticipantId!: Types.ObjectId;
}

export const QuizVoteSchema = SchemaFactory.createForClass(QuizVote);
// QuizVoteSchema.index(
//   { quizId: 1, roundNumber: 1, voterUserId: 1 },
//   { unique: true },
// );
