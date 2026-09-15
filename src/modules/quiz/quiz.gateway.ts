import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { QuizService } from './quiz.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/quiz',
})
export class QuizGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly quizService: QuizService) {}

  handleConnection(client: Socket) {
    console.log(`Socket Client Connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Socket Client Disconnected: ${client.id}`);
  }

  // Admin & Participants join the Socket.io room channel
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() data: { quizId: string; roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;

    // Join the isolated Socket.io channel for this quiz room
    await client.join(data.roomId);

    // Notify room members (Admin dashboard & participants) who joined
    this.server.to(data.roomId).emit('participant_joined_room', {
      userId: user.sub,
      socketId: client.id,
      timestamp: new Date(),
    });

    return {
      event: 'joined_room_ack',
      data: {
        roomId: data.roomId,
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
}
