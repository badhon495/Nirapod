package com.nirapod.dto.comment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentCreateRequest(
    @NotBlank(message = "Content must not be blank")
    @Size(max = 2000, message = "Comment must not exceed 2000 characters")
    String content
) {}
