import { apiClient, type ApiResponse } from "../../shared/api";
import type { HealthResponse } from "./health.types";

export async function getHealth() {
  const response = await apiClient
    .get("health")
    .json<ApiResponse<HealthResponse>>();

  return response.data;
}
