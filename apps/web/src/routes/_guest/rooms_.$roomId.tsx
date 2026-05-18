import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "@woon-ui/toast";
import {
  ArrowLeft,
  Brush,
  Check,
  Copy,
  Crown,
  Loader2,
  Lock,
  LogOut,
  Play,
  RefreshCw,
  Users,
} from "lucide-react";
import { getGuest, guestKeys } from "../../features/guest";
import {
  getRoom,
  getRoomParticipants,
  leaveRoom,
  roomKeys,
  roomParticipantKeys,
  startRoomGame,
  updateRoomParticipant,
  type Room,
  type RoomParticipant,
} from "../../features/room";
import { useGameRealtime } from "../../features/game-realtime";
import { getApiErrorResponse } from "../../shared/api";

export const Route = createFileRoute("/_guest/rooms_/$roomId")({
  component: WaitingRoomPage,
});

interface DisplayParticipant {
  code: string;
  guestId: string;
  id: string;
  isFallbackHost: boolean;
  isHost: boolean;
  isReady: boolean;
  name: string;
}

interface WaitingRoomSlot {
  colorIndex: number;
  isEmpty: boolean;
  isHost: boolean;
  isMe: boolean;
  key: string;
  participant?: DisplayParticipant;
}

const EMPTY_PARTICIPANTS: RoomParticipant[] = [];
const ROOM_SLOT_COUNT = 4;
const avatarColors = [
  { base: "bg-primary", accent: "bg-danger" },
  { base: "bg-accent", accent: "bg-primary" },
  { base: "bg-room-private", accent: "bg-accent" },
  { base: "bg-room-playing", accent: "bg-room-private" },
] as const;

