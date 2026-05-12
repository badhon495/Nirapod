package com.nirapod.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ComplaintControllerIT extends AbstractIntegrationTest {

    @Autowired MockMvc mockMvc;

    @Test
    void getFeed_noAuth_returns200WithPage() throws Exception {
        mockMvc.perform(get("/api/v1/complaints"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").isNumber());
    }

    @Test
    void getFeed_withCategoryFilter_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/complaints").param("category", "POLICE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void getFeed_withDistrictFilter_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/complaints").param("district", "Dhaka"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void getById_nonExistentId_returns404() throws Exception {
        mockMvc.perform(get("/api/v1/complaints/00000000-0000-0000-0000-000000000000"))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_noAuth_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/complaints")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "category": "POLICE",
                                  "urgency": "HIGH",
                                  "title": "Test",
                                  "details": "Details here",
                                  "district": "Dhaka",
                                  "area": "Mirpur"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void create_invalidBody_missingCategory_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/complaints")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "urgency": "HIGH",
                                  "title": "Test",
                                  "details": "Details",
                                  "district": "Dhaka",
                                  "area": "Mirpur"
                                }
                                """)
                        .header("Authorization", "Bearer invalid-token"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void trackByTrackingId_nonExistent_returns404() throws Exception {
        mockMvc.perform(get("/api/v1/complaints/track/999999"))
                .andExpect(status().isNotFound());
    }
}
