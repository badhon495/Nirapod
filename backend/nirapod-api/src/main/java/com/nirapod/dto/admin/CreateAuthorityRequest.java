package com.nirapod.dto.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateAuthorityRequest(
    @NotBlank @Size(min = 10, max = 10) String nid,
    @NotBlank @Email String email,
    @NotBlank @Pattern(regexp = "^\\+?[0-9]{10,15}$") String phone,
    @NotBlank String name,
    @NotBlank @Pattern(regexp = "POLICE|FIRE|CITY|ANIMAL") String role,
    @NotBlank @Size(min = 8) String password,
    @NotBlank String presentAddress,
    @NotBlank String permanentAddress
) {}
