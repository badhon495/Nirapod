package com.nirapod.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class PresenceService {

    private final SimpMessagingTemplate messagingTemplate;

    private final Set<String> onlineUserIds = Collections.newSetFromMap(new ConcurrentHashMap<>());

    @EventListener
    public void handleConnect(SessionConnectedEvent event) {
        Principal user = event.getUser();
        if (user == null) return;
        onlineUserIds.add(user.getName());
        broadcast();
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal user = accessor.getUser();
        if (user == null) return;
        onlineUserIds.remove(user.getName());
        broadcast();
    }

    public int getOnlineCount() {
        return onlineUserIds.size();
    }

    private void broadcast() {
        messagingTemplate.convertAndSend(
                "/topic/presence",
                Map.of("onlineCount", onlineUserIds.size())
        );
    }
}
