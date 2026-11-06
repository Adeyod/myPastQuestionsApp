import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { MailService } from '../../mail/mail.service';
import { AuthService } from '../auth/auth.service';
import { SchoolRole } from '../school-memberships/schemas/school-membership.schema';
import { SchoolMembershipsService } from '../school-memberships/school-memberships.service';
import { UsersRepository } from '../users/repositories/users.repository';
import { CreateSchoolDto } from './dtos/create-school.dto';
import { SchoolRepository } from './repositories/school.repository';
import { SchoolDocument } from './schemas/schools.schema';

@Injectable()
export class SchoolsService {
  constructor(
    private readonly schoolsRepository: SchoolRepository,
    private readonly authService: AuthService,
    private readonly usersRepository: UsersRepository,
    private readonly schoolMembershipsService: SchoolMembershipsService,

    @InjectConnection()
    private readonly connection: Connection,

    private readonly mailService: MailService,
  ) {}

  async createSchool(createSchoolDto: CreateSchoolDto) {
    const {
      schoolName,
      subDomain,
      schoolEmail,
      schoolPhone,
      state,
      town,
      address,
      accessMode,
      ownerFirstName,
      ownerLastName,
      ownerEmail,
      ownerPhoneNumber,
      ownerTemporaryPassword,
    } = createSchoolDto;

    const normalizedSubDomain = subDomain.trim().toLowerCase();
    const normalizedSchoolEmail = schoolEmail.trim().toLowerCase();
    const normalizedOwnerEmail = ownerEmail.trim().toLowerCase();

    const subDomainExists =
      await this.schoolsRepository.schoolExistsBySubDomain(normalizedSubDomain);

    if (subDomainExists) {
      throw new ConflictException({
        success: false,
        status: 409,
        message: 'This school subdomain is already registered',
      });
    }

    const schoolEmailExists = await this.schoolsRepository.schoolExistsByEmail(
      normalizedSchoolEmail,
    );

    if (schoolEmailExists) {
      throw new ConflictException({
        success: false,
        status: 409,
        message: 'This school email is already registered',
      });
    }

    const session = await this.connection.startSession();

    let createdSchool: any;
    let owner: any;
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
        const existingOwner = await this.usersRepository.findByEmailAndSession(
          normalizedOwnerEmail,
          session,
        );

        if (existingOwner) {
          if (!existingOwner.isVerified || !existingOwner.isActive) {
            throw new BadRequestException({
              success: false,
              status: 400,
              message:
                'The existing owner account must be verified and active before it can be linked to a school',
            });
          }

          owner = existingOwner;
        } else {
          const registration = await this.authService.registerSchoolOwner(
            {
              firstName: ownerFirstName,
              lastName: ownerLastName,
              email: normalizedOwnerEmail,
              phoneNumber: ownerPhoneNumber,
              temporaryPassword: ownerTemporaryPassword,
            },
            session,
          );

          owner = registration.user;
          verificationEmail = registration.verificationEmail;
        }

        createdSchool = await this.schoolsRepository.createSchoolWithSession(
          {
            schoolName: schoolName.trim(),
            schoolOwner: new Types.ObjectId(owner._id),
            subDomain: normalizedSubDomain,
            schoolEmail: normalizedSchoolEmail,
            schoolPhone: schoolPhone.trim(),
            state: state.trim(),
            town: town.trim(),
            address: address.trim(),
            accessMode,
            isActive: true,
          },
          session,
        );

        await this.schoolMembershipsService.createSchoolMemberWithSession(
          {
            schoolId: createdSchool._id.toString(),
            userId: owner._id.toString(),
            role: SchoolRole.OWNER,
          },
          session,
        );
      });
    } finally {
      await session.endSession();
    }

    if (
      verificationEmail.email !== '' &&
      verificationEmail.firstName !== '' &&
      verificationEmail.token !== ''
    ) {
      await this.mailService.sendVerificationEmail(
        verificationEmail.email,
        verificationEmail.firstName,
        verificationEmail.token,
      );
    }

    return {
      success: true,
      status: 201,
      message: 'School registered successfully',
      data: {
        school: createdSchool,
        owner: {
          _id: owner._id,
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email,
          phoneNumber: owner.phoneNumber,
        },
        ownerAccountCreated: Boolean(verificationEmail),
        emailVerificationRequired: Boolean(verificationEmail),
      },
    };
  }

  async getSchoolBySchoolId(schoolId: string) {
    const response = await this.schoolsRepository.findSchoolById(schoolId);

    if (!response) {
      throw new NotFoundException({
        message: 'School not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }

  async getSchoolDashboardBySchoolId(schoolId: string, school: SchoolDocument) {
    if (schoolId !== school._id.toString()) {
      throw new ConflictException({
        message: 'School ID mis match.',
        success: false,
        status: 409,
      });
    }

    const schoolDoc = await this.schoolsRepository.findSchoolById(schoolId);

    if (!schoolDoc) {
      throw new NotFoundException({
        message: 'School not found.',
        success: false,
        status: 404,
      });
    }

    const [membershipStats] = await Promise.all([
      this.schoolMembershipsService.getSchoolMembershipStats(schoolId),
    ]);

    const stats = {
      ...membershipStats,
    };

    return {
      schoolDoc,
      stats,
    };
  }
  async getSchoolBySubdomain(subdomain: string) {
    const response =
      await this.schoolsRepository.findSchoolBySubDomain(subdomain);

    if (!response) {
      throw new NotFoundException({
        message: 'School not found.',
        success: false,
        status: 404,
      });
    }
    return response;
  }

  async getAllSchools(queryDto: QueryWithPaginationDto) {
    const response = await this.schoolsRepository.getAllSchools(queryDto);

    return response;
  }
}
