import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Token, TokenDocument, TokenPurpose } from '../schemas/token.schema';

@Injectable()
export class TokensRepository {
  constructor(
    @InjectModel('Token')
    private tokenModel: Model<TokenDocument>,
  ) {}

  async findById(id: Types.ObjectId) {
    const response = await this.tokenModel.findById(id);
    return response;
  }

  async findOneByUserIdAndPurpose(
    userId: Types.ObjectId,
    purpose: TokenPurpose,
  ) {
    const response = await this.tokenModel.findOne({
      user: userId,
      purpose,
    });

    return response;
  }

  async findOne(token: string, purpose: TokenPurpose) {
    const response = await this.tokenModel.findOne({
      token,
      purpose,
    });

    return response;
  }

  async createWithSession(data: Partial<Token>, session: ClientSession) {
    const token = new this.tokenModel(data);
    await token.save({ session });
    return token;
  }
  async create(data: Partial<Token>) {
    const token = new this.tokenModel(data);
    await token.save();
    return token;
  }

  async delete(id: Types.ObjectId) {
    const response = await this.tokenModel.findByIdAndDelete(id);

    return response;
  }
}
