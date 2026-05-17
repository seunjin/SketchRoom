import { useState, type FormEvent, type ReactNode } from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "@woon-ui/toast";
import {
  ArrowRight,
  Brush,
  Crown,
  DoorOpen,
  Info,
  Loader2,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Unlock,
  Users,
  X,
} from "lucide-react";
import { getGuest, guestKeys } from "../../features/guest";
import {
  createRoom,
  getRoomParticipants,
  getRooms,
  joinRoom,
  leaveRoom,
  roomKeys,
  roomParticipantKeys,
  type CreateRoomRequest,
  type Room,
  type RoomParticipant,
} from "../../features/room";
import { getApiErrorResponse } from "../../shared/api";
import { DialogPrimitive, useDialog } from "../../woon/ui/dialog.ts";

export const Route = createFileRoute("/_guest/rooms")({
  component: RoomsPage,
});

type Visibility = "public" | "private";

interface RoomSlot {
  colorIndex: number;
  isEmpty: boolean;
  isHost: boolean;
  isMe: boolean;
  key: string;
}

const EMPTY_ROOMS: Room[] = [];
const EMPTY_PARTICIPANTS: RoomParticipant[] = [];
const ROOM_SLOT_COUNT = 4;
const avatarColors = [
  { base: "bg-primary", accent: "bg-danger" },
  { base: "bg-accent", accent: "bg-primary" },
  { base: "bg-room-private", accent: "bg-accent" },
  { base: "bg-room-playing", accent: "bg-room-private" },
] as const;

