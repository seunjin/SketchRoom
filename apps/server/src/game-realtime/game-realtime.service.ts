import { Injectable } from '@nestjs/common';
import type {
  GamePresenceParticipant,
  GamePresenceSnapshot,
  GameStartedEvent,
  Room,
} from '@sketch-room/shared';
import type { Server, Socket } from 'socket.io';

interface GamePresenceState extends GamePresenceParticipant {
  socketIds: Set<string>;
}

interface GameSocketData {
  guestId?: string;
  roomId?: string;
}

@Injectable()
export class GameRealtimeService {
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
    participant: GamePresenceParticipant,
  ) {
    const socketData = socket.data as GameSocketData;
    const roomChannel = this.getRoomChannelName(roomId);

    socketData.guestId = participant.guestId;
    socketData.roomId = roomId;
    void socket.join(roomChannel);

    const roomParticipants = this.getRoomParticipants(roomId);
    const currentParticipant = roomParticipants.get(participant.guestId);

    if (currentParticipant) {
      currentParticipant.socketIds.add(socket.id);
      currentParticipant.connectionCount = currentParticipant.socketIds.size;
    } else {
      roomParticipants.set(participant.guestId, {
        ...participant,
        connectionCount: 1,
        socketIds: new Set([socket.id]),
      });
    }

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
  ): GamePresenceParticipant {
    return {
      connectionCount: participant.socketIds.size,
      displayCode: participant.displayCode,
      guestId: participant.guestId,
      isHost: participant.isHost,
      nickname: participant.nickname,
    };
  }
}
