package com.nirapod.controller;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/**
 * Base class for all controller integration tests.
 * Boots real PostgreSQL + Redis via Testcontainers and wires Spring properties.
 */
@Testcontainers
public abstract class AbstractIntegrationTest {

    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"))
                    .withDatabaseName("nirapod_test")
                    .withUsername("postgres")
                    .withPassword("postgres");

    @SuppressWarnings("resource")
    static final GenericContainer<?> REDIS =
            new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
                    .withExposedPorts(6379);

    static {
        POSTGRES.start();
        REDIS.start();
    }

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
        registry.add("spring.data.redis.url",
                () -> "redis://" + REDIS.getHost() + ":" + REDIS.getMappedPort(6379));
        registry.add("app.jwt.secret",
                () -> "integration-test-secret-min-32-chars-long-enough");
        registry.add("spring.mail.host", () -> "localhost");
        registry.add("spring.mail.port", () -> "25");
        registry.add("spring.mail.username", () -> "test@example.com");
        registry.add("spring.mail.password", () -> "test");
        registry.add("cloudinary.cloud-name", () -> "test");
        registry.add("cloudinary.api-key", () -> "test");
        registry.add("cloudinary.api-secret", () -> "test");
        registry.add("app.google.client-id", () -> "test");
        registry.add("app.cors.allowed-origins", () -> "http://localhost:3000");
    }
}
