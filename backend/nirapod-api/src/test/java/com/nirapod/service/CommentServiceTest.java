package com.nirapod.service;

import com.nirapod.dto.comment.CommentCreateRequest;
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
class CommentServiceTest {

    @Mock private CommentRepository commentRepository;
    @Mock private ComplaintRepository complaintRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;
    @Mock private AuditService auditService;

    private CommentService commentService;

    @BeforeEach
    void setUp() {
        commentService = new CommentService(
                commentRepository, complaintRepository, userRepository,
                notificationService, auditService);
    }

    @Test
    void create_complaintNotFound_throwsNotFound() {
        UUID complaintId = UUID.randomUUID();
        when(complaintRepository.findByIdWithUser(complaintId)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                commentService.create(complaintId, UUID.randomUUID(),
                        new CommentCreateRequest("text"), "127.0.0.1"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void create_validRequest_savesAndNotifies() {
        UUID complaintId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        User user = buildUser(userId);
        Complaint complaint = buildComplaint(user);
        Comment saved = buildComment(complaint, user, "Hello world");

        when(complaintRepository.findByIdWithUser(complaintId)).thenReturn(Optional.of(complaint));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(commentRepository.save(any(Comment.class))).thenReturn(saved);

        commentService.create(complaintId, userId, new CommentCreateRequest("Hello world"), "127.0.0.1");

        verify(commentRepository).save(any(Comment.class));
        verify(notificationService).notifyNewComment(any(), any());
    }

    @Test
    void update_notOwner_throwsForbidden() {
        UUID commentId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();

        User owner = buildUser(ownerId);
        Complaint complaint = buildComplaint(owner);
        Comment comment = buildComment(complaint, owner, "original");

        when(commentRepository.findByIdWithUser(commentId)).thenReturn(Optional.of(comment));

        assertThatThrownBy(() ->
                commentService.update(commentId, otherId, new CommentCreateRequest("new"), "127.0.0.1"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void update_owner_updatesContent() {
        UUID commentId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        User owner = buildUser(ownerId);
        Complaint complaint = buildComplaint(owner);
        Comment comment = buildComment(complaint, owner, "original");

        when(commentRepository.findByIdWithUser(commentId)).thenReturn(Optional.of(comment));
        when(commentRepository.save(any(Comment.class))).thenReturn(comment);

        commentService.update(commentId, ownerId, new CommentCreateRequest("updated"), "127.0.0.1");

        verify(commentRepository).save(comment);
        assertThat(comment.getContent()).isEqualTo("updated");
    }

    @Test
    void delete_admin_deletesAnyComment() {
        UUID commentId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        User owner = buildUser(ownerId);
        Complaint complaint = buildComplaint(owner);
        Comment comment = buildComment(complaint, owner, "text");

        when(commentRepository.findByIdWithUser(commentId)).thenReturn(Optional.of(comment));

        commentService.delete(commentId, adminId, UserRole.ADMIN, "127.0.0.1");

        verify(commentRepository).delete(comment);
    }

    @Test
    void delete_nonOwnerCitizen_throwsForbidden() {
        UUID commentId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();

        User owner = buildUser(ownerId);
        Complaint complaint = buildComplaint(owner);
        Comment comment = buildComment(complaint, owner, "text");

        when(commentRepository.findByIdWithUser(commentId)).thenReturn(Optional.of(comment));

        assertThatThrownBy(() ->
                commentService.delete(commentId, otherId, UserRole.CITIZEN, "127.0.0.1"))
                .isInstanceOf(ApiException.class);
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
        c.setDetails("Detail text");
        c.setDistrict("Dhaka");
        c.setArea("Gulshan");
        c.setPublic(true);
        c.setStatus(ComplaintStatus.UNSOLVED);
        return c;
    }

    private Comment buildComment(Complaint complaint, User user, String content) {
        Comment c = new Comment();
        ReflectionTestUtils.setField(c, "id", UUID.randomUUID());
        c.setComplaint(complaint);
        c.setUser(user);
        c.setContent(content);
        return c;
    }
}
