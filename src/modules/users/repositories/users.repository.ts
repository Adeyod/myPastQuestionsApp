import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { generateRefCode } from '../../../common/utils/helper';
import { Role, User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel('User') private userModel: Model<UserDocument>) {}

  async findById(id: Types.ObjectId): Promise<UserDocument | null> {
    const response = await this.userModel.findOne({ _id: id, isActive: false });

    console.log('response:', response);

    return response;
  }
  async findByIdWithSession(
    id: Types.ObjectId,
    session: ClientSession,
  ): Promise<UserDocument | null> {
    const response = await this.userModel
      .findOne({ _id: id, isActive: false })
      .session(session);

    console.log('response:', response);
    return response;
  }

  async countDocuments(filter: any) {
    return await this.userModel.countDocuments(filter);
  }

  async getThoseThatIReferred(filter: any) {
    return await this.userModel.find(filter);
  }

  async findManyByIds(
    ids: string[] | Types.ObjectId[],
  ): Promise<UserDocument[]> {
    const objectIds = ids.map((id) =>
      typeof id === 'string' ? new Types.ObjectId(id) : id,
    );

    return await this.userModel.find({
      _id: { $in: objectIds },
    });
  }
  async findManyByIdsWithSession(
    ids: string[] | Types.ObjectId[],
    session: ClientSession,
  ): Promise<UserDocument[]> {
    const objectIds = ids.map((id) =>
      typeof id === 'string' ? new Types.ObjectId(id) : id,
    );

    return await this.userModel
      .find({
        _id: { $in: objectIds },
      })
      .session(session);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({
      email: email.toLowerCase().trim(),
      isActive: false,
    });

    console.log('user:', user);

    return user;
  }

  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
    referredBy: string | undefined;
  }): Promise<UserDocument> {
    let refCode: string;
    let exists = true;
    let referralChain: { userId: Types.ObjectId; level: number }[] = [];

    do {
      const code = generateRefCode();
      refCode = code;
      const existing = await this.userModel.exists({
        referralCode: refCode.trim().toLowerCase(),
      });
      exists = !!existing;
    } while (exists);

    const referralCode = refCode;

    let referredById: Types.ObjectId | null = null;

    if (data.referredBy) {
      const parent = await this.userModel.findOne({
        referralCode: data.referredBy,
      });

      if (parent) {
        referredById = parent?._id;
      }

      if (parent) {
        const parentChain = parent.referralChain || [];

        referralChain = [
          { userId: parent._id, level: 1 },
          ...parentChain.slice(0, 2).map((item) => ({
            userId: item.userId,
            level: item.level + 1,
          })),
        ];
      }
    }

    const user = new this.userModel({
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
      email: data.email,
      phoneNumber: data.phoneNumber,
      referralCode: referralCode,
      referredBy: referredById || null,
      referralChain: referralChain,
    });
    await user.save();

    return user;
  }

  async update(
    id: Types.ObjectId,
    data: Partial<User>,
  ): Promise<UserDocument | null> {
    return await this.userModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
    });
  }

  async queryAllReferredBy(userId: Types.ObjectId) {
    const referrals = await this.userModel.aggregate([
      {
        $match: { _id: userId },
      },
      {
        $graphLookup: {
          from: 'users',
          startWith: '$referredBy',
          connectFromField: 'referredBy',
          connectToField: '_id',
          as: 'referralChain',
          maxDepth: 2,
          depthField: 'level',
        },
      },
    ]);

    console.log('referrals:', referrals);
    return referrals;
  }

  async findAllWithPagination(
    queryWithPaginationDto: QueryWithPaginationDto,
  ): Promise<{
    userObj: UserDocument[];
    totalPages: number;
    totalCount: number;
  }> {
    const { page, searchParams, limit } = queryWithPaginationDto;

    let query = this.userModel.find({ role: Role.USER, isActive: false });

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [
          { firstName: { $regex: regex } },
          { lastName: { $regex: regex } },
          { email: { $regex: regex } },
          { referralCode: { $regex: regex } },
        ],
      });
    }

    const count = await query.clone().countDocuments();
    let pages = 0;

    if (page !== undefined && limit !== undefined && count !== 0) {
      const offset = (page - 1) * limit;

      query = query.skip(offset).limit(limit);

      pages = Math.ceil(count / limit);

      if (page > pages) {
        throw new NotFoundException({
          message: 'Page can not be found.',
          status: 404,
          success: false,
        });
      }
    }

    const users = await query.sort({ createdAt: -1 }).select('-password');

    if (users.length === 0) {
      throw new NotFoundException({
        message: 'Users not found',
        success: false,
        status: 404,
      });
    }

    const response = {
      userObj: users,
      totalPages: pages,
      totalCount: count,
    };
    return response;
  }

  async assignDefaultToUsers() {
    const defaultId = new Types.ObjectId('69b57ce53426b1b900984393');

    const result = await this.userModel.updateMany(
      {
        $or: [{ referredBy: { $exists: false } }, { referredBy: null }],
      },
      {
        $set: {
          referredBy: defaultId,
        },
        $push: {
          referralChain: {
            userId: defaultId,
            level: 1,
          },
        },
      },
    );

    console.log('assignDefaultToUsers:', result);

    const message = 'Default referrer assigned successfully.';
    const matchedCount = result.matchedCount;
    const modifiedCount = result.modifiedCount;

    console.log('assignDefaultToUsers message:', message);
    console.log('assignDefaultToUsers matchedCount:', matchedCount);
    console.log('assignDefaultToUsers modifiedCount:', modifiedCount);

    return {
      message,
      matchedCount,
      modifiedCount,
    };
  }

  // async setExistingUsersInactive() {
  //   const result = await this.userModel.updateMany(
  //     {
  //       isActive: { $exists: false },
  //     },
  //     {
  //       $set: {
  //         isActive: false,
  //       },
  //     },
  //   );

  //   console.log('setExistingUsersInactive result:', result);

  //   return {
  //     message: 'Existing users updated successfully.',
  //     matchedCount: result.matchedCount,
  //     modifiedCount: result.modifiedCount,
  //   };
  // }
}
