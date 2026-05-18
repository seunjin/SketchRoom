import { Injectable } from '@nestjs/common';
import type {
  GamePresenceSnapshot,
  GameStartedEvent,
} from '@sketch-room/shared/game-realtime';
import type { Room } from '@sketch-room/shared/room';
import type { Server, Socket } from 'socket.io';

interface GamePresenceParticipantState {
  connectionCount: number;
  displayCode: string;
  guestId: string;
  isHost: boolean;
  nickname: string;
}

interface GamePresenceState extends GamePresenceParticipantState {
  socketIds: Set<string>;
}

interface GameSocketData {
  guestId?: string;
  roomId?: string;
}

@Injectable()
export class GameRealtimeService {
  // roomId -> guestId -> presence 상태입니다.
  // 한 사용자가 여러 탭으로 접속할 수 있어 socketIds를 Set으로 보관합니다.
  private readonly participantsByRoom = new Map<
    string,
    Map<string, GamePresenceState>
  >();
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  joinRoom(
    socket: Socket,
    roomId: string,
    participant: GamePresenceParticipantState,
  ) {
    const socketData = socket.data as GameSocketData;
    const roomChannel = this.getRoomChannelName(roomId);

    // disconnect 때 어떤 방/참가자였는지 찾기 위해 socket에 최소 정보만 저장합니다.
    socketData.guestId = participant.guestId;
    socketData.roomId = roomId;

    // Socket.IO room은 broadcast 범위입니다. 같은 roomChannel의 socket만 이벤트를 받습니다.
    void socket.join(roomChannel);

    const roomParticipants = this.getRoomParticipants(roomId);
    const currentParticipant = roomParticipants.get(participant.guestId);

    if (currentParticipant) {
      // 같은 guest가 새 탭으로 접속하면 사람 수는 늘리지 않고 연결 수만 늘립니다.
      currentParticipant.socketIds.add(socket.id);
      currentParticipant.connectionCount = currentParticipant.socketIds.size;
    } else {
      roomParticipants.set(participant.guestId, {
        ...participant,
        connectionCount: 1,
        socketIds: new Set([socket.id]),
      });
    }

    // 개별 join 이벤트도 보내지만, UI는 아래 전체 snapshot만 봐도 동작합니다.
    this.server?.to(roomChannel).emit('game:joined', {
      participant: this.toPresenceParticipant(
        roomParticipants.get(participant.guestId)!,
      ),
      roomId,
    });
    this.broadcastPresence(roomId);
  }

  leaveSocket(socket: Socket) {
    const socketData = socket.data as GameSocketData;
    const { guestId, roomId } = socketData;

    if (!guestId || !roomId) {
      return;
    }

    const roomParticipants = this.participantsByRoom.get(roomId);
    const participant = roomParticipants?.get(guestId);

    if (!roomParticipants || !participant) {
      return;
    }

    participant.socketIds.delete(socket.id);
    participant.connectionCount = participant.socketIds.size;

    // 한 guest의 마지막 socket이 끊긴 경우에만 오프라인으로 처리합니다.
    if (participant.socketIds.size === 0) {
      roomParticipants.delete(guestId);
      this.server?.to(this.getRoomChannelName(roomId)).emit('game:left', {
        guestId,
        roomId,
      });
    }

    if (roomParticipants.size === 0) {
      this.participantsByRoom.delete(roomId);
    }

    this.broadcastPresence(roomId);

    // leave와 disconnect가 중복 호출되어도 다시 처리되지 않게 비웁니다.
    delete socketData.guestId;
    delete socketData.roomId;
  }

  broadcastGameStarted(roomId: string, startedByGuestId: string, room: Room) {
    const event: GameStartedEvent = {
      room,
      roomId,
      startedByGuestId,
    };

    this.server
      ?.to(this.getRoomChannelName(roomId))
      .emit('game:started', event);
  }

  private broadcastPresence(roomId: string) {
    const snapshot = this.getPresenceSnapshot(roomId);

    // presence는 diff가 아니라 전체 스냅샷으로 보냅니다.
    // 클라이언트는 받은 값으로 교체만 하면 됩니다.
    this.server
      ?.to(this.getRoomChannelName(roomId))
      .emit('game:presence', snapshot);
  }

  private getPresenceSnapshot(roomId: string): GamePresenceSnapshot {
    const participants = Array.from(
      this.participantsByRoom.get(roomId)?.values() ?? [],
    )
      .map((participant) => this.toPresenceParticipant(participant))
      .sort((a, b) => {
        if (a.isHost !== b.isHost) {
          return Number(b.isHost) - Number(a.isHost);
        }

        return a.nickname.localeCompare(b.nickname);
      });

    return {
      participants,
      roomId,
    };
  }

  private getRoomParticipants(roomId: string) {
    const roomParticipants = this.participantsByRoom.get(roomId);

    if (roomParticipants) {
      return roomParticipants;
    }

    const nextRoomParticipants = new Map<string, GamePresenceState>();

    this.participantsByRoom.set(roomId, nextRoomParticipants);

    return nextRoomParticipants;
  }

  private getRoomChannelName(roomId: string) {
    return `game:${roomId}`;
  }

  private toPresenceParticipant(
    participant: GamePresenceState,
  ): GamePresenceParticipantState {
    return {
      connectionCount: participant.socketIds.size,
      displayCode: participant.displayCode,
      guestId: participant.guestId,
      isHost: participant.isHost,
      nickname: participant.nickname,
    };
  }
}
