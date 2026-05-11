"use client";

import { useEffect, useRef } from "react";
import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getSession } from "next-auth/react";

const WS_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080") + "/ws";

type MessageHandler<T> = (payload: T) => void;

interface SharedClient {
  client: Client;
  refCount: number;
}

let shared: SharedClient | null = null;
const pendingSubscribers: Array<() => void> = [];

function flushPendingSubscribers() {
  while (pendingSubscribers.length > 0) {
    pendingSubscribers.shift()!();
  }
}

async function acquireClient(): Promise<Client> {
  if (shared?.client.active) {
    shared.refCount++;
    return shared.client;
  }

  const session = await getSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  if (!token) throw new Error("No access token");

  if (shared?.client.active === false && shared.refCount > 0) {
    // client exists but reconnecting — reuse, just bump refCount
    shared.refCount++;
    return shared.client;
  }

  const client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
    onConnect: () => {
      flushPendingSubscribers();
    },
    onStompError: (frame) => {
      console.error("STOMP error", frame.headers["message"]);
    },
  });

  shared = { client, refCount: 1 };
  client.activate();
  return client;
}

function releaseClient() {
  if (!shared) return;
  shared.refCount--;
  if (shared.refCount <= 0) {
    shared.client.deactivate();
    shared = null;
  }
}

export function useWebSocket<T>(
  destination: string | null,
  onMessage: MessageHandler<T>
) {
  const subRef = useRef<StompSubscription | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!destination) return;

    let cancelled = false;
    let acquired = false;

    const subscribe = (client: Client) => {
      if (cancelled || subRef.current) return;
      subRef.current = client.subscribe(destination, (msg: IMessage) => {
        try {
          onMessageRef.current(JSON.parse(msg.body) as T);
        } catch {
          // malformed message — skip
        }
      });
    };

    acquireClient()
      .then((client) => {
        if (cancelled) {
          releaseClient();
          return;
        }
        acquired = true;

        if (client.connected) {
          subscribe(client);
        } else {
          // queue for when onConnect fires (handles both initial connect and reconnect)
          pendingSubscribers.push(() => {
            if (!cancelled) subscribe(client);
          });
        }
      })
      .catch(() => {
        // no token or client failed — silent, will retry on next render
      });

    return () => {
      cancelled = true;
      subRef.current?.unsubscribe();
      subRef.current = null;
      if (acquired) releaseClient();
    };
  }, [destination]);
}
