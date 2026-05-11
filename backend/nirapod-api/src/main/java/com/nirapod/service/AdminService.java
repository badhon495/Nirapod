package com.nirapod.service;

import com.nirapod.dto.admin.*;
import com.nirapod.dto.social.ReportResponse;
import com.nirapod.exception.ApiException;
import com.nirapod.model.*;
import com.nirapod.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ComplaintRepository complaintRepository;
    private final AuditLogRepository auditLogRepository;
    private final ComplaintReportRepository reportRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> listUsers(UserRole role, UserStatus status, Pageable pageable) {
        Page<User> page;
        if (role != null && status != null) {
            page = userRepository.findByRoleAndStatus(role, status, pageable);
        } else if (role != null) {
            page = userRepository.findByRole(role, pageable);
        } else if (status != null) {
            page = userRepository.findByStatus(status, pageable);
        } else {
            page = userRepository.findAll(pageable);
        }
        return page.map(AdminUserResponse::from);
    }

    @Transactional(readOnly = true)
    public AdminUserResponse getUser(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));
        return AdminUserResponse.from(user);
    }

    @Transactional
    public AdminUserResponse approveUser(UUID targetId, UUID adminId, String ipAddress) {
        User user = userRepository.findById(targetId)
            .orElseThrow(() -> ApiException.notFound("User not found"));
        if (user.getStatus() == UserStatus.ACTIVE) {
            throw ApiException.badRequest("User is already active");
        }
        user.setStatus(UserStatus.ACTIVE);
        auditService.log(adminId, "USER_APPROVED", "USER", targetId, ipAddress, null, null);
        return AdminUserResponse.from(userRepository.save(user));
    }

    @Transactional
    public AdminUserResponse suspendUser(UUID targetId, UUID adminId, String ipAddress) {
        User user = userRepository.findById(targetId)
            .orElseThrow(() -> ApiException.notFound("User not found"));
        if (user.getRole() == UserRole.ADMIN) {
            throw ApiException.badRequest("Cannot suspend another admin");
        }
        user.setStatus(UserStatus.SUSPENDED);
        auditService.log(adminId, "USER_SUSPENDED", "USER", targetId, ipAddress, null, null);
        return AdminUserResponse.from(userRepository.save(user));
    }

    @Transactional
    public AdminUserResponse createAuthorityUser(CreateAuthorityRequest req, UUID adminId, String ipAddress) {
        if (userRepository.existsByEmail(req.email())) {
            throw ApiException.conflict("Email already in use");
        }
        if (userRepository.existsByNid(req.nid())) {
            throw ApiException.conflict("NID already in use");
        }
        if (userRepository.existsByPhone(req.phone())) {
            throw ApiException.conflict("Phone already in use");
        }

        User user = User.builder()
            .nid(req.nid())
            .email(req.email())
            .phone(req.phone())
            .name(req.name())
            .role(UserRole.valueOf(req.role()))
            .status(UserStatus.ACTIVE)
            .passwordHash(passwordEncoder.encode(req.password()))
            .presentAddress(req.presentAddress())
            .permanentAddress(req.permanentAddress())
            .build();

        User saved = userRepository.save(user);
        auditService.log(adminId, "AUTHORITY_USER_CREATED", "USER", saved.getId(), ipAddress, null, null);
        return AdminUserResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        long total = complaintRepository.count();
        long unsolved = complaintRepository.countByStatus(ComplaintStatus.UNSOLVED);
        long inProgress = complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS);
        long solved = complaintRepository.countByStatus(ComplaintStatus.SOLVED);

        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);
        long pendingUsers = userRepository.countByStatus(UserStatus.PENDING);
        long suspendedUsers = userRepository.countByStatus(UserStatus.SUSPENDED);

        Map<String, Long> byCategory = complaintRepository.countGroupByCategory().stream()
            .collect(Collectors.toMap(
                row -> ((Enum<?>) row[0]).name(),
                row -> (Long) row[1]
            ));

        Map<String, Long> byDistrict = complaintRepository.countGroupByDistrict().stream()
            .limit(10)
            .collect(Collectors.toMap(
                row -> (String) row[0],
                row -> (Long) row[1],
                (a, b) -> a,
                LinkedHashMap::new
            ));

        return new AdminStatsResponse(
            total, unsolved, inProgress, solved,
            totalUsers, activeUsers, pendingUsers, suspendedUsers,
            byCategory, byDistrict
        );
    }

    @Transactional(readOnly = true)
    public List<AnalyticsDataPoint> getAnalytics(OffsetDateTime from, OffsetDateTime to) {
        return complaintRepository.analyticsGroupByDistrictAndCategory(from, to).stream()
            .map(row -> new AnalyticsDataPoint(
                (String) row[0],
                ((Enum<?>) row[1]).name(),
                (Long) row[2]
            ))
            .toList();
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLog(UUID userId, String action, Pageable pageable) {
        if (userId != null && action != null) {
            return auditLogRepository.findByUserIdAndActionWithUser(userId, action, pageable)
                .map(AuditLogResponse::from);
        } else if (userId != null) {
            return auditLogRepository.findByUserIdWithUser(userId, pageable)
                .map(AuditLogResponse::from);
        } else if (action != null) {
            return auditLogRepository.findByActionWithUser(action, pageable)
                .map(AuditLogResponse::from);
        }
        return auditLogRepository.findAllWithUser(pageable).map(AuditLogResponse::from);
    }

    @Transactional(readOnly = true)
    public AdminUserResponse investigateByNid(String nid) {
        User user = userRepository.findByNidWithDocuments(nid)
            .orElseThrow(() -> ApiException.notFound("No user found with that NID"));
        return AdminUserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public AdminUserResponse investigateByDocumentNumber(String documentNumber) {
        User user = userRepository.findByDocumentNumber(documentNumber)
            .orElseThrow(() -> ApiException.notFound("No user found with that document number"));
        return AdminUserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public Page<ReportResponse> listReports(Pageable pageable) {
        return reportRepository.findAllWithDetails(pageable).map(ReportResponse::from);
    }

    @Transactional
    public void dismissReport(UUID reportId, UUID adminId, String ipAddress) {
        if (!reportRepository.existsById(reportId)) {
            throw ApiException.notFound("Report not found");
        }
        reportRepository.deleteById(reportId);
        auditService.log(adminId, "REPORT_DISMISSED", "COMPLAINT_REPORT", reportId, ipAddress, null, null);
    }
}
