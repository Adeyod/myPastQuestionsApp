import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QuizVote, QuizVoteDocument } from '../schemas/quiz-vote.schema';

@Injectable()
export class QuizVoteRepository {
  constructor(
    @InjectModel(QuizVote.name)
    private readonly voteModel: Model<QuizVoteDocument>,
  ) {}

  async createVote(
    quizId: Types.ObjectId,
    roundNumber: number,
    voterUserId: Types.ObjectId,
    votedParticipantId: Types.ObjectId,
  ): Promise<QuizVoteDocument> {
    const response = await new this.voteModel({
      quizId,
      roundNumber,
      voterUserId,
      votedParticipantId,
    }).save();

    return response;
  }

  async getTallyForRound(quizId: Types.ObjectId, roundNumber: number) {
    const response = await this.voteModel.aggregate([
      { $match: { quizId, roundNumber } },
      { $group: { _id: '$votedParticipantId', voteCount: { $sum: 1 } } },
      { $sort: { voteCount: -1 } },
    ]);

    return response;
  }
}
