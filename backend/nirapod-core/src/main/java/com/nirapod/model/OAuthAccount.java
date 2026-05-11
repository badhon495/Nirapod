package com.nirapod.model;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "oauth_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(OAuthAccount.OAuthAccountId.class)
public class OAuthAccount {

    @Id
    @Column(nullable = false, length = 50)
    private String provider;

    @Id
    @Column(name = "provider_id", nullable = false, length = 255)
    private String providerId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OAuthAccountId implements Serializable {
        private String provider;
        private String providerId;
    }
}
