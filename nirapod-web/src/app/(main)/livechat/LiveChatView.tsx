"use client";

import { useEffect, useRef, useState, useCallback, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getSession } from "next-auth/react";
import { Send, Wifi, WifiOff, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import type { ChatMessage } from "@/types/chat";
import { formatDistanceToNow } from "date-fns";
import { usePresence } from "@/hooks/usePresence";

const WS_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080") + "/ws";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

export default function LiveChatView() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const clientRef = useRef<Client | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const onlineCount = usePresence();

  // Load history
  useEffect(() => {
    api
      .get<ChatMessage[]>("/api/v1/chat/history", { params: { limit: 50 } })
      .then(({ data }) => setMessages(data))
      .catch(() => {});
  }, []);

  // STOMP connection
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const s = await getSession();
      const token = (s as { accessToken?: string } | null)?.accessToken;
      if (!token || cancelled) return;

      const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        onConnect: () => {
          if (cancelled) return;
          setStatus("connected");
          client.subscribe("/topic/livechat", (msg: IMessage) => {
            try {
              const incoming: ChatMessage = JSON.parse(msg.body);
              setMessages((prev) => [...prev, incoming]);
            } catch {
              // skip malformed
            }
          });
        },
        onDisconnect: () => setStatus("disconnected"),
        onStompError: () => setStatus("disconnected"),
      });

      client.activate();
      clientRef.current = client;
    })();

    return () => {
      cancelled = true;
      clientRef.current?.deactivate();
      clientRef.current = null;
      setStatus("disconnected");
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const content = input.trim();
      if (!content || status !== "connected" || !clientRef.current) return;
      clientRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({ content }),
      });
      setInput("");
    },
    [input, status]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Live Chat</h1>
          {onlineCount !== null && (
            <span
              className="flex items-center gap-1 text-xs text-muted-foreground"
              aria-label={`${onlineCount} user${onlineCount !== 1 ? "s" : ""} online`}
            >
              <Users size={12} aria-hidden="true" />
              {onlineCount} online
            </span>
          )}
        </div>
        <span
          className="flex items-center gap-1.5 text-sm"
          aria-live="polite"
          aria-label={`Connection status: ${status}`}
        >
          {status === "connected" ? (
            <>
              <Wifi size={14} className="text-green-600" aria-hidden="true" />
              <span className="text-green-600">Connected</span>
            </>
          ) : status === "connecting" ? (
            <>
              <Wifi size={14} className="text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground">Connecting…</span>
            </>
          ) : (
            <>
              <WifiOff size={14} className="text-destructive" aria-hidden="true" />
              <span className="text-destructive">Disconnected</span>
            </>
          )}
        </span>
      </div>

      {/* Message list */}
      <div
        className="flex-1 overflow-y-auto border rounded-lg p-4 space-y-3 bg-muted/20"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            No messages yet. Start the conversation.
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.userId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}
              >
                {!isOwn && (
                  <span className="text-xs text-muted-foreground font-medium px-1">
                    {msg.userName}
                  </span>
                )}
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm break-words ${
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-background border"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[11px] text-muted-foreground px-1">
                  {formatDistanceToNow(new Date(msg.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={send}
        className="flex gap-2 mt-3"
        aria-label="Send a message"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            status === "connected" ? "Type a message…" : "Waiting for connection…"
          }
          disabled={status !== "connected"}
          maxLength={1000}
          aria-label="Message"
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || status !== "connected"}
          aria-label="Send message"
        >
          <Send size={16} aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
