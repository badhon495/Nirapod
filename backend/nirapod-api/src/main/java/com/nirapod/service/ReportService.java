package com.nirapod.service;

import com.nirapod.dto.social.ReportRequest;
import com.nirapod.dto.social.ReportResponse;
import com.nirapod.exception.ApiException;
import com.nirapod.model.Complaint;
import com.nirapod.model.ComplaintReport;
import com.nirapod.model.User;
import com.nirapod.repository.ComplaintReportRepository;
import com.nirapod.repository.ComplaintRepository;
import com.nirapod.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ComplaintReportRepository reportRepository;
    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional
    public void report(UUID complaintId, UUID reporterId, ReportRequest req, String ipAddress) {
        if (reportRepository.existsByComplaintIdAndReporterId(complaintId, reporterId)) {
            throw ApiException.conflict("You have already reported this complaint");
        }

        Complaint complaint = complaintRepository.findById(complaintId)
            .orElseThrow(() -> ApiException.notFound("Complaint not found"));

        if (complaint.getUser().getId().equals(reporterId)) {
            throw ApiException.badRequest("Cannot report your own complaint");
        }

        User reporter = userRepository.findById(reporterId)
            .orElseThrow(() -> ApiException.notFound("User not found"));

        ComplaintReport report = new ComplaintReport();
        report.setComplaint(complaint);
        report.setReporter(reporter);
        report.setReason(req.reason());
        reportRepository.save(report);

        auditService.log(reporterId, "COMPLAINT_REPORTED", "COMPLAINT", complaintId, ipAddress, null, null);
    }

    @Transactional(readOnly = true)
    public Page<ReportResponse> getAllReports(Pageable pageable) {
        return reportRepository.findAllWithDetails(pageable).map(ReportResponse::from);
    }

    @Transactional
    public void deleteReport(UUID reportId, String ipAddress, UUID adminId) {
        ComplaintReport report = reportRepository.findById(reportId)
            .orElseThrow(() -> ApiException.notFound("Report not found"));
        auditService.log(adminId, "REPORT_DISMISSED", "COMPLAINT_REPORT", reportId, ipAddress, null, null);
        reportRepository.delete(report);
    }
}
