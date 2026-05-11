package com.nirapod.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.nirapod.dto.auth.TokenResponse;
import com.nirapod.exception.ApiException;
import com.nirapod.model.OAuthAccount;
import com.nirapod.model.User;
import com.nirapod.model.UserRole;
import com.nirapod.model.UserStatus;
import com.nirapod.repository.UserRepository;
import com.nirapod.security.JwtService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AuditService auditService;

    @Value("${google.client.id}")
    private String googleClientId;

    @Transactional
    public TokenResponse authenticateWithGoogle(String idTokenString, HttpServletResponse response) {
        GoogleIdToken.Payload payload = verifyGoogleToken(idTokenString);

        String googleId = payload.getSubject();
        String email = payload.getEmail();
        String name = (String) payload.get("name");

        User user = findOrCreateGoogleUser(googleId, email, name);

        if (user.getStatus() == UserStatus.SUSPENDED)
            throw ApiException.forbidden("Your account has been suspended");

        String accessToken = jwtService.generateAccessToken(
                user.getId().toString(), user.getRole().name());
        String refreshToken = refreshTokenService.issue(user.getId().toString());

        auditService.log(user, "GOOGLE_LOGIN", "USER", user.getId(), null, null, null);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(900)
                .userId(user.getId().toString())
                .role(user.getRole().name())
                .name(user.getName())
                .build();
    }

    private GoogleIdToken.Payload verifyGoogleToken(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();
            GoogleIdToken token = verifier.verify(idTokenString);
            if (token == null)
                throw ApiException.unauthorized("Invalid Google ID token");
            return token.getPayload();
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw ApiException.unauthorized("Google token verification failed");
        }
    }

    private User findOrCreateGoogleUser(String googleId, String email, String name) {
        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            User user = existing.get();
            boolean hasOauth = user.getOauthAccounts().stream()
                    .anyMatch(o -> "GOOGLE".equals(o.getProvider()) && googleId.equals(o.getProviderId()));
            if (!hasOauth) {
                OAuthAccount oauth = OAuthAccount.builder()
                        .provider("GOOGLE")
                        .providerId(googleId)
                        .user(user)
                        .build();
                user.getOauthAccounts().add(oauth);
                userRepository.save(user);
            }
            return user;
        }

        User newUser = User.builder()
                .email(email)
                .name(name != null ? name : email)
                .nid("GOOGLE" + googleId.substring(0, 4))
                .phone("00000000000")
                .role(UserRole.CITIZEN)
                .status(UserStatus.ACTIVE)
                .presentAddress("")
                .permanentAddress("")
                .build();
        OAuthAccount oauth = OAuthAccount.builder()
                .provider("GOOGLE")
                .providerId(googleId)
                .user(newUser)
                .build();
        newUser.getOauthAccounts().add(oauth);
        return userRepository.save(newUser);
    }
}