function RoomsPage() {
  const { guestId } = Route.useRouteContext();
  const dialog = useDialog();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const guestQuery = useQuery({
    queryKey: guestKeys.detail(guestId),
    queryFn: () => getGuest(guestId),
    retry: false,
  });

  const roomsQuery = useQuery({
    queryKey: roomKeys.list(),
    queryFn: getRooms,
  });

  const rooms = roomsQuery.data ?? EMPTY_ROOMS;
  const participantQueries = useQueries({
    queries: rooms.map((room) => ({
      queryKey: roomParticipantKeys.list(room.id),
      queryFn: () => getRoomParticipants(room.id),
      enabled: roomsQuery.isSuccess,
      retry: false,
    })),
  });

  const participantsByRoom = new Map(
    rooms.map((room, index) => [
      room.id,
      participantQueries[index]?.data ?? EMPTY_PARTICIPANTS,
    ]),
  );
  const isParticipantStateLoading = participantQueries.some(
    (query) => query.isPending,
  );
  const joinedRoom = rooms.find((room) => {
    const participants = participantsByRoom.get(room.id) ?? EMPTY_PARTICIPANTS;

    return (
      room.hostGuestId === guestId ||
      participants.some((participant) => participant.guestId === guestId)
    );
  });

  function invalidateRoomList() {
    queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
    queryClient.invalidateQueries({ queryKey: roomParticipantKeys.lists() });
  }

  function invalidateRoomParticipants(roomId: string) {
    queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
    queryClient.invalidateQueries({
      queryKey: roomParticipantKeys.list(roomId),
    });
  }

  function handleRoomCreated(room: Room) {
    queryClient.setQueryData(roomKeys.detail(room.id), room);
    invalidateRoomList();
    toast({
      title: "방을 만들었습니다",
      description: room.title,
    });
    void navigate({
      to: "/rooms/$roomId",
      params: { roomId: room.id },
    });
  }

  function handleRoomJoined(room: Room) {
    invalidateRoomParticipants(room.id);
    toast({
      title: "입장했습니다",
      description: room.title,
    });
    void navigate({
      to: "/rooms/$roomId",
      params: { roomId: room.id },
    });
  }

  const joinRoomMutation = useMutation({
    mutationFn: ({ room }: { room: Room }) => joinRoom(room.id, {}, guestId),
    onSuccess: (_participant, variables) => {
      handleRoomJoined(variables.room);
    },
    onError: (error) => {
      toast(
        {
          title: "입장하지 못했습니다",
          description:
            getApiErrorResponse(error)?.message ??
            "잠시 후 다시 시도해 주세요.",
        },
        { tone: "danger" },
      );
    },
  });

  const leaveRoomMutation = useMutation({
    mutationFn: (room: Room) => leaveRoom(room.id, guestId),
    onSuccess: (_response, room) => {
      invalidateRoomList();
      toast({
        title: "방에서 나왔습니다",
        description: room.title,
      });
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

  const roomsError = getApiErrorResponse(roomsQuery.error);

  function handleOpenCreateDialog() {
    if (joinedRoom || isParticipantStateLoading) {
      return;
    }

    dialog.open(
      ({ close }) => (
        <CreateRoomDialog
          guestId={guestId}
          onClose={close}
          onCreated={handleRoomCreated}
        />
      ),
      { closeOnOverlayClick: false },
    );
  }

  function handleJoinRoom(room: Room) {
    if (joinedRoom || joinRoomMutation.isPending) {
      return;
    }

    if (!room.isPublic) {
      dialog.open(
        ({ close }) => (
          <JoinPrivateRoomDialog
            guestId={guestId}
            onClose={close}
            onJoined={handleRoomJoined}
            room={room}
          />
        ),
        { closeOnOverlayClick: false },
      );
      return;
    }

    joinRoomMutation.mutate({ room });
  }

  function handleOpenRoomDetail({
    isFull,
    isJoinedRoom,
    participantCount,
    participants,
    room,
  }: {
    isFull: boolean;
    isJoinedRoom: boolean;
    participantCount: number;
    participants: RoomParticipant[];
    room: Room;
  }) {
    dialog.open(() => (
      <RoomDetailDialog
        isFull={isFull}
        isJoinedRoom={isJoinedRoom}
        participantCount={participantCount}
        participants={getDisplayParticipants(room, participants)}
        room={room}
      />
    ));
  }

  const currentPlayerName = guestQuery.data?.nickname ?? "Guest";
  const currentPlayerCode = guestQuery.data?.displayCode ?? "READY";

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 rounded-md border-2 border-border bg-surface p-4 shadow-[0_6px_0_rgba(39,52,60,0.22)] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-md bg-primary text-primary-foreground">
              <Brush aria-hidden="true" className="size-6" />
            </div>
            <div>
              <p className="text-sm font-black text-primary">DRAW PARTY</p>
              <h1 className="text-3xl font-black sm:text-4xl">대기방</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PlayerBadge code={currentPlayerCode} name={currentPlayerName} />
            <button
              className="inline-flex h-12 items-center gap-2 rounded-md border-2 border-border bg-background px-4 text-sm font-black transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={roomsQuery.isFetching}
              onClick={() => roomsQuery.refetch()}
              type="button"
            >
              <RefreshCw
                aria-hidden="true"
                className={`size-4 ${roomsQuery.isFetching ? "animate-spin" : ""}`}
              />
              새로고침
            </button>
            <button
              className="inline-flex h-12 items-center gap-2 rounded-md bg-primary px-4 text-sm font-black text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-50"
              disabled={Boolean(joinedRoom) || isParticipantStateLoading}
              onClick={handleOpenCreateDialog}
              type="button"
            >
              <Plus aria-hidden="true" className="size-4" />방 만들기
            </button>
          </div>
        </header>

        {joinedRoom && (
          <div className="flex flex-col gap-3 rounded-md border-2 border-accent bg-accent/10 px-4 py-3 text-sm font-black text-accent sm:flex-row sm:items-center sm:justify-between">
            <span className="min-w-0 truncate">참여 중: {joinedRoom.title}</span>
            <Link
              className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-md bg-accent px-3 text-xs font-black text-accent-foreground"
              params={{ roomId: joinedRoom.id }}
              to="/rooms/$roomId"
            >
              대기방
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
        )}

        {roomsQuery.isPending && (
          <LoadingPanel message="대기방 카드를 불러오는 중입니다." />
        )}

        {roomsQuery.isError && (
          <p className="rounded-md border-2 border-danger bg-danger/10 p-4 text-sm font-bold text-danger">
            {roomsError?.message ?? "방 목록을 불러오지 못했습니다."}
          </p>
        )}

        {roomsQuery.isSuccess && rooms.length === 0 && <EmptyLobby />}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((room, index) => {
            const participants =
              participantsByRoom.get(room.id) ?? EMPTY_PARTICIPANTS;
            const participantCount = getParticipantCount(room, participants);
            const slots = getRoomSlots(room, participants, guestId, index);
            const isJoinedRoom = joinedRoom?.id === room.id;
            const isFull = participantCount >= room.maxParticipants;
            const isJoinDisabled =
              Boolean(joinedRoom) ||
              room.status !== "WAITING" ||
              isFull ||
              joinRoomMutation.isPending ||
              leaveRoomMutation.isPending ||
              isParticipantStateLoading;

            return (
              <RoomCard
                isJoinedRoom={isJoinedRoom}
                isJoinDisabled={isJoinDisabled}
                isLeaving={
                  leaveRoomMutation.isPending &&
                  leaveRoomMutation.variables?.id === room.id
                }
                isLoadingParticipants={participantQueries[index]?.isPending}
                isJoining={
                  joinRoomMutation.isPending &&
                  joinRoomMutation.variables?.room.id === room.id
                }
                key={room.id}
                onJoin={() => handleJoinRoom(room)}
                onLeave={() => leaveRoomMutation.mutate(room)}
                onOpenDetail={() =>
                  handleOpenRoomDetail({
                    isFull,
                    isJoinedRoom,
                    participantCount,
                    participants,
                    room,
                  })
                }
                room={room}
                slots={slots}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}

function RoomCard({
  isJoinedRoom,
  isJoinDisabled,
  isJoining,
  isLeaving,
  isLoadingParticipants,
  onJoin,
  onLeave,
  onOpenDetail,
  room,
  slots,
}: {
  isJoinedRoom: boolean;
  isJoinDisabled: boolean;
  isJoining: boolean;
  isLeaving: boolean;
  isLoadingParticipants: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onOpenDetail: () => void;
  room: Room;
  slots: RoomSlot[];
}) {
  return (
    <article className="flex min-h-[236px] flex-col rounded-md border-2 border-border bg-surface p-4 shadow-[0_6px_0_rgba(39,52,60,0.18)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="line-clamp-2 min-h-12 break-keep text-lg font-black leading-tight">
            {room.title}
          </h2>
        </div>
        <RoomPrivacyIcon isPublic={room.isPublic} />
      </div>

      <RoomSlotGrid slots={slots} />

      <div className="mt-auto grid grid-cols-[44px_minmax(0,1fr)] gap-2 pt-4">
        <button
          aria-label={`${room.title} 정보`}
          className="grid h-10 place-items-center rounded-md border-2 border-border bg-background text-foreground transition hover:border-primary"
          onClick={onOpenDetail}
          type="button"
        >
          <Info aria-hidden="true" className="size-4" />
        </button>

        {isJoinedRoom ? (
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-danger px-4 text-sm font-black text-danger-foreground transition disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLeaving}
            onClick={onLeave}
            type="button"
          >
            {isLeaving ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <LogOut aria-hidden="true" className="size-4" />
            )}
            나가기
          </button>
        ) : (
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-black text-accent-foreground transition disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isJoinDisabled}
            onClick={onJoin}
            type="button"
          >
            {isJoining || isLoadingParticipants ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <DoorOpen aria-hidden="true" className="size-4" />
            )}
            {getJoinButtonLabel(room)}
          </button>
        )}
      </div>
    </article>
  );
}

function CreateRoomDialog({
  guestId,
  onClose,
  onCreated,
}: {
  guestId: string;
  onClose: () => void;
  onCreated: (room: Room) => void;
}) {
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [password, setPassword] = useState("");
  const trimmedTitle = title.trim();
  const trimmedPassword = password.trim();
  const isPrivate = visibility === "private";

  const createRoomMutation = useMutation({
    mutationFn: (request: CreateRoomRequest) => createRoom(request, guestId),
    onSuccess: (room) => {
      onCreated(room);
      onClose();
    },
  });

  const createError = getApiErrorResponse(createRoomMutation.error);
  const canCreateRoom =
    trimmedTitle.length > 0 &&
    (!isPrivate || trimmedPassword.length > 0) &&
    !createRoomMutation.isPending;

  function handleCreateRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canCreateRoom) {
      return;
    }

    createRoomMutation.mutate({
      title: trimmedTitle,
      isPublic: visibility === "public",
      ...(isPrivate ? { password: trimmedPassword } : {}),
    });
  }

  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Overlay />
      <DialogPrimitive.Content>
        <DialogHeader title="새 방 만들기" />

        <form className="mt-4 flex flex-col gap-3" onSubmit={handleCreateRoom}>
          <label className="flex flex-col gap-2 text-sm font-black">
            방 이름
            <input
              className="h-12 rounded-md border-2 border-border bg-background px-3 text-sm font-bold text-foreground outline-none transition focus:border-primary"
              maxLength={100}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="예: 금요일 드로잉 파티"
              type="text"
              value={title}
            />
          </label>

          <VisibilityControl onChange={setVisibility} value={visibility} />

          {isPrivate && (
            <label className="flex flex-col gap-2 text-sm font-black">
              비공개 코드
              <input
                className="h-12 rounded-md border-2 border-border bg-background px-3 text-sm font-bold text-foreground outline-none transition focus:border-primary"
                maxLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="최대 8자"
                type="password"
                value={password}
              />
            </label>
          )}

          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-black text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canCreateRoom}
            type="submit"
          >
            {createRoomMutation.isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Plus aria-hidden="true" className="size-4" />
            )}
            만들기
          </button>

          <StatusMessage message={createError?.message ?? ""} />
        </form>
      </DialogPrimitive.Content>
    </DialogPrimitive.Root>
  );
}

