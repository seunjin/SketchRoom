import type { ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  Brush,
  Check,
  Crown,
  Eraser,
  Loader2,
  Paintbrush,
  RefreshCw,
  Send,
  Timer,
  Users,
} from "lucide-react";
import { getGuest, guestKeys } from "../../features/guest";
import {
  getRoom,
  getRoomParticipants,
  roomKeys,
  roomParticipantKeys,
  type Room,
  type RoomParticipant,
} from "../../features/room";
import { getApiErrorResponse } from "../../shared/api";

export const Route = createFileRoute("/_guest/play_/$roomId")({
  component: PlayRoomPage,
});

interface DisplayParticipant {
  code: string;
  guestId: string;
  id: string;
  isHost: boolean;
  isReady: boolean;
  name: string;
}

const EMPTY_PARTICIPANTS: RoomParticipant[] = [];
const ROOM_SLOT_COUNT = 4;
const palette = [
  "bg-primary text-primary-foreground",
  "bg-accent text-accent-foreground",
  "bg-room-private text-foreground",
  "bg-room-playing text-foreground",
] as const;
const swatches = ["bg-foreground", "bg-danger", "bg-accent", "bg-primary"];

function PlayRoomPage() {
  const { guestId } = Route.useRouteContext();
  const { roomId } = Route.useParams();

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
  const currentParticipant = displayParticipants.find(
    (participant) => participant.guestId === guestId,
  );
  const isCurrentGuestInRoom = Boolean(currentParticipant);
  const currentPlayerName = guestQuery.data?.nickname ?? "Guest";
  const currentPlayerCode = guestQuery.data?.displayCode ?? "PLAY";
  const roomError = getApiErrorResponse(roomQuery.error);
  const participantsError = getApiErrorResponse(participantsQuery.error);
  const isLoading =
    roomQuery.isPending || participantsQuery.isPending || guestQuery.isPending;

  function handleRefresh() {
    roomQuery.refetch();
    participantsQuery.refetch();
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 rounded-md border-2 border-border bg-surface p-4 shadow-[0_6px_0_rgba(39,52,60,0.22)] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-md bg-room-playing text-foreground">
              <Brush aria-hidden="true" className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-room-playing">
                SKETCH ROUND
              </p>
              <h1 className="truncate text-3xl font-black sm:text-4xl">
                {room?.title ?? "게임"}
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
              params={{ roomId }}
              to="/rooms/$roomId"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              대기방
            </Link>
          </div>
        </header>

        {isLoading && <LoadingPanel message="게임 화면을 불러오는 중입니다." />}

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

        {room && participantsQuery.isSuccess && !isLoading && (
          <>
            {!isCurrentGuestInRoom && (
              <StatePanel
                actionLabel="대기방으로"
                message="참가 중인 방에서만 플레이할 수 있습니다."
                roomId={room.id}
                title="참가자가 아닙니다"
              />
            )}

            {isCurrentGuestInRoom && room.status === "WAITING" && (
              <StatePanel
                actionLabel="대기방으로"
                message="호스트가 게임을 시작하면 입장할 수 있습니다."
                roomId={room.id}
                title="아직 대기 중"
              />
            )}

            {isCurrentGuestInRoom && room.status === "CLOSED" && (
              <StatePanel
                actionLabel="로비로"
                message="종료된 방입니다."
                roomId={room.id}
                title="게임 종료"
                toLobby
              />
            )}

            {isCurrentGuestInRoom && room.status === "PLAYING" && (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                <GameBoard />
                <aside className="flex flex-col gap-4">
                  <RoomPhasePanel room={room} />
                  <ParticipantPanel
                    currentGuestId={guestId}
                    participants={displayParticipants}
                  />
                </aside>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function GameBoard() {
  return (
    <section className="flex min-h-[620px] flex-col rounded-md border-2 border-border bg-surface p-4 shadow-[0_6px_0_rgba(39,52,60,0.18)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black text-muted-foreground">ROUND 1</p>
          <h2 className="text-2xl font-black">라운드 준비 중</h2>
        </div>
        <div className="inline-flex h-10 w-fit items-center gap-2 rounded-md border-2 border-border bg-background px-3 text-sm font-black">
          <Timer aria-hidden="true" className="size-4" />
          00:00
        </div>
      </div>

      <div className="relative min-h-[380px] flex-1 overflow-hidden rounded-md border-2 border-border bg-background">
        <div className="absolute inset-4 rounded-md border-2 border-dashed border-border/30" />
        <div className="absolute left-[12%] top-[18%] h-16 w-48 rotate-[-8deg] rounded-full bg-primary/70" />
        <div className="absolute right-[12%] top-[22%] h-20 w-20 rounded-md bg-room-private/70" />
        <div className="absolute bottom-[22%] left-[22%] h-24 w-24 rounded-full border-[14px] border-accent" />
        <div className="absolute bottom-[18%] right-[18%] h-12 w-44 rotate-[10deg] rounded-full bg-danger/70" />
        <div className="absolute left-1/2 top-1/2 grid size-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-md border-2 border-border bg-surface shadow-[0_5px_0_rgba(39,52,60,0.16)]">
          <Paintbrush aria-hidden="true" className="size-10 text-primary" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-none sm:grid-flow-col">
          <ToolButton icon={<Paintbrush aria-hidden="true" />} label="펜" />
          <ToolButton icon={<Eraser aria-hidden="true" />} label="지우개" />
        </div>

        <div className="flex flex-wrap gap-2">
          {swatches.map((swatch) => (
            <button
              aria-label="색상"
              className={`size-10 rounded-md border-2 border-border ${swatch}`}
              key={swatch}
              type="button"
            />
          ))}
        </div>

        <button
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-black text-accent-foreground transition disabled:cursor-not-allowed disabled:opacity-50"
          disabled
          type="button"
        >
          <Send aria-hidden="true" className="size-4" />
          제출
        </button>
      </div>
    </section>
  );
}

function RoomPhasePanel({ room }: { room: Room }) {
  return (
    <section className="rounded-md border-2 border-border bg-surface p-4 shadow-[0_6px_0_rgba(39,52,60,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-muted-foreground">STATUS</p>
          <h2 className="text-xl font-black">진행 중</h2>
        </div>
        <span className="grid size-10 place-items-center rounded-md bg-room-playing text-foreground">
          <Brush aria-hidden="true" className="size-5" />
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <PhaseStat label="방" value={room.title} />
        <PhaseStat label="모드" value="드로잉" />
      </div>
    </section>
  );
}

function ParticipantPanel({
  currentGuestId,
  participants,
}: {
  currentGuestId: string;
  participants: DisplayParticipant[];
}) {
  return (
    <section className="rounded-md border-2 border-border bg-surface p-4 shadow-[0_6px_0_rgba(39,52,60,0.18)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black">플레이어</h2>
        <span className="text-sm font-black text-muted-foreground">
          {participants.length}/{ROOM_SLOT_COUNT}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {participants.map((participant, index) => (
          <ParticipantRow
            isMe={participant.guestId === currentGuestId}
            key={participant.id}
            participant={participant}
            toneIndex={index}
          />
        ))}
      </div>
    </section>
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
  const tone = palette[toneIndex % palette.length];

  return (
    <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-md bg-background px-3 py-2">
      <div className={`grid size-10 place-items-center rounded-md ${tone}`}>
        <Users aria-hidden="true" className="size-4" />
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
          <Crown aria-label="호스트" className="size-4 text-primary" />
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

function ToolButton({
  icon,
  label,
}: {
  icon: ReactElement<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      className="grid size-12 place-items-center rounded-md border-2 border-border bg-background text-foreground transition hover:border-primary"
      title={label}
      type="button"
    >
      {icon}
    </button>
  );
}

function PhaseStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border-2 border-border bg-background p-3">
      <p className="text-xs font-black text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-black">{value}</p>
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

function StatePanel({
  actionLabel,
  message,
  roomId,
  title,
  toLobby = false,
}: {
  actionLabel: string;
  message: string;
  roomId: string;
  title: string;
  toLobby?: boolean;
}) {
  return (
    <div className="grid min-h-[360px] place-items-center rounded-md border-2 border-border bg-surface p-6 text-center shadow-[0_6px_0_rgba(39,52,60,0.18)]">
      <div>
        <p className="text-2xl font-black">{title}</p>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          {message}
        </p>
        {toLobby ? (
          <Link
            className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-black text-accent-foreground"
            to="/rooms"
          >
            {actionLabel}
          </Link>
        ) : (
          <Link
            className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-black text-accent-foreground"
            params={{ roomId }}
            to="/rooms/$roomId"
          >
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
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
      code: participant.guest?.displayCode ?? "PLAY",
      guestId: participant.guestId,
      id: participant.id,
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
      isHost: true,
      isReady: false,
      name: room.hostNickname,
    });
  }

  return displayParticipants.slice(0, ROOM_SLOT_COUNT);
}
