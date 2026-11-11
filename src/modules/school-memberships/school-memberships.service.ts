import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientSession, Connection, Types } from 'mongoose';

import { InjectConnection } from '@nestjs/mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { MailService } from '../../mail/mail.service';
import { AuthService } from '../auth/auth.service';
import { SchoolDocument } from '../schools/schemas/schools.schema';
import { CreateSchoolMembershipDto } from './dtos/create-school-membership.dto';
import { RegisterSchoolMemberDto } from './dtos/register-school-user.dto';
import { SchoolMembershipRepository } from './repositories/school-membership.repository';
import {
  SchoolMembershipDocument,
  SchoolRole,
} from './schemas/school-membership.schema';

@Injectable()
export class SchoolMembershipsService {
  constructor(
    private readonly schoolMembershipRepository: SchoolMembershipRepository,
    private readonly authService: AuthService,

    @InjectConnection()
    private readonly connection: Connection,

    private readonly mailService: MailService,
  ) {}

  async createSchoolMemberWithSession(
    payload: CreateSchoolMembershipDto,
    session: ClientSession,
  ) {
    const { schoolId, userId, role } = payload;

    if (!Types.ObjectId.isValid(schoolId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid school ID or user ID');
    }

    const membershipExists =
      await this.schoolMembershipRepository.userExistsInSchoolWithSession(
        schoolId,
        userId,
        session,
      );

    if (membershipExists) {
      throw new ConflictException({
        message: 'This user already has a membership in this school',
        success: false,
        status: 409,
      });
    }

    const response =
      await this.schoolMembershipRepository.createSchoolMemberWithSession(
        {
          schoolId: new Types.ObjectId(schoolId),
          userId: new Types.ObjectId(userId),
          role,
          isActive: true,
          joinedAt: new Date(),
        },
        session,
      );

    return response;
  }
  async registerSchoolMemberWithSessionByOwnerOrAdmin(
    member: SchoolMembershipDocument,
    school: SchoolDocument,
    payload: RegisterSchoolMemberDto,
  ) {
    const {
      role,
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      confirmPassword,
      referredBy,
    } = payload;
    const { role: memberRole } = member;

    if (memberRole === SchoolRole.ADMIN) {
      if (role === SchoolRole.ADMIN || role === SchoolRole.OWNER) {
        throw new BadRequestException({
          message:
            'You can only register students and teachers for the school.',
          success: false,
          status: 400,
        });
      }
    }

    if (memberRole === SchoolRole.OWNER) {
      if (role === SchoolRole.OWNER) {
        throw new BadRequestException({
          message:
            'You can only register admin, students and teachers for the school.',
          success: false,
          status: 400,
        });
      }
    }

    const session = await this.connection.startSession();

    let user: any;
    let pass: string = '';
    let verificationEmail: {
      email: string;
      firstName: string;
      token: string;
    } = {
      email: '',
      firstName: '',
      token: '',
    };

    try {
      await session.withTransaction(async () => {
        const userData = {
          firstName,
          lastName,
          email,
          phoneNumber,
          temporaryPassword: password,
        };

        const registerSchoolUser = await this.authService.registerSchoolUsers(
          userData,
          session,
        );

        console.log('registerSchoolUser:', registerSchoolUser);

        const membershipExists =
          await this.schoolMembershipRepository.userExistsInSchoolWithSession(
            school._id.toString(),
            registerSchoolUser.user._id.toString(),
            session,
          );

        console.log('membershipExists:', membershipExists);

        if (membershipExists) {
          throw new ConflictException({
            message: 'This user already has a membership in this school',
            success: false,
            status: 409,
          });
        }

        const response =
          await this.schoolMembershipRepository.createSchoolMemberWithSession(
            {
              schoolId: school._id,
              userId: registerSchoolUser.user._id,
              role,
              isActive: true,
              joinedAt: new Date(),
            },
            session,
          );

        console.log('create school membership response:', response);

        if (!response) {
          throw new BadRequestException({
            message: 'Unable to register school member account.',
            success: false,
            status: 400,
          });
        }

        verificationEmail = registerSchoolUser.verificationEmail;
        user = registerSchoolUser.user;
        pass = registerSchoolUser.pass;
      });
    } finally {
      await session.endSession();
    }

    if (
      verificationEmail.email !== '' &&
      verificationEmail.firstName !== '' &&
      verificationEmail.token !== '' &&
      pass !== ''
    ) {
      await this.mailService.sendVerificationEmail(
        verificationEmail.email,
        verificationEmail.firstName,
        verificationEmail.token,
      );
    }

    const data = {
      newUser: {
        email: verificationEmail.email,
        firstName: verificationEmail.firstName,
        lastName: user.lastName,
        password: pass,
      },
      message:
        'Please send the password to the account owner because this is the only time we are showing the password to you.',
    };

    console.log('return data:', data);

    return data;
  }
  async createSchoolMemberWithSessionByOwnerOrAdmin(
    member: SchoolMembershipDocument,
    payload: CreateSchoolMembershipDto,
    session: ClientSession,
  ) {
    const { schoolId, userId, role } = payload;
    const { role: memberRole } = member;

    if (memberRole === SchoolRole.ADMIN) {
      if (role === SchoolRole.ADMIN || role === SchoolRole.OWNER) {
        throw new BadRequestException({
          message:
            'You can only register students and teachers for the school.',
          success: false,
          status: 400,
        });
      }
    }
    if (memberRole === SchoolRole.OWNER) {
      if (role === SchoolRole.OWNER) {
        throw new BadRequestException({
          message:
            'You can only register admin, students and teachers for the school.',
          success: false,
          status: 400,
        });
      }
    }

    if (!Types.ObjectId.isValid(schoolId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException({
        message: 'Invalid school ID or user ID',
        success: false,
        status: 400,
      });
    }

    const membershipExists =
      await this.schoolMembershipRepository.userExistsInSchoolWithSession(
        schoolId,
        userId,
        session,
      );

    if (membershipExists) {
      throw new ConflictException({
        message: 'This user already has a membership in this school',
        success: false,
        status: 409,
      });
    }

    const response =
      await this.schoolMembershipRepository.createSchoolMemberWithSession(
        {
          schoolId: new Types.ObjectId(schoolId),
          userId: new Types.ObjectId(userId),
          role,
          isActive: true,
          joinedAt: new Date(),
        },
        session,
      );

    return response;
  }

  async findSchoolMemberShipByUserIdSchoolIdAndRole(
    schoolId: Types.ObjectId,
    membershipId: Types.ObjectId,
    role: SchoolRole,
    session: ClientSession,
  ) {
    const memberDoc =
      await this.schoolMembershipRepository.getSchoolMemberShipByUserIdSchoolIdAndRole(
        schoolId,
        membershipId,
        role,
        session,
      );

    if (!memberDoc) {
      throw new NotFoundException({
        message: 'Member not found.',
        success: false,
        status: 404,
      });
    }

    return memberDoc;
  }
  async findActiveSchoolMemberShipByUserIdSchoolIdAndRole(
    schoolId: Types.ObjectId,
    membershipId: Types.ObjectId,
    role: SchoolRole,
  ) {
    const memberDoc =
      await this.schoolMembershipRepository.getActiveSchoolMemberShipByUserIdSchoolIdAndRole(
        schoolId,
        membershipId,
        role,
      );

    if (!memberDoc) {
      throw new NotFoundException({
        message: 'Member not found.',
        success: false,
        status: 404,
      });
    }

    return memberDoc;
  }

  async findSchoolMembershipByUserIdAndSchoolId(
    school: SchoolDocument,
    member: SchoolMembershipDocument,
    schoolMemberId: string,
  ) {
    if (!Types.ObjectId.isValid(schoolMemberId)) {
      throw new BadRequestException({
        message: 'Invalid school membership ID.',
        success: false,
        status: 400,
      });
    }

    const targetMembership =
      await this.schoolMembershipRepository.findSchoolMembershipByUserIdAndSchoolId(
        new Types.ObjectId(schoolMemberId),
        school._id,
      );

    if (!targetMembership) {
      throw new NotFoundException({
        message: 'School membership not found.',
        success: false,
        status: 404,
      });
    }

    const isOwnMembership =
      member._id.toString() === targetMembership._id.toString();

    const canViewOtherMembers = [SchoolRole.OWNER, SchoolRole.ADMIN].includes(
      member.role,
    );

    if (!isOwnMembership && !canViewOtherMembers) {
      throw new ForbiddenException({
        message: "You are not permitted to view another member's membership.",
        success: false,
        status: 403,
      });
    }

    return targetMembership;
  }

  async findBySchool(schoolId: string, query: QueryWithPaginationDto) {
    const { page, limit, searchParams } = query;

    if (!Types.ObjectId.isValid(schoolId)) {
      throw new BadRequestException({
        message: 'Invalid school ID',
        success: false,
        status: 400,
      });
    }

    const result =
      await this.schoolMembershipRepository.findSchoolMembersBySchool(
        schoolId,
        query,
      );

    return result;
  }

  async findByUser(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException({
        message: 'Invalid user ID',
        success: false,
        status: 400,
      });
    }

    const response = await this.schoolMembershipRepository.findByUser(userId);
    return response;
  }

  async updateSchoolMembershipRole(membershipId: string, role: SchoolRole) {
    if (!Types.ObjectId.isValid(membershipId)) {
      throw new BadRequestException({
        message: 'Invalid membership ID',
        success: false,
        status: 400,
      });
    }

    const membership =
      await this.schoolMembershipRepository.updateSchoolMembershipRole(
        membershipId,
        role,
      );

    if (!membership) {
      throw new NotFoundException({
        message: 'School membership not found',
        success: false,
        status: 404,
      });
    }

    return membership;
  }

  async updateSchoolMembershipStatus(membershipId: string, isActive: boolean) {
    if (!Types.ObjectId.isValid(membershipId)) {
      throw new BadRequestException({
        message: 'Invalid membership ID',
        success: false,
        status: 400,
      });
    }

    const membership =
      await this.schoolMembershipRepository.updateSchoolMembershipStatus(
        membershipId,
        isActive,
      );

    if (!membership) {
      throw new NotFoundException({
        message: 'School membership not found',
        success: false,
        status: 404,
      });
    }

    return membership;
  }

  async getSchoolMembershipStats(schoolId: string) {
    const response =
      await this.schoolMembershipRepository.getSchoolMembershipStats(schoolId);

    return response;
  }
}
