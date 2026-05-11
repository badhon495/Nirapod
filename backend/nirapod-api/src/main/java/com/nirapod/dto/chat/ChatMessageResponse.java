package com.nirapod.dto.chat;

import com.nirapod.model.ChatMessage;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ChatMessageResponse(
        UUID id,
        UUID userId,
        String userName,
        String content,
        OffsetDateTime createdAt
) {
    public static ChatMessageResponse from(ChatMessage m) {
        return new ChatMessageResponse(
                m.getId(),
                m.getUser().getId(),
                m.getUser().getName(),
                m.getContent(),
                m.getCreatedAt()
        );
    }
}
