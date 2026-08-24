import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TokensRepository } from './repositories/tokens.repository';
import { Token, TokenSchema } from './schemas/token.schema';
import { TokensService } from './tokens.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
  ],
  providers: [TokensService, TokensRepository],
  exports: [TokensService, MongooseModule, TokensRepository],
})
export class TokensModule {}
