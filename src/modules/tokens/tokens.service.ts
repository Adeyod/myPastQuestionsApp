import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { generateCode } from '../../common/utils/code';
import { TokenCreationDto } from './dto/token-creation.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { TokensRepository } from './repositories/tokens.repository';
import { TokenPurpose } from './schemas/token.schema';

@Injectable()
export class TokensService {
  constructor(private tokensRepository: TokensRepository) {}

  async createToken(
    tokenCreationDto: TokenCreationDto,
  ): Promise<TokenResponseDto> {
    const token = generateCode(6);

    const payload = {
      user: tokenCreationDto.userId,
      purpose: tokenCreationDto.purpose,
      token: token.toString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };

    const newToken = await this.tokensRepository.create(payload);

    return newToken;
  }

  async findToken(
    token: string,
    purpose: TokenPurpose,
  ): Promise<TokenResponseDto> {
    const tokenExist = await this.tokensRepository.findOne(token, purpose);

    if (!tokenExist) {
      throw new NotFoundException({
        message: 'Token not found',
        status: 404,
        success: false,
      });
    }

    return tokenExist;
  }

  async findTokenByUserId(id: Types.ObjectId): Promise<TokenResponseDto> {
    const token = await this.tokensRepository.findById(id);

    if (!token) {
      throw new NotFoundException({
        message: 'Token not found',
        status: 404,
        success: false,
      });
    }

    return token;
  }
}
