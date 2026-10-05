import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";

const API_URL =
  import.meta.env.VITE_BACKEND_DOMAIN ||
  "http://localhost:8080";

export const useChessSocket = (
  enabled = false
) => {
  const socketRef = useRef(null);

  const [connected, setConnected] =
    useState(false);

  const [connectionError, setConnectionError] =
    useState("");

  useEffect(() => {
    if (!enabled) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const socket = io(API_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setConnectionError("");
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connect_error", (error) => {
      setConnectionError(
        error.message || "Connection failed"
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled]);

  const emit = useCallback(
    (event, data) => {
      if (!socketRef.current) return;

      socketRef.current.emit(
        event,
        data
      );
    },
    []
  );

  const on = useCallback(
    (event, callback) => {
      const socket = socketRef.current;

      if (!socket) return () => {};

      socket.on(event, callback);

      return () => {
        socket.off(event, callback);
      };
    },
    []
  );

  return {
    socket: socketRef.current,
    connected,
    connectionError,
    emit,
    on,
  };
};