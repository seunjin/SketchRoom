import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Brush,
  CircleCheck,
  Crown,
  Loader2,
  Sparkles,
} from "lucide-react";
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

const playerCards = [
  { name: "Mango", color: "bg-primary", accent: "bg-danger" },
  { name: "Mint", color: "bg-accent", accent: "bg-primary" },
  { name: "Berry", color: "bg-room-private", accent: "bg-accent" },
  { name: "Toast", color: "bg-room-playing", accent: "bg-room-private" },
] as const;

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
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="flex flex-col gap-5">
          <LogoMark />

          <div className="max-w-3xl">
            <h1 className="text-5xl font-black leading-[0.98] tracking-normal text-foreground sm:text-6xl lg:text-7xl">
              SketchRoom
              <span className="block text-primary">Party Lobby</span>
            </h1>
          </div>

          <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
            {playerCards.map((card, index) => (
              <PlayerCardPreview
                accent={card.accent}
                color={card.color}
                index={index}
                key={card.name}
                name={card.name}
              />
            ))}
          </div>
        </div>

        <aside className="rounded-md border-2 border-border bg-surface p-4 shadow-[0_8px_0_rgba(39,52,60,0.22)]">
          <div className="mb-4 grid grid-cols-[64px_minmax(0,1fr)] gap-3">
            <PlayerAvatar accent="bg-danger" color="bg-primary" label="YOU" />
            <div className="min-w-0 rounded-md border border-border bg-background p-3">
              <p className="text-xs font-black text-primary">PLAYER CARD</p>
              <h2 className="mt-1 truncate text-2xl font-black">
                {guestQuery.isSuccess ? guestQuery.data.nickname : "Guest"}
              </h2>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                {guestQuery.isSuccess ? guestQuery.data.displayCode : "READY?"}
              </p>
            </div>
          </div>

          <form className="flex flex-col gap-3" onSubmit={handleCreateGuest}>
            <label className="flex flex-col gap-2 text-sm font-black" htmlFor="nickname">
              닉네임
              <input
                className="h-12 rounded-md border-2 border-border bg-background px-4 text-base font-bold text-foreground outline-none transition focus:border-primary"
                id="nickname"
                maxLength={30}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="플레이어 이름"
                type="text"
                value={nickname}
              />
            </label>

            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-black text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isNicknameEmpty || createGuestMutation.isPending}
              type="submit"
            >
              {createGuestMutation.isPending ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <CircleCheck aria-hidden="true" className="size-4" />
              )}
              게스트 생성
            </button>
          </form>

          <div className="mt-4 rounded-md border border-border bg-background p-3 text-sm font-semibold text-muted-foreground">
            {!currentGuestId && "빈 플레이어 슬롯"}
            {currentGuestId && guestQuery.isPending && "카드 확인 중"}
            {currentGuestId &&
              guestQuery.isError &&
              (guestQueryError?.message ?? "게스트 확인 실패")}
            {guestQuery.isSuccess && "입장 준비 완료"}
          </div>

          <p className="mt-3 min-h-5 text-sm font-semibold text-danger">
            {createGuestMutation.isError &&
              (createGuestError?.message ?? "게스트를 생성하지 못했습니다.")}
          </p>

          {guestQuery.isSuccess && (
            <Link
              className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-black text-accent-foreground transition"
              to="/rooms"
            >
              대기방 입장
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          )}
        </aside>
      </section>
    </main>
  );
}

function LogoMark() {
  return (
    <div className="inline-flex w-fit items-center gap-2 rounded-md border-2 border-border bg-surface px-3 py-2 text-sm font-black text-primary shadow-[0_4px_0_rgba(39,52,60,0.18)]">
      <Sparkles aria-hidden="true" className="size-4" />
      DRAW PARTY
    </div>
  );
}

function PlayerCardPreview({
  accent,
  color,
  index,
  name,
}: {
  accent: string;
  color: string;
  index: number;
  name: string;
}) {
  return (
    <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-md border-2 border-border bg-surface p-3 shadow-[0_6px_0_rgba(39,52,60,0.18)]">
      <PlayerAvatar accent={accent} color={color} label={`${index + 1}`} />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {index === 0 && <Crown aria-hidden="true" className="size-4 text-primary" />}
          <p className="truncate text-lg font-black">{name}</p>
        </div>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          Player slot
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
          <div className={`h-full rounded-full ${accent}`} style={{ width: `${55 + index * 10}%` }} />
        </div>
      </div>
    </div>
  );
}

function PlayerAvatar({
  accent,
  color,
  label,
}: {
  accent: string;
  color: string;
  label: string;
}) {
  return (
    <div className={`relative grid aspect-square place-items-center rounded-md border-2 border-border ${color}`}>
      <div className="relative size-9 rounded-md border-2 border-border bg-surface">
        <div className="absolute left-1/2 top-2.5 flex -translate-x-1/2 gap-1">
          <span className="size-1.5 rounded-full bg-foreground" />
          <span className="size-1.5 rounded-full bg-foreground" />
        </div>
        <div className={`absolute bottom-2 left-1/2 h-1.5 w-4 -translate-x-1/2 rounded-full ${accent}`} />
      </div>
      <span className="absolute right-2 top-2 rounded bg-background px-1.5 py-0.5 text-[10px] font-black text-foreground">
        {label}
      </span>
      <Brush aria-hidden="true" className="absolute bottom-2 left-2 size-4 text-surface" />
    </div>
  );
}
