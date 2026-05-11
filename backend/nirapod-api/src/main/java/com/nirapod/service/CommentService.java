package com.nirapod.service;

import com.nirapod.dto.comment.CommentCreateRequest;
import com.nirapod.dto.comment.CommentResponse;
import com.nirapod.exception.ApiException;
import com.nirapod.model.*;
import com.nirapod.repository.*;
import lombok.RequiredArgsConstructor;
import org.owasp.html.PolicyFactory;
import org.owasp.html.Sanitizers;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentService {

    private static final PolicyFactory HTML_POLICY = Sanitizers.FORMATTING;

    private final CommentRepository commentRepository;
    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<CommentResponse> getComments(UUID complaintId, Pageable pageable) {
        if (!complaintRepository.existsById(complaintId)) {
            throw ApiException.notFound("Complaint not found");
        }
        return commentRepository.findByComplaintId(complaintId, pageable).map(CommentResponse::from);
    }

    @Transactional
    public CommentResponse create(UUID complaintId, UUID userId, CommentCreateRequest req, String ipAddress) {
        Complaint complaint = complaintRepository.findByIdWithUser(complaintId)
            .orElseThrow(() -> ApiException.notFound("Complaint not found"));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));

        Comment comment = new Comment();
        comment.setComplaint(complaint);
        comment.setUser(user);
        comment.setContent(HTML_POLICY.sanitize(req.content()));

        Comment saved = commentRepository.save(comment);

        notificationService.notifyNewComment(complaint, user);
        auditService.log(userId, "COMMENT_CREATED", "COMMENT", saved.getId(), ipAddress, null, null);

        return CommentResponse.from(saved);
    }

    @Transactional
    public CommentResponse update(UUID commentId, UUID userId, CommentCreateRequest req, String ipAddress) {
        Comment comment = commentRepository.findByIdWithUser(commentId)
            .orElseThrow(() -> ApiException.notFound("Comment not found"));

        if (!comment.getUser().getId().equals(userId)) {
            throw ApiException.forbidden("Not authorized to edit this comment");
        }

        comment.setContent(HTML_POLICY.sanitize(req.content()));
        auditService.log(userId, "COMMENT_UPDATED", "COMMENT", commentId, ipAddress, null, null);
        return CommentResponse.from(commentRepository.save(comment));
    }

    @Transactional
    public void delete(UUID commentId, UUID userId, UserRole role, String ipAddress) {
        Comment comment = commentRepository.findByIdWithUser(commentId)
            .orElseThrow(() -> ApiException.notFound("Comment not found"));

        boolean isOwner = comment.getUser().getId().equals(userId);
        boolean isAdmin = role == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw ApiException.forbidden("Not authorized to delete this comment");
        }

        auditService.log(userId, "COMMENT_DELETED", "COMMENT", commentId, ipAddress, null, null);
        commentRepository.delete(comment);
    }
}
