import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { BlacklistedTokenDocument } from '../schemas/black-listed-token.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel('BlacklistedToken')
    private blacklistedToken: Model<BlacklistedTokenDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('envValues.secret'),
      // secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
    console.log('I am running jwt.strategy.ts');
  }

  async validate(req: Request, payload: any) {
    console.log('JWT STRATEGY validate called!');
    console.log('Payload:', payload);
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    console.log('Payload token:', token);
    const blacklisted = await this.blacklistedToken.findOne({ token });

    if (blacklisted) {
      throw new UnauthorizedException('Token has been revoked.');
    }
    console.log('payload inside JwtStrategy:', payload);
    return payload;
  }
}
