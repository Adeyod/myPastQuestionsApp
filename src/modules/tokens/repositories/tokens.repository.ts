import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Token, TokenDocument, TokenPurpose } from '../schemas/token.schema';

@Injectable()
export class TokensRepository {
  constructor(
    @InjectModel('Token')
    private tokenModel: Model<TokenDocument>,
  ) {}

  async findById(id: Types.ObjectId) {
    return this.tokenModel.findById(id);
  }

  async findOneByUserIdAndPurpose(
    userId: Types.ObjectId,
    purpose: TokenPurpose,
  ) {
    return this.tokenModel.findOne({
      user: userId,
      purpose,
    });
  }

  async findOne(token: string, purpose: TokenPurpose) {
    return this.tokenModel.findOne({
      token,
      purpose,
    });
  }

  async create(data: Partial<Token>) {
    const token = new this.tokenModel(data);
    await token.save();
    return token;
  }

  async delete(id: Types.ObjectId) {
    return this.tokenModel.findByIdAndDelete(id);
  }
}