function JoinPrivateRoomDialog({
  guestId,
  onClose,
  onJoined,
  room,
}: {
  guestId: string;
  onClose: () => void;
  onJoined: (room: Room) => void;
  room: Room;
}) {
  const [password, setPassword] = useState("");
  const trimmedPassword = password.trim();

  const joinRoomMutation = useMutation({
    mutationFn: () => joinRoom(room.id, { password: trimmedPassword }, guestId),
    onSuccess: () => {
      onJoined(room);
      onClose();
    },
  });

  const joinError = getApiErrorResponse(joinRoomMutation.error);

  function handleJoinPrivateRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (trimmedPassword.length === 0 || joinRoomMutation.isPending) {
      return;
    }

    joinRoomMutation.mutate();
  }

  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Overlay />
      <DialogPrimitive.Content>
        <DialogHeader title={room.title} />

        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={handleJoinPrivateRoom}
        >
          <label className="flex flex-col gap-2 text-sm font-black">
            비공개 코드
            <input
              className="h-12 rounded-md border-2 border-border bg-background px-3 text-sm font-bold text-foreground outline-none transition focus:border-primary"
              maxLength={8}
              onChange={(event) => {
                setPassword(event.target.value);
                if (joinRoomMutation.isError) {
                  joinRoomMutation.reset();
                }
              }}
              placeholder="코드 입력"
              type="password"
              value={password}
            />
          </label>

          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-black text-accent-foreground transition disabled:cursor-not-allowed disabled:opacity-50"
            disabled={
              trimmedPassword.length === 0 || joinRoomMutation.isPending
            }
            type="submit"
          >
            {joinRoomMutation.isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <DoorOpen aria-hidden="true" className="size-4" />
            )}
            입장
          </button>

          <StatusMessage message={joinError?.message ?? ""} />
        </form>
      </DialogPrimitive.Content>
    </DialogPrimitive.Root>
  );
}

