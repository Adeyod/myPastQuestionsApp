import { UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtUser } from '../../common/types/jwt-user.type';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { Role } from '../users/schemas/user.schema';
import { QuizService } from './quiz.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/quiz',
})
export class QuizGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly quizService: QuizService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    server.use((socket, next) => {
      try {
        const token = this.extractToken(socket);

        if (!token) {
          return next(new Error('Authentication token missing.'));
        }

        const secret = this.configService.get<string>('JWT_SECRET');

        if (!secret) {
          return next(new Error('JWT configuration is missing.'));
        }

        const user = this.jwtService.verify<JwtUser>(token, {
          secret,
        });

        if (!user?.sub) {
          return next(new Error('Invalid authentication token.'));
        }

        // Attach authenticated user to socket
        socket.data.user = user;

        next();
      } catch (error) {
        console.error('Socket authentication failed:', error);

        next(new Error('Invalid or expired authentication token.'));
      }
    });
  }

  handleConnection(client: Socket) {
    const user = client.data.user;

    console.log(`Authenticated socket connected: ${client.id}`, user?.sub);

    console.log(`Socket Client Connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Socket Client Disconnected: ${client.id}`);

    const user: JwtUser = client.data.user;

    if (!user?.sub) {
      return;
    }

    try {
      await this.quizService.markParticipantDisconnected(
        user.sub.toString(),
        client.id,
      );
    } catch (error) {
      console.error('Unable to update participant disconnect state:', error);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('activate_room')
  async handleActivateRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;

    // Verify user is an admin
    if (user.role !== Role.ADMIN) {
      throw new WsException('Only administrators can activate a quiz room.');
    }

    const room = await this.quizService.activateRoom(data.roomId, user.sub);

    // Put admin into the Socket.IO room
    await client.join(room.roomId);

    // Get the latest state
    const roomState = await this.quizService.getRoomState(room.roomId);

    client.emit('room_state', roomState);

    // Tell everyone currently connected to this room
    this.server.to(room.roomId).emit('room_activated', {
      room: roomState,
      activatedBy: user.sub,
      timestamp: new Date(),
    });

    return {
      event: 'room_activation_ack',
      data: {
        roomId: room.roomId,
        status: room.status,
        message: 'Quiz room activated successfully.',
      },
    };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;

    if (!user?.sub) {
      throw new WsException('Authenticated user not found.');
    }

    // 1. Validate that the user is allowed to join this room
    const room = await this.quizService.validateParticipantCanJoinRoom(
      data.roomId,
      user.sub,
    );

    // 2. Join the Socket.IO room
    await client.join(room.roomId);

    // 3. Register/update this participant's socket connection
    await this.quizService.registerParticipantSocket(
      room.quizId.toString(),
      user.sub,
      client.id,
    );

    // 4. Get the current persistent state of the quiz room
    const roomState = await this.quizService.getRoomState(room.roomId);

    // 5. Send the current state ONLY to this newly connected socket
    client.emit('room_state', roomState);

    // 6. Notify everyone else/current participants that someone joined
    this.server.to(room.roomId).emit('participant_joined_room', {
      userId: user.sub,
      timestamp: new Date(),
    });

    // 7. Acknowledge the join request
    return {
      event: 'joined_room_ack',
      data: {
        roomId: room.roomId,
        message: 'Successfully connected to quiz room.',
      },
    };
  }

  // Admin triggers Round 1 (or next round) questions fetch and broadcast
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('start_round')
  async handleStartRound(
    @MessageBody()
    data: {
      quizId: string;
      roomId: string;
      roundNumber: number;
    },
  ) {
    const questions = await this.quizService.getRoundQuestions(
      data.quizId,
      data.roundNumber,
    );

    // Emit questions directly to all clients in the room
    this.server.to(data.roomId).emit('round_started', {
      roundNumber: data.roundNumber,
      questions,
    });
  }

  // Sync leaderboard calculated by frontend
  @SubscribeMessage('sync_leaderboard')
  handleSyncLeaderboard(
    @MessageBody() data: { roomId: string; leaderboard: any },
  ) {
    this.server.to(data.roomId).emit('leaderboard_updated', data.leaderboard);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('request_tiebreaker_question')
  async handleRequestTiebreakerQuestion(
    @MessageBody()
    data: {
      quizId: string;
      roomId: string;
      tiedUserIds: string[]; // User IDs involved in the tie
    },
    @ConnectedSocket() client: Socket,
  ) {
    // Service fetches 1 extra question for the quiz subject
    const tiebreakerQuestion = await this.quizService.getTiebreakerQuestion(
      data.quizId,
    );

    // Broadcast tie-breaker payload to the whole room,
    // but include targetUserIds so frontend clients filter visibility
    this.server.to(data.roomId).emit('tiebreaker_question_started', {
      quizId: data.quizId,
      tiedUserIds: data.tiedUserIds,
      question: tiebreakerQuestion,
      timestamp: new Date(),
    });

    return { success: true, message: 'Tie-breaker question dispatched.' };
  }

  /**
   * 2. Admin finalizes tie-breaker (via Voting OR Tie Question results)
   * Prunes eliminated user IDs from joined_users -> spectator_array in DB and syncs room.
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('resolve_tiebreaker_eliminations')
  async handleResolveTiebreakerEliminations(
    @MessageBody()
    data: {
      quizId: string;
      roomId: string;
      roundNumber: number;
      eliminatedUserIds: string[]; // IDs selected by admin for removal
    },
  ) {
    // 1. Database mutation: move IDs from joined_users to spectator_array
    await this.quizService.pruneEliminatedUsers(
      data.quizId,
      data.eliminatedUserIds,
      data.roundNumber,
    );

    // 2. Broadcast updated elimination list to all room participants
    this.server.to(data.roomId).emit('participants_eliminated', {
      eliminatedUserIds: data.eliminatedUserIds,
      timestamp: new Date(),
    });

    return {
      success: true,
      message: 'Eliminated participants successfully moved to spectators.',
    };
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;

    if (typeof authToken === 'string' && authToken.trim().length > 0) {
      return this.removeBearerPrefix(authToken);
    }

    const authorization = client.handshake.headers?.authorization;

    if (typeof authorization === 'string') {
      return this.removeBearerPrefix(authorization);
    }

    return null;
  }

  private removeBearerPrefix(token: string): string {
    return token.startsWith('Bearer ')
      ? token.substring(7).trim()
      : token.trim();
  }
}
