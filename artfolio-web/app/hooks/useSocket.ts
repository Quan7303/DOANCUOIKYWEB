"use client";

import { useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getSocketUrl } from "../utils/apiConfig";

type UseSocketOptions = {
  userId?: string;
  portfolioId?: string;
  enabled?: boolean;
};

let socketInstance: Socket | null = null;

export function getSocket() {
  if (typeof window === "undefined") return null;

  if (!socketInstance) {
    socketInstance = io(getSocketUrl(), {
      autoConnect: false,
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }

  return socketInstance;
}

export function useSocket({
  userId,
  portfolioId,
  enabled = true,
}: UseSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);

  const socket = useMemo(() => getSocket(), []);

  useEffect(() => {
    if (!socket || !enabled) return;

    function handleConnect() {
      setIsConnected(true);

      if (userId) {
        socket?.emit("join_room", userId);
      }

      if (portfolioId) {
        socket?.emit("join_portfolio", portfolioId);
      }
    }

    function handleDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);

      if (portfolioId) {
        socket.emit("leave_portfolio", portfolioId);
      }
    };
  }, [socket, userId, portfolioId, enabled]);

  return {
    socket,
    isConnected,
  };
}