function WaitingRoomPage() {
  const { guestId } = Route.useRouteContext();
  const { roomId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const guestQuery = useQuery({
    queryKey: guestKeys.detail(guestId),
    queryFn: () => getGuest(guestId),
    retry: false,
  });

  const roomQuery = useQuery({
    queryKey: roomKeys.detail(roomId),
    queryFn: () => getRoom(roomId),
    retry: false,
  });

  const participantsQuery = useQuery({
    queryKey: roomParticipantKeys.list(roomId),
    queryFn: () => getRoomParticipants(roomId),
    retry: false,
  });

  const room = roomQuery.data;
  const participants = participantsQuery.data ?? EMPTY_PARTICIPANTS;
  const displayParticipants = room
    ? getDisplayParticipants(room, participants)
    : [];
  const slots = room ? getWaitingRoomSlots(room, participants, guestId) : [];
  const currentParticipant = displayParticipants.find(
    (participant) => participant.guestId === guestId,
  );
  const isCurrentGuestInRoom = Boolean(currentParticipant);
  const isCurrentGuestHost = Boolean(currentParticipant?.isHost);
  const isReady = currentParticipant?.isReady ?? false;
  const isWaitingRoom = room?.status === "WAITING";
  const hasEnoughParticipants = displayParticipants.length >= 2;
  const areParticipantsReady = displayParticipants.every(
    (participant) => participant.isHost || participant.isReady,
  );
  const currentPlayerName = guestQuery.data?.nickname ?? "Guest";
  const currentPlayerCode = guestQuery.data?.displayCode ?? "READY";
  const roomError = getApiErrorResponse(roomQuery.error);
  const participantsError = getApiErrorResponse(participantsQuery.error);

  useGameRealtime({
    enabled: Boolean(room && isCurrentGuestInRoom),
    guestId,
    onGameStarted: (event) => {
      queryClient.setQueryData(roomKeys.detail(roomId), event.room);
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });

      if (event.startedByGuestId !== guestId) {
        toast({
          title: "게임이 시작되었습니다",
          description: event.room.title,
        });
      }

      void navigate({
        to: "/play/$roomId",
        params: { roomId: event.roomId },
      });
    },
    roomId,
  });

  const leaveRoomMutation = useMutation({
    mutationFn: () => leaveRoom(roomId, guestId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: roomParticipantKeys.list(roomId),
      });

      if (response.deletedRoom) {
        queryClient.removeQueries({ queryKey: roomKeys.detail(roomId) });
      } else {
        queryClient.invalidateQueries({ queryKey: roomKeys.detail(roomId) });
      }

      toast({
        title: "방에서 나왔습니다",
        description: room?.title ?? "대기방",
      });

      void navigate({ to: "/rooms" });
    },
    onError: (error) => {
      toast(
        {
          title: "나가지 못했습니다",
          description:
            getApiErrorResponse(error)?.message ??
            "잠시 후 다시 시도해 주세요.",
        },
        { tone: "danger" },
      );
    },
  });

  const updateReadyMutation = useMutation({
    mutationFn: (nextIsReady: boolean) =>
      updateRoomParticipant(roomId, { isReady: nextIsReady }, guestId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roomParticipantKeys.list(roomId),
      });
    },
    onError: (error) => {
      toast(
        {
          title: "준비 상태를 바꾸지 못했습니다",
          description:
            getApiErrorResponse(error)?.message ??
            "잠시 후 다시 시도해 주세요.",
        },
        { tone: "danger" },
      );
    },
  });

  const startGameMutation = useMutation({
    mutationFn: () => startRoomGame(roomId, guestId),
    onSuccess: (startedRoom) => {
      queryClient.setQueryData(roomKeys.detail(roomId), startedRoom);
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: roomParticipantKeys.list(roomId),
      });
      toast({
        title: "게임을 시작했습니다",
        description: startedRoom.title,
      });
      void navigate({
        to: "/play/$roomId",
        params: { roomId: startedRoom.id },
      });
    },
    onError: (error) => {
      toast(
        {
          title: "게임을 시작하지 못했습니다",
          description:
            getApiErrorResponse(error)?.message ??
            "잠시 후 다시 시도해 주세요.",
        },
        { tone: "danger" },
      );
    },
  });

  const canStartGame =
    isCurrentGuestHost &&
    isCurrentGuestInRoom &&
    isWaitingRoom &&
    hasEnoughParticipants &&
    areParticipantsReady &&
    !startGameMutation.isPending;

  function handleToggleReady() {
    if (
      !isCurrentGuestInRoom ||
      !isWaitingRoom ||
      updateReadyMutation.isPending
    ) {
      return;
    }

    updateReadyMutation.mutate(!isReady);
  }

  function handleStartGame() {
    if (!canStartGame) {
      return;
    }

    startGameMutation.mutate();
  }

  async function handleCopyInviteLink() {
    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      !navigator.clipboard
    ) {
      toast(
        {
          title: "초대 링크를 복사하지 못했습니다",
          description: "브라우저에서 클립보드를 사용할 수 없습니다.",
        },
        { tone: "danger" },
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "초대 링크를 복사했습니다",
        description: room?.title ?? "대기방",
      });
    } catch {
      toast(
        {
          title: "초대 링크를 복사하지 못했습니다",
          description: "브라우저 권한을 확인해 주세요.",
        },
        { tone: "danger" },
      );
    }
  }

  function handleRefresh() {
    roomQuery.refetch();
    participantsQuery.refetch();
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 rounded-md border-2 border-border bg-surface p-4 shadow-[0_6px_0_rgba(39,52,60,0.22)] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-md bg-primary text-primary-foreground">
              <Brush aria-hidden="true" className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-primary">WAITING ROOM</p>
              <h1 className="truncate text-3xl font-black sm:text-4xl">
                {room?.title ?? "대기방"}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PlayerBadge code={currentPlayerCode} name={currentPlayerName} />
            <button
              className="inline-flex h-12 items-center gap-2 rounded-md border-2 border-border bg-background px-4 text-sm font-black transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={roomQuery.isFetching || participantsQuery.isFetching}
              onClick={handleRefresh}
              type="button"
            >
              <RefreshCw
                aria-hidden="true"
                className={`size-4 ${
                  roomQuery.isFetching || participantsQuery.isFetching
                    ? "animate-spin"
                    : ""
                }`}
              />
              새로고침
            </button>
            <Link
              className="inline-flex h-12 items-center gap-2 rounded-md border-2 border-border bg-background px-4 text-sm font-black transition hover:border-primary"
              to="/rooms"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              로비
            </Link>
          </div>
        </header>

        {(roomQuery.isPending || participantsQuery.isPending) && (
          <LoadingPanel message="대기방을 불러오는 중입니다." />
        )}

        {roomQuery.isError && (
          <ErrorPanel message={roomError?.message ?? "방을 찾지 못했습니다."} />
        )}

        {participantsQuery.isError && (
          <ErrorPanel
            message={
              participantsError?.message ?? "참가자 목록을 불러오지 못했습니다."
            }
          />
        )}

        {room && participantsQuery.isSuccess && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-md border-2 border-border bg-surface p-4 shadow-[0_6px_0_rgba(39,52,60,0.18)]">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    {!room.isPublic && (
                      <Lock
                        aria-label="비공개 방"
                        className="size-4 shrink-0"
                      />
                    )}
                    <p className="text-xs font-black text-muted-foreground">
                      PLAYER SLOTS
                    </p>
                  </div>
                  <h2 className="break-keep text-2xl font-black">
                    {room.title}
                  </h2>
                </div>

                <RoomStatusPill status={room.status} />
              </div>

              <WaitingSlotGrid slots={slots} />

              {!isCurrentGuestInRoom && (
                <div className="mt-4 rounded-md border-2 border-danger bg-danger/10 p-3 text-sm font-black text-danger">
                  이 게스트는 현재 방 참가자가 아닙니다.
                </div>
              )}
            </section>

            <aside className="flex flex-col gap-4 rounded-md border-2 border-border bg-surface p-4 shadow-[0_6px_0_rgba(39,52,60,0.18)]">
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-black">참가자</h2>
                  <span className="text-sm font-black text-muted-foreground">
                    {displayParticipants.length}/{ROOM_SLOT_COUNT}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {displayParticipants.map((participant, index) => (
                    <ParticipantRow
                      isMe={participant.guestId === guestId}
                      key={participant.id}
                      participant={participant}
                      toneIndex={index}
                    />
                  ))}
                </div>
              </section>

              <section className="grid gap-2">
                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md border-2 border-border bg-background px-4 text-sm font-black transition hover:border-primary"
                  onClick={handleCopyInviteLink}
                  type="button"
                >
                  <Copy aria-hidden="true" className="size-4" />
                  초대 링크 복사
                </button>

                <button
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-md px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isReady
                      ? "bg-accent text-accent-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                  disabled={
                    !isCurrentGuestInRoom ||
                    !isWaitingRoom ||
                    updateReadyMutation.isPending
                  }
                  onClick={handleToggleReady}
                  type="button"
                >
                  {updateReadyMutation.isPending ? (
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : (
                    <Check aria-hidden="true" className="size-4" />
                  )}
                  {isWaitingRoom
                    ? isReady
                      ? "준비 완료"
                      : "준비하기"
                    : "게임 진행 중"}
                </button>

                {isCurrentGuestHost && (
                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-room-playing px-4 text-sm font-black text-foreground transition disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canStartGame}
                    onClick={handleStartGame}
                    type="button"
                  >
                    {startGameMutation.isPending ? (
                      <Loader2
                        aria-hidden="true"
                        className="size-4 animate-spin"
                      />
                    ) : (
                      <Play aria-hidden="true" className="size-4" />
                    )}
                    {room.status === "PLAYING" ? "게임 진행 중" : "게임 시작"}
                  </button>
                )}

                {isCurrentGuestInRoom && room.status === "PLAYING" && (
                  <Link
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-black text-accent-foreground transition"
                    params={{ roomId: room.id }}
                    to="/play/$roomId"
                  >
                    <Play aria-hidden="true" className="size-4" />
                    게임 화면
                  </Link>
                )}

                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-danger px-4 text-sm font-black text-danger-foreground transition disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    !isCurrentGuestInRoom || leaveRoomMutation.isPending
                  }
                  onClick={() => leaveRoomMutation.mutate()}
                  type="button"
                >
                  {leaveRoomMutation.isPending ? (
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : (
                    <LogOut aria-hidden="true" className="size-4" />
                  )}
                  나가기
                </button>
              </section>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

function WaitingSlotGrid({ slots }: { slots: WaitingRoomSlot[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {slots.map((slot) => (
        <WaitingSlot key={slot.key} slot={slot} />
      ))}
    </div>
  );
}

function WaitingSlot({ slot }: { slot: WaitingRoomSlot }) {
  const color = avatarColors[slot.colorIndex % avatarColors.length];

  return (
    <div
      className={`relative flex min-h-36 flex-col justify-between rounded-md border-2 p-3 ${
        slot.isEmpty
          ? "border-dashed border-border bg-surface-muted"
          : `border-border ${color.base}`
      } ${slot.isMe ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-black text-foreground/70">SLOT</span>
        {slot.isHost && !slot.isEmpty && (
          <span className="grid size-7 place-items-center rounded-full border-2 border-border bg-primary text-primary-foreground">
            <Crown aria-hidden="true" className="size-4" />
          </span>
        )}
      </div>

      <div className="grid place-items-center">
        {slot.isEmpty ? (
          <span className="grid size-14 place-items-center rounded-md border-2 border-dashed border-border bg-background">
            <Users aria-hidden="true" className="size-6 text-muted" />
          </span>
        ) : (
          <span className="relative size-16 rounded-md border-2 border-border bg-surface">
            <span className="absolute left-1/2 top-4 flex -translate-x-1/2 gap-1.5">
              <span className="size-2 rounded-full bg-foreground" />
              <span className="size-2 rounded-full bg-foreground" />
            </span>
            <span
              className={`absolute bottom-4 left-1/2 h-2 w-7 -translate-x-1/2 rounded-full ${color.accent}`}
            />
          </span>
        )}
      </div>

      <div className="min-h-10">
        <p className="truncate text-center text-sm font-black">
          {slot.participant?.name ?? "빈 자리"}
        </p>
        <p className="mt-1 truncate text-center text-xs font-bold text-foreground/70">
          {slot.participant?.code ?? "READY?"}
        </p>
      </div>
    </div>
  );
}

function ParticipantRow({
  isMe,
  participant,
  toneIndex,
}: {
  isMe: boolean;
  participant: DisplayParticipant;
  toneIndex: number;
}) {
  const color = avatarColors[toneIndex % avatarColors.length];

  return (
    <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-md bg-background px-3 py-2">
      <div className={`grid size-10 place-items-center rounded-md ${color.base}`}>
        <span className="relative size-6 rounded-md border-2 border-border bg-surface">
          <span className="absolute left-1/2 top-1.5 flex -translate-x-1/2 gap-1">
            <span className="size-1 rounded-full bg-foreground" />
            <span className="size-1 rounded-full bg-foreground" />
          </span>
          <span
            className={`absolute bottom-1.5 left-1/2 h-1 w-3 -translate-x-1/2 rounded-full ${color.accent}`}
          />
        </span>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-black">{participant.name}</p>
          {isMe && <span className="text-xs font-black text-accent">ME</span>}
        </div>
        <p className="truncate text-xs font-bold text-muted-foreground">
          {participant.code}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {participant.isHost && (
          <Crown
            aria-label="호스트"
            className="size-4 shrink-0 text-primary-foreground"
          />
        )}
        {participant.isReady && (
          <span className="grid size-6 place-items-center rounded-full bg-accent text-accent-foreground">
            <Check aria-label="준비 완료" className="size-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}

function PlayerBadge({ code, name }: { code: string; name: string }) {
  return (
    <div className="grid h-12 grid-cols-[40px_minmax(0,1fr)] items-center gap-2 rounded-md border-2 border-border bg-background px-2">
      <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
        <Users aria-hidden="true" className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-black">{name}</p>
        <p className="truncate text-xs font-bold text-muted-foreground">
          {code}
        </p>
      </div>
    </div>
  );
}

function RoomStatusPill({ status }: { status: Room["status"] }) {
  const statusLabel = {
    WAITING: "대기 중",
    PLAYING: "진행 중",
    CLOSED: "종료됨",
  }[status];
  const statusClass = {
    WAITING: "bg-primary text-primary-foreground",
    PLAYING: "bg-room-playing text-foreground",
    CLOSED: "bg-room-closed text-foreground",
  }[status];

  return (
    <span
      className={`inline-flex h-8 w-fit items-center gap-2 rounded-md border-2 border-border px-3 text-xs font-black ${statusClass}`}
    >
      <span className="size-2 rounded-full bg-current" />
      {statusLabel}
    </span>
  );
}

function LoadingPanel({ message }: { message: string }) {
  return (
    <div className="rounded-md border-2 border-border bg-surface p-4 text-sm font-bold text-muted-foreground">
      <Loader2 aria-hidden="true" className="mr-2 inline size-4 animate-spin" />
      {message}
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <p className="rounded-md border-2 border-danger bg-danger/10 p-4 text-sm font-bold text-danger">
      {message}
    </p>
  );
}

function getDisplayParticipants(room: Room, participants: RoomParticipant[]) {
  const displayParticipants = participants
    .slice()
    .sort((a, b) => Number(b.isHost) - Number(a.isHost))
    .map<DisplayParticipant>((participant) => ({
      code: participant.guest?.displayCode ?? "READY",
      guestId: participant.guestId,
      id: participant.id,
      isFallbackHost: false,
      isHost: participant.isHost || participant.guestId === room.hostGuestId,
      isReady: participant.isReady,
      name:
        participant.guest?.nickname ??
        (participant.guestId === room.hostGuestId
          ? room.hostNickname
          : "Guest"),
    }));

  if (!displayParticipants.some((participant) => participant.isHost)) {
    displayParticipants.unshift({
      code: "HOST",
      guestId: room.hostGuestId,
      id: `${room.id}-host`,
      isFallbackHost: true,
      isHost: true,
      isReady: false,
      name: room.hostNickname,
    });
  }

  return displayParticipants.slice(0, ROOM_SLOT_COUNT);
}

function getWaitingRoomSlots(
  room: Room,
  participants: RoomParticipant[],
  guestId: string,
) {
  const participantSlots = getDisplayParticipants(
    room,
    participants,
  ).map<WaitingRoomSlot>((participant, index) => ({
    colorIndex: index,
    isEmpty: false,
    isHost: participant.isHost,
    isMe: participant.guestId === guestId && !participant.isFallbackHost,
    key: participant.id,
    participant,
  }));

  const openSlots = Array.from(
    { length: Math.max(ROOM_SLOT_COUNT - participantSlots.length, 0) },
    (_, index) => ({
      colorIndex: participantSlots.length + index,
      isEmpty: true,
      isHost: false,
      isMe: false,
      key: `${room.id}-open-${index}`,
    }),
  );

  return [...participantSlots, ...openSlots].slice(0, ROOM_SLOT_COUNT);
}
