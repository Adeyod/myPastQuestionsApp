import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class SessionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private userSockets = new Map<string, string>();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    console.log('userId:', userId);

    if (userId) {
      this.userSockets.set(userId, client.id);
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }

    const time = new Date().toISOString();
    console.log(`Disconnected at ${time}`);
  }

  notifySessionTerminated(userId: string) {
    console.log('Looking for socket for userId:', userId);
    console.log(
      'Current active sockets map:',
      Array.from(this.userSockets.entries()),
    );

    const socketId = this.userSockets.get(userId);

    if (socketId) {
      console.log(`Found socket ${socketId}, emitting force_logout...`);
      this.server.to(socketId).emit('force_logout');
    } else {
      console.log('❌ No active socket found for this userId!');
    }
  }
}
