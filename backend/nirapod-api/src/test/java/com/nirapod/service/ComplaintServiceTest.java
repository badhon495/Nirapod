package com.nirapod.service;

import com.nirapod.dto.complaint.*;
import com.nirapod.exception.ApiException;
import com.nirapod.model.*;
import com.nirapod.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ComplaintServiceTest {

    @Mock private ComplaintRepository complaintRepository;
    @Mock private ComplaintPhotoRepository photoRepository;
    @Mock private ComplaintFollowRepository followRepository;
    @Mock private ComplaintStatusHistoryRepository statusHistoryRepository;
    @Mock private UserRepository userRepository;
    @Mock private AuditService auditService;
    @Mock private NotificationService notificationService;

    private ComplaintService complaintService;

    @BeforeEach
    void setUp() {
        complaintService = new ComplaintService(
                complaintRepository, photoRepository, followRepository,
                statusHistoryRepository, userRepository, auditService, notificationService);
    }

    @Test
    void create_pendingUser_throwsForbidden() {
        UUID userId = UUID.randomUUID();
        User user = buildUser(UserStatus.PENDING);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        ComplaintCreateRequest req = buildCreateRequest();
        assertThatThrownBy(() -> complaintService.create(userId, req, "127.0.0.1"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void create_unknownUser_throwsNotFound() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        ComplaintCreateRequest req = buildCreateRequest();
        assertThatThrownBy(() -> complaintService.create(userId, req, "127.0.0.1"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void create_activeUser_savesComplaintAndLogs() {
        UUID userId = UUID.randomUUID();
        User user = buildUser(UserStatus.ACTIVE);
        Complaint saved = buildComplaint(user, ComplaintStatus.UNSOLVED);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(complaintRepository.save(any(Complaint.class))).thenReturn(saved);
        when(complaintRepository.findByIdWithUser(saved.getId())).thenReturn(Optional.of(saved));

        ComplaintCreateRequest req = buildCreateRequest();
        complaintService.create(userId, req, "127.0.0.1");

        verify(complaintRepository).save(any(Complaint.class));
        verify(auditService).log(eq(userId), eq("COMPLAINT_CREATED"), any(), any(), any(), any(), any());
    }

    @Test
    void delete_citizenOwner_unsolvedComplaint_succeeds() {
        UUID userId = UUID.randomUUID();
        User user = buildUserWithId(userId, UserStatus.ACTIVE);
        Complaint complaint = buildComplaint(user, ComplaintStatus.UNSOLVED);

        when(complaintRepository.findByIdWithUser(complaint.getId())).thenReturn(Optional.of(complaint));

        complaintService.delete(complaint.getId(), userId, UserRole.CITIZEN, "127.0.0.1");

        verify(complaintRepository).delete(complaint);
    }

    @Test
    void delete_nonOwner_nonAdmin_throwsForbidden() {
        UUID ownerId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();
        User owner = buildUserWithId(ownerId, UserStatus.ACTIVE);
        Complaint complaint = buildComplaint(owner, ComplaintStatus.UNSOLVED);

        when(complaintRepository.findByIdWithUser(complaint.getId())).thenReturn(Optional.of(complaint));

        assertThatThrownBy(() ->
                complaintService.delete(complaint.getId(), otherId, UserRole.CITIZEN, "127.0.0.1"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void delete_citizenOwner_inProgressComplaint_throwsBadRequest() {
        UUID userId = UUID.randomUUID();
        User user = buildUserWithId(userId, UserStatus.ACTIVE);
        Complaint complaint = buildComplaint(user, ComplaintStatus.IN_PROGRESS);

        when(complaintRepository.findByIdWithUser(complaint.getId())).thenReturn(Optional.of(complaint));

        assertThatThrownBy(() ->
                complaintService.delete(complaint.getId(), userId, UserRole.CITIZEN, "127.0.0.1"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void delete_admin_anyComplaint_succeeds() {
        UUID adminId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        User owner = buildUserWithId(ownerId, UserStatus.ACTIVE);
        Complaint complaint = buildComplaint(owner, ComplaintStatus.SOLVED);

        when(complaintRepository.findByIdWithUser(complaint.getId())).thenReturn(Optional.of(complaint));

        complaintService.delete(complaint.getId(), adminId, UserRole.ADMIN, "127.0.0.1");

        verify(complaintRepository).delete(complaint);
    }

    @Test
    void updateStatus_notAuthorizedRole_throwsForbidden() {
        UUID cityUserId = UUID.randomUUID();
        User owner = buildUser(UserStatus.ACTIVE);
        // POLICE complaint, but CITY role tries to update
        Complaint complaint = buildComplaintWithCategory(owner, ComplaintStatus.UNSOLVED, ComplaintCategory.POLICE);

        when(complaintRepository.findByIdWithUser(complaint.getId())).thenReturn(Optional.of(complaint));

        StatusUpdateRequest req = new StatusUpdateRequest(ComplaintStatus.IN_PROGRESS, null);

        assertThatThrownBy(() ->
                complaintService.updateStatus(complaint.getId(), cityUserId, UserRole.CITY, req, "127.0.0.1"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void updateStatus_matchingAuthorityRole_succeeds() {
        UUID policeId = UUID.randomUUID();
        User owner = buildUser(UserStatus.ACTIVE);
        User police = buildUserWithId(policeId, UserStatus.ACTIVE);
        Complaint complaint = buildComplaintWithCategory(owner, ComplaintStatus.UNSOLVED, ComplaintCategory.POLICE);

        when(complaintRepository.findByIdWithUser(complaint.getId())).thenReturn(Optional.of(complaint));
        when(userRepository.findById(policeId)).thenReturn(Optional.of(police));
        when(complaintRepository.save(any())).thenReturn(complaint);
        doNothing().when(notificationService).notifyStatusChange(any(), any(), any());

        StatusUpdateRequest req = new StatusUpdateRequest(ComplaintStatus.IN_PROGRESS, null);
        complaintService.updateStatus(complaint.getId(), policeId, UserRole.POLICE, req, "127.0.0.1");

        verify(statusHistoryRepository).save(any(ComplaintStatusHistory.class));
    }

    // --- helpers ---

    private User buildUser(UserStatus status) {
        return buildUserWithId(UUID.randomUUID(), status);
    }

    private User buildUserWithId(UUID id, UserStatus status) {
        return User.builder()
                .id(id)
                .email("user@example.com")
                .nid("1234567890")
                .phone("01712345678")
                .passwordHash("hashed")
                .name("Test")
                .role(UserRole.CITIZEN)
                .status(status)
                .presentAddress("Dhaka")
                .permanentAddress("Dhaka")
                .build();
    }

    private Complaint buildComplaint(User user, ComplaintStatus status) {
        return buildComplaintWithCategory(user, status, ComplaintCategory.POLICE);
    }

    private Complaint buildComplaintWithCategory(User user, ComplaintStatus status, ComplaintCategory category) {
        Complaint c = new Complaint();
        // id is auto-generated; use ReflectionTestUtils to set it for test stubs
        org.springframework.test.util.ReflectionTestUtils.setField(c, "id", UUID.randomUUID());
        c.setUser(user);
        c.setCategory(category);
        c.setUrgency(ComplaintUrgency.MEDIUM);
        c.setTitle("Test complaint");
        c.setDetails("Detailed description of the complaint for testing purposes here.");
        c.setDistrict("Dhaka");
        c.setArea("Mirpur");
        c.setPublic(true);
        c.setStatus(status);
        return c;
    }

    private ComplaintCreateRequest buildCreateRequest() {
        return new ComplaintCreateRequest(
                ComplaintCategory.POLICE, ComplaintUrgency.MEDIUM,
                "Test complaint", "Detailed description of the complaint for testing purposes.",
                "Dhaka", "Mirpur", null, null, null, true, null, null);
    }
}
