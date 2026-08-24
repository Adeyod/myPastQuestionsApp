// import {
//   CanActivate,
//   ExecutionContext,
//   Injectable,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { UserSessionService } from '../../modules/user-session/user-session.service';
// import { Role } from '../../modules/users/schemas/user.schema';

// @Injectable()
// export class DeviceSessionGuard implements CanActivate {
//   constructor(private readonly userSessionService: UserSessionService) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const request = context.switchToHttp().getRequest();

//     const user = request.user;

//     if (!user) {
//       throw new UnauthorizedException({
//         message: 'User not authenticated',
//         success: false,
//         status: 401,
//       });
//     }

//     if (user.role === Role.ADMIN) {
//       return true;
//     }

//     const deviceId = request.headers['x-device-id'];

//     if (!deviceId) {
//       throw new UnauthorizedException({
//         message: 'Device ID is required',
//         success: false,
//         status: 401,
//       });
//     }

//     const userId = user.sub.toString();

//     const session = await this.userSessionService.findByUserAndDevice(
//       userId,
//       deviceId,
//     );

//     if (!session) {
//       throw new UnauthorizedException({
//         message: 'Invalid or expired session',
//         success: false,
//         status: 401,
//       });
//     }

//     if (session.deviceId !== deviceId) {
//       throw new UnauthorizedException({
//         message: 'You are already logged in on a device.',
//         success: false,
//         status: 401,
//       });
//     }

//     request.session = session;

//     return true;
//   }
// }

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { UserSessionService } from '../../modules/user-session/user-session.service';
import { Role } from '../../modules/users/schemas/user.schema';

@Injectable()
export class DeviceSessionGuard implements CanActivate {
  constructor(private readonly userSessionService: UserSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException({
        message: 'User not authenticated',
        success: false,
        status: 401,
      });
    }

    if (user.role === Role.ADMIN) {
      return true;
    }

    const deviceId = request.headers['x-device-id'];

    if (!deviceId) {
      throw new UnauthorizedException({
        message: 'Device ID is required',
        success: false,
        status: 401,
      });
    }

    const userId = new Types.ObjectId(user.sub);

    // 1. Find the session for this specific user and device
    const session = await this.userSessionService.findByUserAndDevice(
      userId.toString(),
      deviceId,
    );

    // 2. Check if session exists AND is marked active
    if (!session || !session.isActive) {
      throw new UnauthorizedException({
        message:
          'Your session has expired or you have logged in on another device.',
        success: false,
        status: 401,
        action: 'LOGOUT_REQUIRED', // Helpful flag for frontend interceptors
      });
    }

    // 3. Optional extra safety check: Ensure no OTHER device has stolen the active status
    // (Useful if sessions can be toggled rapidly)

    request.session = session;
    return true;
  }
}
