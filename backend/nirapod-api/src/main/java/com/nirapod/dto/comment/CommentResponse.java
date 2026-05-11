package com.nirapod.dto.comment;

import com.nirapod.model.Comment;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CommentResponse(
    UUID id,
    UUID userId,
    String userName,
    String content,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
    public static CommentResponse from(Comment c) {
        return new CommentResponse(
            c.getId(),
            c.getUser().getId(),
            c.getUser().getName(),
            c.getContent(),
            c.getCreatedAt(),
            c.getUpdatedAt()
        );
    }
}
