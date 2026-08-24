import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { SessionGateway } from '../socket/socket.gateway';
import { Role } from '../users/schemas/user.schema';
import { CreateSessionDto } from './dtos/create-session.dto';
import { ForceSwitchDto } from './dtos/force-switch.dto';
import { UserSessionRepository } from './repositories/user-session.repository';
import { UserSessionDocument } from './schemas/user-session.schema';

@Injectable()
export class UserSessionService {
  constructor(
    private readonly sessionGateway: SessionGateway,
    private readonly repo: UserSessionRepository,
  ) {}

  async findActiveSession(userId: string) {
    const response = await this.repo.findActiveSession(
      new Types.ObjectId(userId),
    );

    return response;
  }
  async findByUserAndDevice(userId: string, deviceId: string) {
    const id = new Types.ObjectId(userId);

    const response = await this.repo.findByUserAndDevice(id, deviceId);

    return response;
  }

  async createSession(dto: CreateSessionDto) {
    const payload = {
      userId: new Types.ObjectId(dto.userId),
      deviceId: dto.deviceId,
      deviceName: dto.deviceName,
    };

    const response = await this.repo.createSession({
      ...payload,
      isActive: true,
      lastActiveAt: new Date(),
    });

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to create new session.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  async updateSession(sessionId: string) {
    const response = await this.repo.updateSession(sessionId, {
      lastActiveAt: new Date(),
    });

    return response;
  }

  // async handleLogin(dto: CreateSessionDto) {
  //   console.log('dto:', dto);
  //   const payload = {
  //     userId: new Types.ObjectId(dto.userId),
  //     deviceId: dto.deviceId,
  //     deviceName: dto.deviceName,
  //   };

  //   const activeSession = await this.repo.findByUserAndDevice(
  //     payload.userId,
  //     payload.deviceId,
  //   );
  //   console.log('activeSession:', activeSession);

  //   if (dto.role === Role.ADMIN) {
  //     return this.repo.createSession({
  //       ...payload,
  //       isActive: true,
  //       lastActiveAt: new Date(),
  //     });
  //   }

  //   // No active session
  //   if (!activeSession) {
  //     return this.repo.createSession({
  //       ...payload,
  //       isActive: true,
  //       lastActiveAt: new Date(),
  //     });
  //   }

  //   // Same device
  //   if (activeSession.deviceId === dto.deviceId) {
  //     const response = await this.repo.updateSession(
  //       activeSession._id.toString(),
  //       {
  //         lastActiveAt: new Date(),
  //       },
  //     );
  //     console.log('response:', response);

  //     return response;
  //   }

  //   // Different device
  //   throw new ConflictException({
  //     message: 'You are logged in on another device',
  //     action: 'FORCE_SWITCH_REQUIRED',
  //     currentDevice: activeSession.deviceName, // nice UX addition
  //   });
  // }
  async handleLogin(dto: CreateSessionDto): Promise<UserSessionDocument> {
    console.log('dto:', dto);
    const payload = {
      userId: new Types.ObjectId(dto.userId),
      deviceId: dto.deviceId,
      deviceName: dto.deviceName,
    };

    const existingSession = await this.repo.findByUserAndDevice(
      payload.userId,
      payload.deviceId,
    );
    console.log('existingSession:', existingSession);

    if (dto.role === Role.ADMIN) {
      if (existingSession) {
        return await this.repo.updateSession(existingSession._id.toString(), {
          lastActiveAt: new Date(),
          isActive: true,
        });
      }

      return await this.repo.createSession({
        ...payload,
        isActive: true,
        lastActiveAt: new Date(),
      });
    }

    const activeSessions = await this.repo.findActiveSessionsExcludingDevice(
      payload.userId,
      payload.deviceId,
    );

    // No active session
    if (activeSessions && activeSessions.length > 0) {
      throw new ConflictException({
        message: 'You are logged in on another device',
        action: 'FORCE_SWITCH_REQUIRED',
        currentDevice: activeSessions[0].deviceName,
      });
    }

    if (existingSession) {
      return await this.repo.updateSession(existingSession._id.toString(), {
        lastActiveAt: new Date(),
        isActive: true,
      });
    }

    return await this.repo.createSession({
      ...payload,
      isActive: true,
      lastActiveAt: new Date(),
    });
  }

  async forceSwitch(dto: ForceSwitchDto) {
    const payload = {
      userId: new Types.ObjectId(dto.userId),
      deviceId: dto.deviceId,
      deviceName: dto.deviceName,
    };

    // Deactivate all sessions
    await this.repo.deactivateSessions(payload.userId);

    this.sessionGateway.notifySessionTerminated(dto.userId);

    // Create new session
    return await this.repo.createSession({
      ...payload,
      isActive: true,
      lastActiveAt: new Date(),
      lastSwitchAt: new Date(),
    });
  }
}
