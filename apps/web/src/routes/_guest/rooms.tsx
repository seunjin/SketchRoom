import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Loader2,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Unlock,
} from "lucide-react";
import {
  createRoom,
  getRoom,
  getRooms,
  roomKeys,
  updateRoom,
  type CreateRoomRequest,
  type Room,
  type UpdateRoomRequest,
} from "../../features/room";
import { getApiErrorResponse } from "../../shared/api";

export const Route = createFileRoute("/_guest/rooms")({
  component: RoomsPage,
});

type Visibility = "public" | "private";
const EMPTY_ROOMS: Room[] = [];

function RoomsPage() {
  const { guestId } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [createTitle, setCreateTitle] = useState("");
  const [createVisibility, setCreateVisibility] =
    useState<Visibility>("public");
  const [createPassword, setCreatePassword] = useState("");

  const roomsQuery = useQuery({
    queryKey: roomKeys.list(),
    queryFn: getRooms,
  });

  const selectedRoomQuery = useQuery({
    queryKey: selectedRoomId
      ? roomKeys.detail(selectedRoomId)
      : roomKeys.details(),
    queryFn: () => getRoom(selectedRoomId!),
    enabled: Boolean(selectedRoomId),
    retry: false,
  });

  const selectedRoom = selectedRoomQuery.data;

  const createMutation = useMutation({
    mutationFn: (request: CreateRoomRequest) => createRoom(request, guestId),
    onSuccess: (room) => {
      queryClient.setQueryData(roomKeys.detail(room.id), room);
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
      setSelectedRoomId(room.id);
      setCreateTitle("");
      setCreateVisibility("public");
      setCreatePassword("");
    },
  });

  const createError = getApiErrorResponse(createMutation.error);
  const selectedRoomError = getApiErrorResponse(selectedRoomQuery.error);
  const roomsError = getApiErrorResponse(roomsQuery.error);
  const trimmedCreateTitle = createTitle.trim();
  const trimmedCreatePassword = createPassword.trim();
  const isCreatePrivate = createVisibility === "private";
  const canCreateRoom =
    trimmedCreateTitle.length > 0 &&
    (!isCreatePrivate || trimmedCreatePassword.length > 0) &&
    !createMutation.isPending;
  const rooms = roomsQuery.data ?? EMPTY_ROOMS;
  const selectedRoomFromList = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId),
    [rooms, selectedRoomId],
  );

  function handleCreateRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canCreateRoom) {
      return;
    }

    createMutation.mutate({
      title: trimmedCreateTitle,
      isPublic: createVisibility === "public",
      ...(isCreatePrivate ? { password: trimmedCreatePassword } : {}),
    });
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-primary">SketchRoom</p>
            <h1 className="text-3xl font-semibold">방 관리</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              현재 게스트 ID: {guestId}
            </p>
          </div>

          <button
            className="inline-flex h-10 w-fit items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
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
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
          <aside className="flex flex-col gap-4">
            <form
              className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4"
              onSubmit={handleCreateRoom}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">방 생성</h2>
                <span className="rounded-md bg-surface-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                  POST /rooms
                </span>
              </div>

              <label className="flex flex-col gap-2 text-sm font-medium">
                제목
                <input
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  maxLength={100}
                  onChange={(event) => setCreateTitle(event.target.value)}
                  placeholder="예: 주말 낙서방"
                  type="text"
                  value={createTitle}
                />
              </label>

              <VisibilityControl
                label="공개 여부"
                onChange={setCreateVisibility}
                value={createVisibility}
              />

              {isCreatePrivate && (
                <label className="flex flex-col gap-2 text-sm font-medium">
                  비밀번호
                  <input
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                    maxLength={8}
                    onChange={(event) => setCreatePassword(event.target.value)}
                    placeholder="최대 8자"
                    type="password"
                    value={createPassword}
                  />
                </label>
              )}

              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canCreateRoom}
                type="submit"
              >
                {createMutation.isPending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Plus aria-hidden="true" className="size-4" />
                )}
                생성
              </button>

              <StatusMessage
                message={
                  createMutation.isError
                    ? (createError?.message ?? "방을 생성하지 못했습니다.")
                    : createMutation.isSuccess
                      ? "방을 생성했습니다."
                      : ""
                }
                tone={createMutation.isError ? "danger" : "success"}
              />
            </form>

            <div className="rounded-md border border-border bg-surface">
              <div className="flex items-center justify-between gap-3 border-b border-border p-4">
                <h2 className="text-base font-semibold">방 목록</h2>
                <span className="rounded-md bg-surface-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                  GET /rooms
                </span>
              </div>

              <div className="max-h-[520px] overflow-y-auto p-2">
                {roomsQuery.isPending && (
                  <LoadingRow message="방 목록을 불러오는 중입니다." />
                )}

                {roomsQuery.isError && (
                  <p className="px-2 py-3 text-sm text-danger">
                    {roomsError?.message ?? "방 목록을 불러오지 못했습니다."}
                  </p>
                )}

                {roomsQuery.isSuccess && rooms.length === 0 && (
                  <p className="px-2 py-3 text-sm text-muted-foreground">
                    생성된 방이 없습니다.
                  </p>
                )}

                {rooms.map((room) => (
                  <RoomListItem
                    isSelected={room.id === selectedRoomId}
                    key={room.id}
                    onSelect={() => setSelectedRoomId(room.id)}
                    room={room}
                  />
                ))}
              </div>
            </div>
          </aside>

          <section className="flex min-h-[560px] flex-col rounded-md border border-border bg-surface">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">방 상세</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedRoomId
                    ? "GET /rooms/:id"
                    : "목록에서 방을 선택하세요."}
                </p>
              </div>

              {selectedRoom && (
                <div className="flex flex-wrap gap-2">
                  <RoomVisibilityBadge isPublic={selectedRoom.isPublic} />
                  <RoomStatusBadge status={selectedRoom.status} />
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-5 p-4">
              {!selectedRoomId && (
                <div className="grid flex-1 place-items-center rounded-md border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
                  방을 선택하면 상세 조회와 수정 요청을 확인할 수 있습니다.
                </div>
              )}

              {selectedRoomId && selectedRoomQuery.isPending && (
                <LoadingRow message="방 상세를 불러오는 중입니다." />
              )}

              {selectedRoomId && selectedRoomQuery.isError && (
                <p className="text-sm text-danger">
                  {selectedRoomError?.message ??
                    "방 상세를 불러오지 못했습니다."}
                </p>
              )}

              {selectedRoom && (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <DetailItem label="방 ID" value={selectedRoom.id} />
                    <DetailItem
                      label="목록 기준 제목"
                      value={selectedRoomFromList?.title ?? selectedRoom.title}
                    />
                    <DetailItem
                      label="호스트"
                      value={`${selectedRoom.hostNickname} (${selectedRoom.hostGuestId})`}
                    />
                    <DetailItem
                      label="최대 인원"
                      value={`${selectedRoom.maxParticipants}명`}
                    />
                    <DetailItem
                      label="생성 시각"
                      value={formatDateTime(selectedRoom.createdAt)}
                    />
                    <DetailItem
                      label="수정 시각"
                      value={formatDateTime(selectedRoom.updatedAt)}
                    />
                  </div>

                  <RoomUpdateForm
                    guestId={guestId}
                    key={selectedRoom.id}
                    room={selectedRoom}
                  />
                </>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function RoomUpdateForm({ guestId, room }: { guestId: string; room: Room }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(room.title);
  const [visibility, setVisibility] = useState<Visibility>(
    room.isPublic ? "public" : "private",
  );
  const [password, setPassword] = useState("");
  const updateMutation = useMutation({
    mutationFn: ({
      roomId,
      request,
    }: {
      roomId: string;
      request: UpdateRoomRequest;
    }) => updateRoom(roomId, request, guestId),
    onSuccess: (updatedRoom) => {
      queryClient.setQueryData(roomKeys.detail(updatedRoom.id), updatedRoom);
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
    },
  });
  const updateError = getApiErrorResponse(updateMutation.error);
  const trimmedTitle = title.trim();
  const trimmedPassword = password.trim();
  const isPrivate = visibility === "private";
  const isRoomHost = room.hostGuestId === guestId;
  const needsPassword =
    room.isPublic && isPrivate && trimmedPassword.length === 0;
  const canUpdateRoom =
    isRoomHost &&
    trimmedTitle.length > 0 &&
    !needsPassword &&
    !updateMutation.isPending;

  function handleUpdateRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canUpdateRoom) {
      return;
    }

    updateMutation.mutate({
      roomId: room.id,
      request: {
        title: trimmedTitle,
        isPublic: visibility === "public",
        ...(isPrivate && trimmedPassword.length > 0
          ? { password: trimmedPassword }
          : {}),
      },
    });
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-md border border-border bg-background p-4"
      onSubmit={handleUpdateRoom}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">방 수정</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            PATCH /rooms/:id
          </p>
        </div>
        {!isRoomHost && (
          <span className="rounded-md bg-surface-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            호스트만 수정 가능
          </span>
        )}
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium">
        제목
        <input
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-70"
          disabled={!isRoomHost}
          maxLength={100}
          onChange={(event) => setTitle(event.target.value)}
          type="text"
          value={title}
        />
      </label>

      <VisibilityControl
        disabled={!isRoomHost}
        label="공개 여부"
        onChange={setVisibility}
        value={visibility}
      />

      {isPrivate && (
        <label className="flex flex-col gap-2 text-sm font-medium">
          비밀번호
          <input
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-70"
            disabled={!isRoomHost}
            maxLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={
              room.isPublic ? "비공개 전환 시 필수" : "변경할 때만 입력"
            }
            type="password"
            value={password}
          />
        </label>
      )}

      <button
        className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canUpdateRoom}
        type="submit"
      >
        {updateMutation.isPending ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Pencil aria-hidden="true" className="size-4" />
        )}
        수정
      </button>

      <StatusMessage
        message={
          updateMutation.isError
            ? (updateError?.message ?? "방 정보를 수정하지 못했습니다.")
            : updateMutation.isSuccess
              ? "방 정보를 수정했습니다."
              : needsPassword
                ? "비공개 전환에는 비밀번호가 필요합니다."
                : ""
        }
        tone={
          updateMutation.isError || needsPassword ? "danger" : "success"
        }
      />
    </form>
  );
}

