package com.nirapod.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminControllerIT extends AbstractIntegrationTest {

    @Autowired MockMvc mockMvc;

    @Test
    void listUsers_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getStats_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/stats"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getAuditLog_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getAnalytics_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/analytics")
                        .param("from", "2026-01-01T00:00:00Z")
                        .param("to", "2026-12-31T23:59:59Z"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void investigateByNid_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/investigate/nid/1234567890"))
                .andExpect(status().isUnauthorized());
    }
}
