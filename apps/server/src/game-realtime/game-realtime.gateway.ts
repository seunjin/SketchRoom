import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { InjectRepository } from '@nestjs/typeorm';
import type { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { RoomParticipant } from '../room-participant/entity/room-participant.entity';
import { GameRealtimeService } from './game-realtime.service';

interface JoinGameRoomPayload {
  guestId: string;
  roomId: string;
}

interface GameRealtimeErrorPayload {
  code: string;
  message: string;
}

function getWebOrigins() {
  return (process.env.WEB_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

// Gateway는 WebSocket 이벤트의 Controller 역할입니다.
// 클라이언트 이벤트를 받고, DB 검증 후 service에 실시간 처리를 맡깁니다.
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
    // REST service에서도 broadcast해야 하므로 Socket.IO server를 공유합니다.
    this.gameRealtimeService.setServer(server);
  }

  handleConnection(client: Socket) {
    // 연결 직후에는 아직 roomId/guestId를 모르므로 여기서는 확인 신호만 보냅니다.
    client.emit('game:connected');
  }

  handleDisconnect(client: Socket) {
    // socket.data에 저장해둔 roomId/guestId를 기준으로 presence에서 제거합니다.
    this.gameRealtimeService.leaveSocket(client);
  }

  @SubscribeMessage('game:join')
  async handleJoinGameRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ) {
    if (!this.isJoinGameRoomRequest(payload)) {
      this.emitError(client, {
        code: 'GAME_JOIN_PAYLOAD_INVALID',
        message: '게임 연결 정보가 올바르지 않습니다.',
      });
      return;
    }

    const { guestId, roomId } = payload;

    // WebSocket 연결은 외부에서 바로 시도할 수 있으니,
    // join 시점에 DB로 실제 방 참가자인지 확인합니다.
    const participant = await this.roomParticipantRepository.findOne({
      where: {
        guestId,
        roomId,
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

    // 검증된 참가자만 Socket.IO room에 넣고 presence를 갱신합니다.
    this.gameRealtimeService.joinRoom(client, roomId, {
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

  private emitError(client: Socket, error: GameRealtimeErrorPayload) {
    client.emit('game:error', error);
  }

  private isJoinGameRoomRequest(
    payload: unknown,
  ): payload is JoinGameRoomPayload {
    // socket payload는 외부 입력이라 unknown으로 좁혀야 lint/type 에러를 피할 수 있습니다.
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
