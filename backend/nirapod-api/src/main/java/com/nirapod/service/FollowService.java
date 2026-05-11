package com.nirapod.service;

import com.nirapod.dto.social.FollowStatusResponse;
import com.nirapod.exception.ApiException;
import com.nirapod.model.Complaint;
import com.nirapod.model.ComplaintFollow;
import com.nirapod.model.User;
import com.nirapod.repository.ComplaintFollowRepository;
import com.nirapod.repository.ComplaintRepository;
import com.nirapod.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final ComplaintFollowRepository followRepository;
    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public FollowStatusResponse getStatus(UUID complaintId, UUID userId) {
        boolean following = followRepository.existsByUserIdAndComplaintId(userId, complaintId);
        long count = followRepository.countByComplaintId(complaintId);
        return new FollowStatusResponse(following, count);
    }

    @Transactional
    public FollowStatusResponse follow(UUID complaintId, UUID userId) {
        if (followRepository.existsByUserIdAndComplaintId(userId, complaintId)) {
            long count = followRepository.countByComplaintId(complaintId);
            return new FollowStatusResponse(true, count);
        }

        Complaint complaint = complaintRepository.findById(complaintId)
            .orElseThrow(() -> ApiException.notFound("Complaint not found"));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));

        ComplaintFollow follow = new ComplaintFollow();
        follow.setComplaint(complaint);
        follow.setUser(user);
        followRepository.save(follow);

        long count = followRepository.countByComplaintId(complaintId);
        return new FollowStatusResponse(true, count);
    }

    @Transactional
    public FollowStatusResponse unfollow(UUID complaintId, UUID userId) {
        followRepository.deleteByUserIdAndComplaintId(userId, complaintId);
        long count = followRepository.countByComplaintId(complaintId);
        return new FollowStatusResponse(false, count);
    }
}
