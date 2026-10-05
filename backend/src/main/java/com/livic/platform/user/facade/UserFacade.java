package com.livic.platform.user.facade;

import com.livic.platform.user.domain.DevicePlatform;
import com.livic.platform.user.dto.UserSummaryDTO;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface UserFacade {

    Optional<UserSummaryDTO> getUserById(UUID userId);

    Optional<UserSummaryDTO> getUserByEmail(String email);

    /** For the auth module's login flow only. */
    Optional<com.livic.platform.user.dto.UserCredentialsDTO> findCredentialsByEmail(String email);

    Optional<UserSummaryDTO> findByPhoneNumber(String phoneNumber);

    Map<UUID, UserSummaryDTO> getUsersByIds(Collection<UUID> userIds);

    boolean existsByEmail(String email);

    boolean existsById(UUID userId);

    UserSummaryDTO createUser(String email, String fullName, String phoneNumber, String password);

    UserSummaryDTO createUnverifiedUser(String email, String fullName, String phoneNumber, String password);

    UserSummaryDTO createPasswordlessUser(String email, String fullName);

    UserSummaryDTO updateUnverifiedUser(UUID userId, String fullName, String phoneNumber, String password);

    boolean isEmailVerified(UUID userId);

    void markEmailVerified(UUID userId);

    /** Removes the password so the account can only be used through a verified sign-in method. */
    void clearPassword(UUID userId);

    /** Marks onboarding done; {@code mode} becomes the active mode when the user has none yet. */
    void markOnboardingDone(UUID userId, String mode);

    void registerDeviceToken(UUID userId, String expoPushToken, DevicePlatform platform);

    List<String> getActiveDeviceTokens(UUID userId);

    com.livic.platform.user.dto.UserNotificationPreferencesDTO getNotificationPreferences(UUID userId);

    List<UUID> getUserIdsBySearch(String searchPattern);
}
