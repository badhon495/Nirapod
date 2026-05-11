package com.nirapod.service;

import com.nirapod.dto.notification.NotificationResponse;
import com.nirapod.dto.notification.UnreadCountResponse;
import com.nirapod.exception.ApiException;
import com.nirapod.model.Complaint;
import com.nirapod.model.Notification;
import com.nirapod.model.User;
import com.nirapod.repository.NotificationRepository;
import com.nirapod.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserId(userId, pageable).map(NotificationResponse::from);
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(UUID userId) {
        return new UnreadCountResponse(notificationRepository.countByUserIdAndReadFalse(userId));
    }

    @Transactional
    public void markAllRead(UUID userId) {
        notificationRepository.markAllReadByUserId(userId);
    }

    @Transactional
    public void markRead(UUID notificationId, UUID userId) {
        Notification n = notificationRepository.findById(notificationId)
            .orElseThrow(() -> ApiException.notFound("Notification not found"));
        if (!n.getUser().getId().equals(userId)) {
            throw ApiException.forbidden("Not authorized");
        }
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Async
    @Transactional
    public void notifyStatusChange(Complaint complaint, String oldStatus, String newStatus) {
        List<UUID> followerIds = notificationRepository.findFollowerIdsByComplaintId(complaint.getId());

        for (UUID followerId : followerIds) {
            if (followerId.equals(complaint.getUser().getId())) continue;
            sendTo(followerId, "STATUS_UPDATE",
                "Complaint status updated",
                "Complaint #" + complaint.getTrackingId() + " status changed from " + oldStatus + " to " + newStatus,
                complaint);
        }

        // Always notify the complaint owner
        sendTo(complaint.getUser().getId(), "STATUS_UPDATE",
            "Your complaint status updated",
            "Complaint #" + complaint.getTrackingId() + " status changed to " + newStatus,
            complaint);
    }

    @Async
    @Transactional
    public void notifyNewComment(Complaint complaint, User commenter) {
        UUID ownerId = complaint.getUser().getId();

        // Notify the complaint owner (unless the owner is commenting on their own)
        if (!commenter.getId().equals(ownerId)) {
            sendTo(ownerId, "NEW_COMMENT",
                "New comment on your complaint",
                commenter.getName() + " commented on complaint #" + complaint.getTrackingId(),
                complaint);
        }

        // Notify followers (exclude commenter and owner who already got one)
        List<UUID> followerIds = notificationRepository.findFollowerIdsByComplaintId(complaint.getId());
        for (UUID followerId : followerIds) {
            if (followerId.equals(commenter.getId()) || followerId.equals(ownerId)) continue;
            sendTo(followerId, "NEW_COMMENT",
                "New comment on followed complaint",
                commenter.getName() + " commented on complaint #" + complaint.getTrackingId(),
                complaint);
        }
    }

    private void sendTo(UUID userId, String type, String title, String message, Complaint complaint) {
        try {
            User user = userRepository.getReferenceById(userId);
            Notification n = new Notification();
            n.setUser(user);
            n.setType(type);
            n.setTitle(title);
            n.setMessage(message);
            n.setComplaint(complaint);
            notificationRepository.save(n);
        } catch (Exception e) {
            log.error("Failed to create notification for user={} type={}: {}", userId, type, e.getMessage());
        }
    }
}
