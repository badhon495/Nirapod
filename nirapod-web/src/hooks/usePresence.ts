"use client";

import { useState } from "react";
import { useWebSocket } from "./useWebSocket";

interface PresencePayload {
  onlineCount: number;
}

export function usePresence() {
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  useWebSocket<PresencePayload>("/topic/presence", (payload) => {
    setOnlineCount(payload.onlineCount);
  });

  return onlineCount;
}
