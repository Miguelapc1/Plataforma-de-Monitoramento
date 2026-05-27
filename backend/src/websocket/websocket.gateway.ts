import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*', credentials: true }, namespace: '/ws' })
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
    if (!token) { client.disconnect(); return; }
    try { this.jwtService.verify(token); } catch { client.disconnect(); }
  }

  handleDisconnect(client: Socket) {
    this.logger.log('WS disconnected: ' + client.id);
  }

  emitMonitorUpdate(data: any) { this.server.emit('monitor:update', data); }
  emitIncidentCreated(data: any) { this.server.emit('incident:created', data); }
  emitIncidentResolved(data: any) { this.server.emit('incident:resolved', data); }
}
