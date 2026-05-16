import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_guest/rooms")({
  component: RoomsPage,
});

function RoomsPage() {
  const { guestId } = Route.useRouteContext();

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto flex max-w-5xl flex-col gap-3">
        <p className="text-sm font-medium text-primary">SketchRoom</p>
        <h1 className="text-3xl font-semibold">방 목록</h1>
        <p className="max-w-2xl text-muted-foreground">
          게스트 인증이 필요한 화면입니다.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          현재 게스트 ID: {guestId}
        </p>
      </section>
    </main>
  );
}
