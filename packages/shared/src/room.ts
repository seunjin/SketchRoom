export type RoomStatus = "WAITING" | "PLAYING" | "CLOSED";

export interface Room {
  id: string;
  title: string;
  isPublic: boolean;
  status: RoomStatus;
  hostGuestId: string;
  hostNickname: string;
  maxParticipants: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateRoomRequest {
  title: string;
  isPublic?: boolean;
  password?: string;
}

export interface UpdateRoomRequest {
  title?: string;
  isPublic?: boolean;
  password?: string;
}
