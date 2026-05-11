package com.nirapod.controller;

import com.nirapod.dto.chat.ChatMessageRequest;
import com.nirapod.dto.chat.ChatMessageResponse;
import com.nirapod.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@Controller
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/history")
    @ResponseBody
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ChatMessageResponse>> history(
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(chatService.getHistory(limit));
    }

    @MessageMapping("/chat.send")
    public void sendMessage(@Valid @Payload ChatMessageRequest request, Principal principal) {
        UUID userId = UUID.fromString(principal.getName());
        ChatMessageResponse response = chatService.save(userId, request.content());
        messagingTemplate.convertAndSend("/topic/livechat", response);
    }
}
