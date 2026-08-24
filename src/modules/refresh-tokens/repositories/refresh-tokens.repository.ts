import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  RefreshToken,
  RefreshTokenDocument,
} from '../schemas/refresh-token.schema';

@Injectable()
export class RefreshTokensRepository {
  constructor(
    @InjectModel('RefreshToken')
    private RefreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async findByUserId(id: Types.ObjectId) {
    return this.RefreshTokenModel.findOne({
      userId: id,
    });
  }

  async create(data: Partial<RefreshToken>) {
    const refreshToken = new this.RefreshTokenModel(data);
    await refreshToken.save();
    return refreshToken;
  }

  async delete(id: Types.ObjectId) {
    return this.RefreshTokenModel.findByIdAndDelete(id);
  }
}
