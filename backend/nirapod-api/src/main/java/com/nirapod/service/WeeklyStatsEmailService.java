package com.nirapod.service;

import com.nirapod.dto.admin.AdminStatsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class WeeklyStatsEmailService {

    private final AdminService adminService;
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.admin.email:${MAIL_USERNAME:}}")
    private String adminEmail;

    @Scheduled(cron = "0 0 8 * * MON")
    public void sendWeeklyStats() {
        if (adminEmail == null || adminEmail.isBlank()) {
            log.warn("Weekly stats email skipped: app.admin.email not configured");
            return;
        }
        try {
            AdminStatsResponse stats = adminService.getStats();
            OffsetDateTime now = OffsetDateTime.now();

            Context ctx = new Context();
            ctx.setVariable("stats", stats);
            ctx.setVariable("weekLabel", "Week of " + now.minusDays(7).format(DateTimeFormatter.ISO_LOCAL_DATE));
            ctx.setVariable("generatedAt", now.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));

            String html = templateEngine.process("weekly-stats", ctx);

            mailSender.send(msg -> {
                MimeMessageHelper helper = new MimeMessageHelper(msg, false, "UTF-8");
                helper.setTo(adminEmail);
                helper.setSubject("Nirapod Weekly Report — " + now.format(DateTimeFormatter.ISO_LOCAL_DATE));
                helper.setText(html, true);
            });

            log.info("Weekly stats email sent to {}", adminEmail);
        } catch (Exception e) {
            log.error("Failed to send weekly stats email: {}", e.getMessage());
        }
    }
}
