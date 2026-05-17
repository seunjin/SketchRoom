import type { Guest } from "./guest.js";

export interface RoomParticipant {
  id: string;
  roomId: string;
  guestId: string;
  isHost: boolean;
  isReady: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
  guest?: Guest;
}

export interface JoinRoomParticipantRequest {
  password?: string;
}

export interface UpdateRoomParticipantRequest {
  isReady: boolean;
}

export interface LeaveRoomParticipantResponse {
  success: boolean;
  deletedRoom: boolean;
}
