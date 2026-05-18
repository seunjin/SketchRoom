import { useEffect, useMemo, useRef, useState } from "react";
import type {
  GameConnectionStatus,
  GamePresenceParticipant,
  GamePresenceSnapshot,
  GameRealtimeErrorEvent,
  GameStartedEvent,
  JoinGameRoomRequest,
} from "@sketch-room/shared/game-realtime";
import { createGameSocket } from "./game-realtime.client";

const EMPTY_GAME_PRESENCE_PARTICIPANTS: GamePresenceParticipant[] = [];

interface UseGameRealtimeOptions {
  enabled?: boolean;
  guestId: string;
  onGameStarted?: (event: GameStartedEvent) => void;
  roomId: string;
}

export function useGameRealtime({
  enabled = true,
  guestId,
  onGameStarted,
  roomId,
}: UseGameRealtimeOptions) {
  const [status, setStatus] = useState<GameConnectionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [presence, setPresence] = useState<GamePresenceSnapshot | null>(null);
  const onGameStartedRef = useRef(onGameStarted);

  useEffect(() => {
    // socket handler는 오래 살아 있으므로 최신 callback만 ref로 갈아끼웁니다.
    onGameStartedRef.current = onGameStarted;
  }, [onGameStarted]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = createGameSocket();
    const joinRequest: JoinGameRoomRequest = {
      guestId,
      roomId,
    };

    socket.on("connect", () => {
      setStatus("connected");
      // 연결만으로는 서버가 이 socket의 방/참가자를 모릅니다.
      // connect 이후 game:join을 보내면 서버가 DB 검증 후 room에 붙입니다.
      socket.emit("game:join", joinRequest);
    });

    socket.on("disconnect", () => {
      setStatus("disconnected");
    });

    socket.on("connect_error", (error) => {
      setStatus("error");
      setErrorMessage(error.message);
    });

    socket.on("game:error", (error: GameRealtimeErrorEvent) => {
      setStatus("error");
      setErrorMessage(error.message);
    });

    socket.on("game:presence", (snapshot: GamePresenceSnapshot) => {
      setPresence(snapshot);
    });

    socket.on("game:started", (event: GameStartedEvent) => {
      onGameStartedRef.current?.(event);
    });

    socket.connect();

    return () => {
      // route 이동/unmount 때 presence에서 바로 빠지게 합니다.
      // leave가 못 가는 네트워크 단절은 서버 disconnect handler가 정리합니다.
      socket.emit("game:leave", joinRequest);
      socket.disconnect();
    };
  }, [enabled, guestId, roomId]);

  const currentParticipants = useMemo(
    () =>
      // 이전 방 snapshot이 다른 방 UI에 잠깐 섞이지 않도록 roomId를 확인합니다.
      enabled && presence?.roomId === roomId
        ? presence.participants
        : EMPTY_GAME_PRESENCE_PARTICIPANTS,
    [enabled, presence, roomId],
  );
  const currentStatus =
    enabled && status === "idle" ? "connecting" : enabled ? status : "idle";
  const currentErrorMessage = currentStatus === "error" ? errorMessage : "";

  const onlineGuestIds = useMemo(
    () =>
      new Set(
        currentParticipants.map((participant) => participant.guestId),
      ),
    [currentParticipants],
  );

  return {
    errorMessage: currentErrorMessage,
    onlineGuestIds,
    participants: currentParticipants,
    status: currentStatus,
  };
}
