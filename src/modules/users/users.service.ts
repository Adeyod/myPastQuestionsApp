import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { MailService } from '../../mail/mail.service';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private mailService: MailService,
  ) {}
  async findUserDetails(id: Types.ObjectId) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        success: false,
        status: 404,
      });
    }

    const userObj = user.toObject();
    const { password, ...others } = userObj;

    return others;
  }
  async findUserById(id: Types.ObjectId): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        success: false,
        status: 404,
      });
    }

    const userObj = user.toObject();
    const { password, ...others } = userObj;

    return others;
  }

  async findUserByEmail(email: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        success: false,
        status: 404,
      });
    }

    const userObj = user.toObject();

    const { password, ...others } = userObj;

    return others;
  }

  async verifyUser(id: Types.ObjectId): Promise<UserResponseDto> {
    const user = await this.usersRepository.update(id, { isVerified: true });

    if (!user) {
      throw new BadRequestException({
        message: 'Unable to verify user',
        status: 400,
        success: false,
      });
    }

    const { password, ...others } = user.toObject();

    return others;
  }

  async resetPassword(
    id: Types.ObjectId,
    hashedPassword: string,
  ): Promise<UserResponseDto> {
    const findUserAndUpdate = await this.usersRepository.update(id, {
      password: hashedPassword,
    });

    if (!findUserAndUpdate) {
      throw new BadRequestException({
        message: 'Unable to reset user password',
        success: false,
        status: 400,
      });
    }

    const { password, ...others } = findUserAndUpdate;

    return others;
  }

  async createUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
    referredBy: string | undefined;
  }): Promise<UserResponseDto> {
    const user = await this.usersRepository.create(data);

    if (!user) {
      throw new UnauthorizedException({
        message: 'Unable to create user',
        success: false,
        status: 401,
      });
    }

    const { password, ...others } = user;
    return others;
  }

  async getAllUsers(queryWithPaginationDto: QueryWithPaginationDto) {
    const response = await this.usersRepository.findAllWithPagination(
      queryWithPaginationDto,
    );
    return response;
  }

  async sendEmailNotificationToAllUnsibscribedUsers() {
    const unsubscribedUsers =
      await this.usersRepository.findAllUnsubscribedUsers();

    if (unsubscribedUsers.length === 0) {
      throw new NotFoundException({
        message: 'No user found to be unsubscribed.',
        success: false,
        status: 404,
      });
    }

    const payload = unsubscribedUsers.map((user) => {
      const response = {
        email: user.email,
        first_name: user.firstName,
      };

      return response;
    });

    const subject = `Plan Activation Reminder`;

    const mailResponse = await this.mailService.sendBulkEmails(
      payload,
      subject,
    );
    console.log('mailResponse:', mailResponse);

    return {
      message: 'Email notification sent successfully.',
    };
  }
}
