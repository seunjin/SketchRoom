import { io } from "socket.io-client";

function getSocketUrl() {
  const socketUrl = import.meta.env.VITE_SOCKET_URL?.trim();

  // 배포에서 REST API와 socket 서버가 다를 수 있어 별도 env를 우선합니다.
  if (socketUrl) {
    return socketUrl;
  }

  const apiUrl = import.meta.env.VITE_API_URL?.trim();

  if (apiUrl?.startsWith("http")) {
    return new URL(apiUrl).origin;
  }

  if (import.meta.env.DEV) {
    return "http://localhost:3000";
  }

  return window.location.origin;
}

export function createGameSocket() {
  return io(getSocketUrl(), {
    autoConnect: false,
    // 첫 WebSocket 레이어에서는 연결 흐름을 명확히 보려고 websocket만 사용합니다.
    transports: ["websocket"],
  });
}
