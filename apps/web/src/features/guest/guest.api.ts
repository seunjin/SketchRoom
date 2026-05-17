import { apiClient, type ApiResponse } from "../../shared/api";
import type {
  CreateGuestRequest,
  Guest,
  UpdateGuestRequest,
} from "./guest.types";

export async function createGuest(request: CreateGuestRequest) {
  const response = await apiClient
    .post("guest", {
      json: request,
    })
    .json<ApiResponse<Guest>>();

  return response.data;
}

export async function getGuest(guestId: string) {
  const response = await apiClient
    .get(`guest/${guestId}`)
    .json<ApiResponse<Guest>>();

  return response.data;
}

export async function updateGuest(
  guestId: string,
  request: UpdateGuestRequest,
) {
  const response = await apiClient
    .patch(`guest/${guestId}`, {
      json: request,
    })
    .json<ApiResponse<Guest>>();

  return response.data;
}