function VisibilityControl({
  disabled = false,
  label,
  onChange,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: Visibility) => void;
  value: Visibility;
}) {
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="text-sm font-medium">{label}</legend>
      <div className="grid grid-cols-2 rounded-md border border-border bg-background p-1">
        <button
          className={`inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium disabled:cursor-not-allowed ${
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
          className={`inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium disabled:cursor-not-allowed ${
            value === "private"
              ? "bg-room-private text-primary-foreground"
              : "text-muted-foreground hover:bg-surface-muted"
          }`}
          onClick={() => onChange("private")}
          type="button"
        >
          <Lock aria-hidden="true" className="size-4" />
          비공개
        </button>
      </div>
    </fieldset>
  );
}

function RoomListItem({
  isSelected,
  onSelect,
  room,
}: {
  isSelected: boolean;
  onSelect: () => void;
  room: Room;
}) {
  return (
    <button
      className={`mb-2 flex w-full flex-col gap-2 rounded-md border p-3 text-left text-sm transition ${
        isSelected
          ? "border-primary bg-surface-muted"
          : "border-transparent hover:border-border hover:bg-background"
      }`}
      onClick={onSelect}
      type="button"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0 font-medium">
          <span className="block truncate">{room.title}</span>
        </span>
        <RoomVisibilityBadge isPublic={room.isPublic} />
      </span>
      <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <RoomStatusBadge status={room.status} />
        <span>{room.hostNickname}</span>
        <span>{formatDateTime(room.createdAt)}</span>
      </span>
    </button>
  );
}

function RoomVisibilityBadge({ isPublic }: { isPublic: boolean }) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium ${
        isPublic
          ? "bg-room-public text-accent-foreground"
          : "bg-room-private text-primary-foreground"
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

function RoomStatusBadge({ status }: { status: Room["status"] }) {
  const classNameByStatus: Record<Room["status"], string> = {
    WAITING: "bg-room-waiting text-primary-foreground",
    PLAYING: "bg-room-playing text-foreground",
    CLOSED: "bg-room-closed text-primary-foreground",
  };
  const labelByStatus: Record<Room["status"], string> = {
    WAITING: "대기",
    PLAYING: "진행",
    CLOSED: "종료",
  };

  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center rounded-md px-2 text-xs font-medium ${classNameByStatus[status]}`}
    >
      {labelByStatus[status]}
    </span>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-background p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-sm font-medium">{value}</p>
    </div>
  );
}

function LoadingRow({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
      <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      {message}
    </div>
  );
}

function StatusMessage({
  message,
  tone,
}: {
  message: string;
  tone: "danger" | "success";
}) {
  return (
    <p
      className={`min-h-5 text-sm ${
        tone === "danger" ? "text-danger" : "text-accent"
      }`}
    >
      {message}
    </p>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
