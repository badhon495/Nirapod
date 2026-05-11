package com.nirapod.model;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "complaint_follows")
@IdClass(ComplaintFollow.ComplaintFollowId.class)
public class ComplaintFollow {

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Complaint getComplaint() { return complaint; }
    public void setComplaint(Complaint complaint) { this.complaint = complaint; }
    public OffsetDateTime getCreatedAt() { return createdAt; }

    public static class ComplaintFollowId implements Serializable {
        private UUID user;
        private UUID complaint;

        public ComplaintFollowId() {}
        public ComplaintFollowId(UUID user, UUID complaint) {
            this.user = user;
            this.complaint = complaint;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof ComplaintFollowId that)) return false;
            return Objects.equals(user, that.user) && Objects.equals(complaint, that.complaint);
        }

        @Override
        public int hashCode() { return Objects.hash(user, complaint); }
    }
}
