import { Types } from 'mongoose';

export class RequestWithUser extends Request {
  user!: {
    _id: Types.ObjectId;
    email: string;
    role: string;
  };
}
