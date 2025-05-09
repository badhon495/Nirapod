package com.nirapod.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ComplainRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Phone is required")
    private String phone;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Details are required")
    private String details;
}
