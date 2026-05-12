package com.nirapod.service;

import com.nirapod.dto.social.FollowStatusResponse;
import com.nirapod.exception.ApiException;
import com.nirapod.model.*;
import com.nirapod.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FollowServiceTest {

    @Mock private ComplaintFollowRepository followRepository;
    @Mock private ComplaintRepository complaintRepository;
    @Mock private UserRepository userRepository;

    private FollowService followService;

    @BeforeEach
    void setUp() {
        followService = new FollowService(followRepository, complaintRepository, userRepository);
    }

    @Test
    void getStatus_returnsFollowingAndCount() {
        UUID userId = UUID.randomUUID();
        UUID complaintId = UUID.randomUUID();

        when(followRepository.existsByUserIdAndComplaintId(userId, complaintId)).thenReturn(true);
        when(followRepository.countByComplaintId(complaintId)).thenReturn(5L);

        FollowStatusResponse result = followService.getStatus(complaintId, userId);

        assertThat(result.following()).isTrue();
        assertThat(result.followerCount()).isEqualTo(5L);
    }

    @Test
    void follow_alreadyFollowing_returnsCurrentState() {
        UUID userId = UUID.randomUUID();
        UUID complaintId = UUID.randomUUID();

        when(followRepository.existsByUserIdAndComplaintId(userId, complaintId)).thenReturn(true);
        when(followRepository.countByComplaintId(complaintId)).thenReturn(3L);

        FollowStatusResponse result = followService.follow(complaintId, userId);

        assertThat(result.following()).isTrue();
        verify(followRepository, never()).save(any());
    }

    @Test
    void follow_notYetFollowing_savesFollow() {
        UUID userId = UUID.randomUUID();
        UUID complaintId = UUID.randomUUID();

        User user = buildUser(userId);
        Complaint complaint = buildComplaint(user);

        when(followRepository.existsByUserIdAndComplaintId(userId, complaintId)).thenReturn(false);
        when(complaintRepository.findById(complaintId)).thenReturn(Optional.of(complaint));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(followRepository.countByComplaintId(complaintId)).thenReturn(1L);

        FollowStatusResponse result = followService.follow(complaintId, userId);

        assertThat(result.following()).isTrue();
        verify(followRepository).save(any(ComplaintFollow.class));
    }

    @Test
    void follow_complaintNotFound_throwsNotFound() {
        UUID userId = UUID.randomUUID();
        UUID complaintId = UUID.randomUUID();

        when(followRepository.existsByUserIdAndComplaintId(userId, complaintId)).thenReturn(false);
        when(complaintRepository.findById(complaintId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> followService.follow(complaintId, userId))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void unfollow_deletesAndReturnsNotFollowing() {
        UUID userId = UUID.randomUUID();
        UUID complaintId = UUID.randomUUID();

        when(followRepository.countByComplaintId(complaintId)).thenReturn(2L);

        FollowStatusResponse result = followService.unfollow(complaintId, userId);

        assertThat(result.following()).isFalse();
        assertThat(result.followerCount()).isEqualTo(2L);
        verify(followRepository).deleteByUserIdAndComplaintId(userId, complaintId);
    }

    // --- helpers ---

    private User buildUser(UUID id) {
        return User.builder()
                .id(id)
                .email("user@example.com")
                .nid("1234567890")
                .phone("01712345678")
                .passwordHash("hashed")
                .name("Test")
                .role(UserRole.CITIZEN)
                .status(UserStatus.ACTIVE)
                .presentAddress("Dhaka")
                .permanentAddress("Dhaka")
                .build();
    }

    private Complaint buildComplaint(User user) {
        Complaint c = new Complaint();
        ReflectionTestUtils.setField(c, "id", UUID.randomUUID());
        c.setUser(user);
        c.setCategory(ComplaintCategory.POLICE);
        c.setUrgency(ComplaintUrgency.LOW);
        c.setTitle("Test");
        c.setDetails("Details");
        c.setDistrict("Dhaka");
        c.setArea("Gulshan");
        c.setPublic(true);
        c.setStatus(ComplaintStatus.UNSOLVED);
        return c;
    }
}
