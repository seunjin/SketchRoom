import { apiClient, type ApiResponse } from "../../shared/api";
import type {
  JoinRoomParticipantRequest,
  LeaveRoomParticipantResponse,
  RoomParticipant,
} from "./room-participant.types";

export async function getRoomParticipants(roomId: string) {
  const response = await apiClient
    .get(`rooms/${roomId}/participants`)
    .json<ApiResponse<RoomParticipant[]>>();

  return response.data;
}

export async function joinRoom(
  roomId: string,
  request: JoinRoomParticipantRequest,
  guestId: string,
) {
  const response = await apiClient
    .post(`rooms/${roomId}/participants`, {
      headers: {
        "x-guest-id": guestId,
      },
      json: request,
    })
    .json<ApiResponse<RoomParticipant>>();

  return response.data;
}

export async function leaveRoom(roomId: string, guestId: string) {
  const response = await apiClient
    .delete(`rooms/${roomId}/participants/me`, {
      headers: {
        "x-guest-id": guestId,
      },
    })
    .json<ApiResponse<LeaveRoomParticipantResponse>>();

  return response.data;
}
