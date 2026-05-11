package com.nirapod.dto.complaint;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AuthorityNoteRequest(

    @NotBlank(message = "Note cannot be blank")
    @Size(max = 2000)
    String note
) {}
