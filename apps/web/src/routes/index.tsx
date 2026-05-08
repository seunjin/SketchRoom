import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

export function HomePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto flex max-w-5xl flex-col gap-3">
        <p className="text-sm font-medium text-primary">SketchRoom</p>
        <h1 className="text-3xl font-semibold">프론트 초기 설정 완료</h1>
        <p className="max-w-2xl text-muted-foreground">
          File-based routing과 TanStack Query provider가 연결되었습니다.
        </p>
      </section>
    </main>
  );
}
