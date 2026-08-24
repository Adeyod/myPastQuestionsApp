import { Module } from '@nestjs/common';
import { SessionGateway } from './socket.gateway';

@Module({
  providers: [SessionGateway],
  exports: [SessionGateway],
})
export class SocketModule {}
