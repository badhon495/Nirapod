package com.nirapod.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nirapod.dto.auth.LoginRequest;
import com.nirapod.dto.auth.SignupRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIT extends AbstractIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void login_missingEmail_returns400() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setPassword("somepassword");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_invalidEmail_returns400() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail("not-an-email");
        req.setPassword("somepassword");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_unknownUser_returns401() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail("nobody@example.com");
        req.setPassword("wrongpassword");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void signup_invalidNid_returns400() throws Exception {
        SignupRequest req = buildSignupRequest();
        req.setNid("123"); // too short

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void signup_invalidPhone_returns400() throws Exception {
        SignupRequest req = buildSignupRequest();
        req.setPhone("12345"); // not a valid BD phone

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void signup_shortPassword_returns400() throws Exception {
        SignupRequest req = buildSignupRequest();
        req.setPassword("short"); // < 8 chars

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void refresh_noCookie_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/refresh"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void sendOtp_invalidEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/send-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"bad\"}"))
                .andExpect(status().isBadRequest());
    }

    private SignupRequest buildSignupRequest() {
        SignupRequest req = new SignupRequest();
        req.setNid("1234567890");
        req.setEmail("test@example.com");
        req.setPhone("01712345678");
        req.setPassword("validpassword");
        req.setName("Test User");
        req.setPresentAddress("Dhaka, Bangladesh");
        req.setPermanentAddress("Dhaka, Bangladesh");
        return req;
    }
}
