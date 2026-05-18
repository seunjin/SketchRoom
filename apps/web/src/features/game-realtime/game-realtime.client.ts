import { io } from "socket.io-client";

function getSocketUrl() {
  const socketUrl = import.meta.env.VITE_SOCKET_URL?.trim();

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
    transports: ["websocket"],
  });
}