function RoomDetailDialog({
  isFull,
  isJoinedRoom,
  participantCount,
  participants,
  room,
}: {
  isFull: boolean;
  isJoinedRoom: boolean;
  participantCount: number;
  participants: Array<{ id: string; isHost: boolean; label: string }>;
  room: Room;
}) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Overlay />
      <DialogPrimitive.Content>
        <DialogHeader title={room.title} />

        <div className="mt-4 grid gap-3">
          <div className="flex flex-wrap gap-2">
            <RoomVisibilityBadge isPublic={room.isPublic} />
            <RoomAvailabilityBadge
              isFull={isFull}
              isJoinedRoom={isJoinedRoom}
              status={room.status}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <DetailStat label="호스트" value={room.hostNickname} />
            <DetailStat
              label="참가자"
              value={`${participantCount}/${room.maxParticipants}`}
            />
            <DetailStat
              label="공개 여부"
              value={room.isPublic ? "공개" : "비공개"}
            />
            <DetailStat
              label="입장 상태"
              value={getAvailabilityLabel(room.status, isFull, isJoinedRoom)}
            />
          </div>

          <div className="rounded-md border-2 border-border bg-background p-3">
            <p className="mb-2 text-xs font-black text-muted-foreground">
              PLAYER SLOTS
            </p>
            <div className="flex flex-col gap-2">
              {participants.map((participant) => (
                <div
                  className="flex items-center justify-between rounded-md bg-surface px-3 py-2 text-sm font-black"
                  key={participant.id}
                >
                  <span className="truncate">{participant.label}</span>
                  {participant.isHost && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary">
                      <Crown aria-hidden="true" className="size-3" />
                      HOST
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Root>
  );
}

function DialogHeader({ title }: { title: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-black text-primary">DRAW PARTY</p>
        <DialogPrimitive.Title asChild>
          <h2 className="mt-1 break-words text-2xl font-black">{title}</h2>
        </DialogPrimitive.Title>
      </div>
      <DialogPrimitive.Close asChild>
        <button
          aria-label="닫기"
          className="grid size-10 shrink-0 place-items-center rounded-md border-2 border-border bg-background text-foreground"
          type="button"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </DialogPrimitive.Close>
    </div>
  );
}

function VisibilityControl({
  onChange,
  value,
}: {
  onChange: (value: Visibility) => void;
  value: Visibility;
}) {
  return (
    <div className="grid grid-cols-2 rounded-md border-2 border-border bg-background p-1">
      <button
        className={`inline-flex h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-black transition ${
          value === "public"
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-surface-muted"
        }`}
        onClick={() => onChange("public")}
        type="button"
      >
        <Unlock aria-hidden="true" className="size-4" />
        공개
      </button>
      <button
        className={`inline-flex h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-black transition ${
          value === "private"
            ? "bg-room-private text-foreground"
            : "text-muted-foreground hover:bg-surface-muted"
        }`}
        onClick={() => onChange("private")}
        type="button"
      >
        <Lock aria-hidden="true" className="size-4" />
        비공개
      </button>
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

function RoomSlotGrid({ slots }: { slots: RoomSlot[] }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {slots.map((slot) => (
        <PlayerSlot key={slot.key} slot={slot} />
      ))}
    </div>
  );
}

function PlayerSlot({ slot }: { slot: RoomSlot }) {
  const color = avatarColors[slot.colorIndex % avatarColors.length];

  return (
    <div
      aria-label={getSlotLabel(slot)}
      className={`relative grid aspect-square place-items-center rounded-md border-2 ${
        slot.isEmpty
          ? "border-dashed border-border bg-surface-muted"
          : `border-border ${color.base}`
      } ${slot.isMe ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}`}
      title={getSlotLabel(slot)}
    >
      {slot.isEmpty ? (
        <span className="size-3 rounded-full border-2 border-dashed border-muted" />
      ) : (
        <span className="relative size-8 rounded-md border-2 border-border bg-surface">
          <span className="absolute left-1/2 top-2 flex -translate-x-1/2 gap-1">
            <span className="size-1.5 rounded-full bg-foreground" />
            <span className="size-1.5 rounded-full bg-foreground" />
          </span>
          <span
            className={`absolute bottom-2 left-1/2 h-1.5 w-4 -translate-x-1/2 rounded-full ${color.accent}`}
          />
        </span>
      )}

      {slot.isHost && !slot.isEmpty && (
        <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border-2 border-border bg-primary text-primary-foreground">
          <Crown aria-hidden="true" className="size-3" />
        </span>
      )}
    </div>
  );
}

function RoomVisibilityBadge({ isPublic }: { isPublic: boolean }) {
  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-black ${
        isPublic
          ? "bg-room-public text-accent-foreground"
          : "bg-room-private text-foreground"
      }`}
    >
      {isPublic ? (
        <Unlock aria-hidden="true" className="size-3" />
      ) : (
        <Lock aria-hidden="true" className="size-3" />
      )}
      {isPublic ? "공개" : "비공개"}
    </span>
  );
}

function RoomPrivacyIcon({ isPublic }: { isPublic: boolean }) {
  if (isPublic) {
    return null;
  }

  return (
    <span
      aria-label="비공개 방"
      className="mt-1 grid size-5 shrink-0 place-items-center text-foreground"
      title="비공개 방"
    >
      <Lock aria-hidden="true" className="size-4" />
    </span>
  );
}

function RoomAvailabilityBadge({
  isFull,
  isJoinedRoom,
  status,
}: {
  isFull: boolean;
  isJoinedRoom: boolean;
  status: Room["status"];
}) {
  const label = getAvailabilityLabel(status, isFull, isJoinedRoom);
  const toneClass =
    status !== "WAITING"
      ? "bg-room-playing text-foreground"
      : isJoinedRoom
        ? "bg-primary text-primary-foreground"
        : isFull
          ? "bg-room-closed text-foreground"
          : "bg-accent text-accent-foreground";

  return (
    <span
      className={`inline-flex h-8 items-center gap-2 rounded-md border-2 border-border px-2.5 text-xs font-black ${toneClass}`}
    >
      <span className="size-2 rounded-full bg-current" />
      {label}
    </span>
  );
}

function DetailStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border-2 border-border bg-background p-3">
      <p className="text-xs font-black text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-black">{value}</p>
    </div>
  );
}

function EmptyLobby() {
  return (
    <div className="grid min-h-[360px] place-items-center rounded-md border-2 border-dashed border-border bg-surface p-6 text-center">
      <div>
        <p className="text-2xl font-black">열린 방이 없습니다</p>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          방 만들기로 첫 대기방을 열어보세요.
        </p>
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

function StatusMessage({ message }: { message: string }) {
  return <p className="min-h-5 text-sm font-bold text-danger">{message}</p>;
}

function getDisplayParticipants(room: Room, participants: RoomParticipant[]) {
  const displayParticipants = participants
    .slice()
    .sort((a, b) => Number(b.isHost) - Number(a.isHost))
    .map((participant) => ({
      id: participant.id,
      isHost: participant.isHost || participant.guestId === room.hostGuestId,
      label:
        participant.guest?.nickname ??
        (participant.guestId === room.hostGuestId
          ? room.hostNickname
          : "Guest"),
    }));

  if (!displayParticipants.some((participant) => participant.isHost)) {
    displayParticipants.unshift({
      id: `${room.id}-host`,
      isHost: true,
      label: room.hostNickname,
    });
  }

  return displayParticipants.slice(0, room.maxParticipants);
}

function getParticipantCount(room: Room, participants: RoomParticipant[]) {
  const hasHost = participants.some(
    (participant) => participant.guestId === room.hostGuestId,
  );

  return Math.min(
    hasHost ? participants.length : participants.length + 1,
    room.maxParticipants,
  );
}

function getRoomSlots(
  room: Room,
  participants: RoomParticipant[],
  guestId: string,
  offset: number,
) {
  const participantSlots = getDisplayParticipants(
    room,
    participants,
  ).map<RoomSlot>((participant, index) => ({
    colorIndex: index + offset,
    isEmpty: false,
    isHost: participant.isHost,
    isMe:
      participant.id !== `${room.id}-host` &&
      participants.some(
        (candidate) =>
          candidate.id === participant.id && candidate.guestId === guestId,
      ),
    key: participant.id,
  }));

  const openSlots = Array.from(
    { length: Math.max(ROOM_SLOT_COUNT - participantSlots.length, 0) },
    (_, index) => ({
      colorIndex: participantSlots.length + index + offset,
      isEmpty: true,
      isHost: false,
      isMe: false,
      key: `${room.id}-open-${index}`,
    }),
  );

  return [...participantSlots, ...openSlots].slice(0, ROOM_SLOT_COUNT);
}

function getAvailabilityLabel(
  status: Room["status"],
  isFull: boolean,
  isJoinedRoom: boolean,
) {
  if (isJoinedRoom) {
    return "참여 중";
  }

  if (status !== "WAITING") {
    return "진행 중";
  }

  if (isFull) {
    return "가득 참";
  }

  return "참가 가능";
}

function getJoinButtonLabel(room: Room) {
  return room.isPublic ? "입장" : "코드 입력";
}

function getSlotLabel(slot: RoomSlot) {
  if (slot.isEmpty) {
    return "빈 자리";
  }

  if (slot.isMe) {
    return slot.isHost ? "내 호스트 자리" : "내 자리";
  }

  return slot.isHost ? "호스트 자리" : "참가자 자리";
}
