import { useEffect, useMemo, useRef, useState } from "react";
import type {
  GameConnectionStatus,
  GamePresenceParticipant,
  GamePresenceSnapshot,
  GameRealtimeErrorEvent,
  GameStartedEvent,
  JoinGameRoomRequest,
} from "@sketch-room/shared";
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
      socket.emit("game:leave", joinRequest);
      socket.disconnect();
    };
  }, [enabled, guestId, roomId]);

  const currentParticipants = useMemo(
    () =>
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
