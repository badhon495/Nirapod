package com.nirapod.dto.auth;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SignupRequest {

    @NotBlank
    @Size(min = 10, max = 10, message = "NID must be exactly 10 digits")
    @Pattern(regexp = "\\d{10}", message = "NID must be numeric")
    private String nid;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Pattern(regexp = "^01[3-9]\\d{8}$", message = "Invalid Bangladeshi phone number")
    private String phone;

    @NotBlank
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank
    private String name;

    @NotBlank
    private String presentAddress;

    @NotBlank
    private String permanentAddress;
}
