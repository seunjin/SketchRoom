import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  apiClient,
  getApiErrorResponse,
  type ApiResponse,
} from "../lib/api";

export const Route = createFileRoute("/")({
  component: HomePage,
});

interface HealthResponse {
  status: string;
}

function HomePage() {
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const response = await apiClient
        .get("health")
        .json<ApiResponse<HealthResponse>>();

      return response.data;
    },
  });

  const apiError = getApiErrorResponse(healthQuery.error);

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto flex max-w-5xl flex-col gap-3">
        <p className="text-sm font-medium text-primary">SketchRoom</p>
        <h1 className="text-3xl font-semibold">프론트 초기 설정 완료</h1>
        <p className="max-w-2xl text-muted-foreground">
          File-based routing과 TanStack Query provider가 연결되었습니다.
        </p>

        <div className="mt-6 max-w-md rounded-md border border-border bg-card p-4 text-sm text-card-foreground">
          <p className="font-medium">API 연결 상태</p>
          <p className="mt-2 text-muted-foreground">
            {healthQuery.isPending && "서버 상태를 확인하는 중입니다."}
            {healthQuery.isError &&
              (apiError?.message ?? "API 서버에 연결하지 못했습니다.")}
            {healthQuery.isSuccess &&
              `서버 응답: ${healthQuery.data?.status ?? "unknown"}`}
          </p>
        </div>
      </section>
    </main>
  );
}
