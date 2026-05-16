import { apiClient, type ApiResponse } from "../../shared/api";
import type {
  CreateRoomRequest,
  Room,
  UpdateRoomRequest,
} from "./room.types";

export async function getRooms() {
  const response = await apiClient.get("rooms").json<ApiResponse<Room[]>>();

  return response.data;
}

export async function getRoom(roomId: string) {
  const response = await apiClient
    .get(`rooms/${roomId}`)
    .json<ApiResponse<Room>>();

  return response.data;
}

export async function createRoom(
  request: CreateRoomRequest,
  guestId: string,
) {
  const response = await apiClient
    .post("rooms", {
      headers: {
        "x-guest-id": guestId,
      },
      json: request,
    })
    .json<ApiResponse<Room>>();

  return response.data;
}

export async function updateRoom(
  roomId: string,
  request: UpdateRoomRequest,
  guestId: string,
) {
  const response = await apiClient
    .patch(`rooms/${roomId}`, {
      headers: {
        "x-guest-id": guestId,
      },
      json: request,
    })
    .json<ApiResponse<Room>>();

  return response.data;
}
