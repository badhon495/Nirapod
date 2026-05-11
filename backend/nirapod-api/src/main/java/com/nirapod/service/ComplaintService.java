package com.nirapod.service;

import com.nirapod.dto.complaint.*;
import com.nirapod.exception.ApiException;
import com.nirapod.model.*;
import com.nirapod.repository.*;
import lombok.RequiredArgsConstructor;
import org.owasp.html.PolicyFactory;
import org.owasp.html.Sanitizers;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private static final PolicyFactory HTML_POLICY = Sanitizers.FORMATTING.and(Sanitizers.LINKS);

    private final ComplaintRepository complaintRepository;
    private final ComplaintPhotoRepository photoRepository;
    private final ComplaintFollowRepository followRepository;
    private final ComplaintStatusHistoryRepository statusHistoryRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional
    @CacheEvict(value = "complaints", allEntries = true)
    public ComplaintDetailResponse create(UUID userId, ComplaintCreateRequest req, String ipAddress) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw ApiException.forbidden("Account must be active to submit complaints");
        }

        Complaint complaint = new Complaint();
        complaint.setUser(user);
        complaint.setCategory(req.category());
        complaint.setUrgency(req.urgency());
        complaint.setTitle(req.title());
        complaint.setDetails(HTML_POLICY.sanitize(req.details()));
        complaint.setDistrict(req.district());
        complaint.setArea(req.area());
        complaint.setLocationLat(req.locationLat());
        complaint.setLocationLng(req.locationLng());
        complaint.setLocationText(req.locationText());
        complaint.setPublic(req.isPublic());

        if (req.tags() != null) {
            complaint.getTags().addAll(req.tags());
        }

        Complaint saved = complaintRepository.save(complaint);

        if (req.photoPublicIds() != null) {
            for (String publicId : req.photoPublicIds()) {
                ComplaintPhoto photo = new ComplaintPhoto();
                photo.setComplaint(saved);
                photo.setFilePublicId(publicId);
                photo.setUploadedBy(user);
                photoRepository.save(photo);
            }
        }

        auditService.log(userId, "COMPLAINT_CREATED", "COMPLAINT", saved.getId(), ipAddress, null, null);
        return ComplaintDetailResponse.from(complaintRepository.findByIdWithUser(saved.getId()).orElseThrow());
    }

    @Cacheable(value = "complaints", key = "#category + '-' + #status + '-' + #district + '-' + #pageable.pageNumber")
    @Transactional(readOnly = true)
    public Page<ComplaintSummaryResponse> getFeed(ComplaintCategory category, ComplaintStatus status,
                                                    String district, Pageable pageable) {
        Page<Complaint> page;
        if (category != null && status != null) {
            page = complaintRepository.findAllPublicByCategoryAndStatus(category, status, pageable);
        } else if (category != null) {
            page = complaintRepository.findAllPublicByCategory(category, pageable);
        } else if (status != null) {
            page = complaintRepository.findAllPublicByStatus(status, pageable);
        } else if (district != null && !district.isBlank()) {
            page = complaintRepository.findAllPublicByDistrict(district, pageable);
        } else {
            page = complaintRepository.findAllPublic(pageable);
        }
        return page.map(ComplaintSummaryResponse::from);
    }

    // Authority feed — sees all in their category, not just public
    @Transactional(readOnly = true)
    public Page<ComplaintSummaryResponse> getAuthorityFeed(ComplaintCategory category, ComplaintStatus status,
                                                             Pageable pageable) {
        Page<Complaint> page;
        if (status != null) {
            page = complaintRepository.findAllByCategoryAndStatus(category, status, pageable);
        } else {
            page = complaintRepository.findAllByCategory(category, pageable);
        }
        return page.map(ComplaintSummaryResponse::from);
    }

    @Transactional(readOnly = true)
    public ComplaintDetailResponse getById(UUID id, UUID requesterId, UserRole requesterRole) {
        Complaint complaint = complaintRepository.findByIdWithUser(id)
            .orElseThrow(() -> ApiException.notFound("Complaint not found"));

        enforceReadAccess(complaint, requesterId, requesterRole);
        return ComplaintDetailResponse.from(complaint);
    }

    @Transactional(readOnly = true)
    public ComplaintDetailResponse getByTrackingId(Long trackingId) {
        Complaint complaint = complaintRepository.findByTrackingIdPublic(trackingId)
            .orElseThrow(() -> ApiException.notFound("Complaint not found"));
        return ComplaintDetailResponse.from(complaint);
    }

    @Transactional(readOnly = true)
    public Page<ComplaintSummaryResponse> getByUser(UUID userId, Pageable pageable) {
        return complaintRepository.findByUserId(userId, pageable).map(ComplaintSummaryResponse::from);
    }

    @Transactional
    @CacheEvict(value = "complaints", allEntries = true)
    public ComplaintDetailResponse updateStatus(UUID complaintId, UUID updaterId, UserRole updaterRole,
                                                 StatusUpdateRequest req, String ipAddress) {
        Complaint complaint = complaintRepository.findByIdWithUser(complaintId)
            .orElseThrow(() -> ApiException.notFound("Complaint not found"));

        enforceWriteAccess(complaint, updaterId, updaterRole);

        User updater = userRepository.findById(updaterId).orElseThrow();
        ComplaintStatus oldStatus = complaint.getStatus();

        complaint.setStatus(req.status());
        if (req.status() == ComplaintStatus.SOLVED) {
            complaint.setResolvedAt(OffsetDateTime.now());
        }

        ComplaintStatusHistory history = new ComplaintStatusHistory();
        history.setComplaint(complaint);
        history.setChangedBy(updater);
        history.setOldStatus(oldStatus);
        history.setNewStatus(req.status());
        history.setNote(req.note());
        statusHistoryRepository.save(history);

        auditService.log(updaterId, "COMPLAINT_STATUS_UPDATED", "COMPLAINT", complaintId, ipAddress, null, null);
        return ComplaintDetailResponse.from(complaintRepository.save(complaint));
    }

    @Transactional
    @CacheEvict(value = "complaints", allEntries = true)
    public ComplaintDetailResponse updateNote(UUID complaintId, UUID updaterId, UserRole updaterRole,
                                               AuthorityNoteRequest req, String ipAddress) {
        Complaint complaint = complaintRepository.findByIdWithUser(complaintId)
            .orElseThrow(() -> ApiException.notFound("Complaint not found"));

        enforceWriteAccess(complaint, updaterId, updaterRole);
        complaint.setAuthorityNote(req.note());

        auditService.log(updaterId, "COMPLAINT_NOTE_UPDATED", "COMPLAINT", complaintId, ipAddress, null, null);
        return ComplaintDetailResponse.from(complaintRepository.save(complaint));
    }

    @Transactional
    @CacheEvict(value = "complaints", allEntries = true)
    public void delete(UUID complaintId, UUID deleterId, UserRole deleterRole, String ipAddress) {
        Complaint complaint = complaintRepository.findByIdWithUser(complaintId)
            .orElseThrow(() -> ApiException.notFound("Complaint not found"));

        boolean isOwner = complaint.getUser().getId().equals(deleterId);
        boolean isAdmin = deleterRole == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw ApiException.forbidden("Not authorized to delete this complaint");
        }

        // Only allow deletion if still unsolved (or if admin)
        if (!isAdmin && complaint.getStatus() != ComplaintStatus.UNSOLVED) {
            throw ApiException.badRequest("Cannot delete a complaint that is already in progress or solved");
        }

        auditService.log(deleterId, "COMPLAINT_DELETED", "COMPLAINT", complaintId, ipAddress, null, null);
        complaintRepository.delete(complaint);
    }

    private void enforceReadAccess(Complaint complaint, UUID requesterId, UserRole role) {
        if (complaint.isPublic()) return;
        if (role == UserRole.ADMIN) return;
        if (complaint.getUser().getId().equals(requesterId)) return;

        ComplaintCategory requesterCategory = roleToCategory(role);
        if (requesterCategory != null && requesterCategory == complaint.getCategory()) return;

        throw ApiException.forbidden("Not authorized to view this complaint");
    }

    private void enforceWriteAccess(Complaint complaint, UUID updaterId, UserRole role) {
        if (role == UserRole.ADMIN) return;

        ComplaintCategory requesterCategory = roleToCategory(role);
        if (requesterCategory != null && requesterCategory == complaint.getCategory()) return;

        throw ApiException.forbidden("Not authorized to update this complaint");
    }

    private ComplaintCategory roleToCategory(UserRole role) {
        return switch (role) {
            case POLICE -> ComplaintCategory.POLICE;
            case FIRE   -> ComplaintCategory.FIRE;
            case CITY   -> ComplaintCategory.CITY;
            case ANIMAL -> ComplaintCategory.ANIMAL;
            default     -> null;
        };
    }
}
