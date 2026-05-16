import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  createGuest,
  getGuest,
  guestKeys,
  useGuestSession,
} from "../features/guest";
import { getApiErrorResponse } from "../shared/api";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [nickname, setNickname] = useState("");
  const {
    guestId: currentGuestId,
    setGuestId,
    clearGuestId,
  } = useGuestSession();

  const guestQuery = useQuery({
    queryKey: currentGuestId
      ? guestKeys.detail(currentGuestId)
      : guestKeys.details(),
    queryFn: () => getGuest(currentGuestId!),
    enabled: Boolean(currentGuestId),
    retry: false,
  });

  const createGuestMutation = useMutation({
    mutationFn: createGuest,
    onSuccess: (guest) => {
      setGuestId(guest.id);
      setNickname("");
    },
  });

  const guestQueryError = getApiErrorResponse(guestQuery.error);
  const createGuestError = getApiErrorResponse(createGuestMutation.error);
  const trimmedNickname = nickname.trim();
  const isNicknameEmpty = trimmedNickname.length === 0;

  useEffect(() => {
    if (guestQueryError?.code !== "GUEST_NOT_FOUND") {
      return;
    }

    clearGuestId();
  }, [clearGuestId, guestQueryError?.code]);

  function handleCreateGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isNicknameEmpty || createGuestMutation.isPending) {
      return;
    }

    createGuestMutation.mutate({
      nickname: trimmedNickname,
    });
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-primary">SketchRoom</p>
          <h1 className="text-3xl font-semibold">게스트로 시작하기</h1>
          <p className="max-w-2xl text-muted-foreground">
            닉네임을 만들면 이 브라우저에 게스트 정보가 저장됩니다.
          </p>
        </div>

        <form
          className="flex max-w-md flex-col gap-3 rounded-md border border-border bg-surface p-4"
          onSubmit={handleCreateGuest}
        >
          <label className="text-sm font-medium" htmlFor="nickname">
            닉네임
          </label>
          <input
            className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            id="nickname"
            maxLength={30}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="사용할 닉네임을 입력하세요"
            type="text"
            value={nickname}
          />
          <button
            className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isNicknameEmpty || createGuestMutation.isPending}
            type="submit"
          >
            {createGuestMutation.isPending ? "생성 중" : "게스트 생성"}
          </button>
        </form>

        <div className="max-w-md rounded-md border border-border bg-surface p-4 text-sm">
          <p className="font-medium">게스트 상태</p>
          <p className="mt-2 text-muted-foreground">
            {!currentGuestId && "아직 저장된 게스트가 없습니다."}
            {currentGuestId &&
              guestQuery.isPending &&
              "저장된 게스트 정보를 확인하는 중입니다."}
            {currentGuestId &&
              guestQuery.isError &&
              (guestQueryError?.message ??
                "게스트 정보를 확인하지 못했습니다.")}
            {guestQuery.isSuccess &&
              `입장 준비 완료: ${guestQuery.data.nickname} (${guestQuery.data.displayCode})`}
          </p>
        </div>

        <p className="min-h-5 text-sm text-danger">
          {createGuestMutation.isError &&
            (createGuestError?.message ?? "게스트를 생성하지 못했습니다.")}
        </p>

        {guestQuery.isSuccess && (
          <Link
            className="inline-flex h-11 w-fit items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground"
            to="/rooms"
          >
            방 목록으로 이동
          </Link>
        )}
      </section>
    </main>
  );
}
