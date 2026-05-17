import type { Guest } from "./guest.js";

export interface RoomParticipant {
  id: string;
  roomId: string;
  guestId: string;
  isHost: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
  guest?: Guest;
}

export interface JoinRoomParticipantRequest {
  password?: string;
}

export interface LeaveRoomParticipantResponse {
  success: boolean;
  deletedRoom: boolean;
}
