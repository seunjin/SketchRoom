import type { Room } from "./room.js";

export type GameConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface JoinGameRoomRequest {
  guestId: string;
  roomId: string;
}

export interface GamePresenceParticipant {
  connectionCount: number;
  displayCode: string;
  guestId: string;
  isHost: boolean;
  nickname: string;
}

export interface GamePresenceSnapshot {
  participants: GamePresenceParticipant[];
  roomId: string;
}

export interface GamePresenceChangedEvent {
  participant: GamePresenceParticipant;
  roomId: string;
}

export interface GamePresenceLeftEvent {
  guestId: string;
  roomId: string;
}

export interface GameStartedEvent {
  room: Room;
  roomId: string;
  startedByGuestId: string;
}

export interface GameRealtimeErrorEvent {
  code: string;
  message: string;
}
