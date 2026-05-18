import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type {
  GameRealtimeErrorEvent,
  JoinGameRoomRequest,
} from '@sketch-room/shared';
import { InjectRepository } from '@nestjs/typeorm';
import type { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { RoomParticipant } from '../room-participant/entity/room-participant.entity';
import { GameRealtimeService } from './game-realtime.service';

function getWebOrigins() {
  return (process.env.WEB_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

@WebSocketGateway({
  cors: {
    credentials: true,
    origin: getWebOrigins(),
  },
})
export class GameRealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @InjectRepository(RoomParticipant)
    private readonly roomParticipantRepository: Repository<RoomParticipant>,
    private readonly gameRealtimeService: GameRealtimeService,
  ) {}

  afterInit(server: Server) {
    this.gameRealtimeService.setServer(server);
  }

  handleConnection(client: Socket) {
    client.emit('game:connected');
  }

  handleDisconnect(client: Socket) {
    this.gameRealtimeService.leaveSocket(client);
  }

  @SubscribeMessage('game:join')
  async handleJoinGameRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinGameRoomRequest,
  ) {
    if (!this.isJoinGameRoomRequest(payload)) {
      this.emitError(client, {
        code: 'GAME_JOIN_PAYLOAD_INVALID',
        message: '게임 연결 정보가 올바르지 않습니다.',
      });
      return;
    }

    const participant = await this.roomParticipantRepository.findOne({
      where: {
        guestId: payload.guestId,
        roomId: payload.roomId,
      },
      relations: {
        guest: true,
      },
    });

    if (!participant) {
      this.emitError(client, {
        code: 'ROOM_PARTICIPANT_NOT_FOUND',
        message: '방 참가자만 게임에 연결할 수 있습니다.',
      });
      client.disconnect(true);
      return;
    }

    this.gameRealtimeService.joinRoom(client, payload.roomId, {
      connectionCount: 1,
      displayCode: participant.guest.displayCode,
      guestId: participant.guestId,
      isHost: participant.isHost,
      nickname: participant.guest.nickname,
    });
  }

  @SubscribeMessage('game:leave')
  handleLeaveGameRoom(@ConnectedSocket() client: Socket) {
    this.gameRealtimeService.leaveSocket(client);
  }

  private emitError(client: Socket, error: GameRealtimeErrorEvent) {
    client.emit('game:error', error);
  }

  private isJoinGameRoomRequest(
    payload: unknown,
  ): payload is JoinGameRoomRequest {
    if (typeof payload !== 'object' || payload === null) {
      return false;
    }

    const { guestId, roomId } = payload as Record<string, unknown>;

    return (
      typeof guestId === 'string' &&
      guestId.length > 0 &&
      typeof roomId === 'string' &&
      roomId.length > 0
    );
  }
}
