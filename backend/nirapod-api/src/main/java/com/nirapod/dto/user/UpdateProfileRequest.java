package com.nirapod.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @NotBlank @Size(max = 255)
    String name,

    @NotBlank @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Invalid phone number")
    String phone,

    @NotBlank @Size(max = 500)
    String presentAddress,

    @NotBlank @Size(max = 500)
    String permanentAddress
) {}
