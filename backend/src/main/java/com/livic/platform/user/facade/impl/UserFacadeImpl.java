package com.livic.platform.user.facade.impl;

import com.livic.platform.user.repository.UserPreferenceRepository;
import com.livic.platform.user.repository.UserDeviceTokenRepository;
import com.livic.platform.user.repository.UserRepository;
import com.livic.platform.common.domain.UserRole;
import com.livic.platform.user.domain.DevicePlatform;
import com.livic.platform.user.domain.UserDeviceTokenTbl;
import com.livic.platform.user.domain.UserPreferenceTbl;
import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import com.livic.platform.user.service.interfaces.UserPreferenceService;
import com.livic.platform.user.service.interfaces.UserQueryService;
import com.livic.platform.user.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserFacadeImpl implements UserFacade {

    private final UserQueryService userQueryService;
    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    private final UserPreferenceRepository userPreferenceRepository;
    private final UserDeviceTokenRepository userDeviceTokenRepository;
    private final UserPreferenceService userPreferenceService;

    @Override
    public Optional<UserSummaryDTO> getUserById(UUID userId) {
        return userRepository.findById(userId)
                .map(UserSummaryDTO::from);
    }

    @Override
    public Optional<UserSummaryDTO> getUserByEmail(String email) {
        return userQueryService.findByEmail(email)
                .map(UserSummaryDTO::from);
    }

    @Override
    public Optional<com.livic.platform.user.dto.UserCredentialsDTO> findCredentialsByEmail(String email) {
        return userQueryService.findByEmail(email)
                .map(com.livic.platform.user.dto.UserCredentialsDTO::from);
    }

    @Override
    public Optional<UserSummaryDTO> findByPhoneNumber(String phoneNumber) {
        return userQueryService.findByPhoneNumber(phoneNumber)
                .map(UserSummaryDTO::from);
    }

    @Override
    public Map<UUID, UserSummaryDTO> getUsersByIds(Collection<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<UUID, UserTbl> map = userQueryService.getUsersByIds(userIds);
        return map.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> UserSummaryDTO.from(e.getValue())
                ));
    }

    @Override
    public boolean existsByEmail(String email) {
        return userQueryService.existsByEmail(email);
    }

    @Override
    public boolean existsById(UUID userId) {
        return userRepository.existsById(userId);
    }

    @Override
    @Transactional
    public UserSummaryDTO createUser(String email, String fullName, String phoneNumber, String password) {
        return saveNewUser(email, fullName, phoneNumber, password, true);
    }

    @Override
    @Transactional
    public UserSummaryDTO createUnverifiedUser(String email, String fullName, String phoneNumber, String password) {
        return saveNewUser(email, fullName, phoneNumber, password, false);
    }

    @Override
    @Transactional
    public UserSummaryDTO createPasswordlessUser(String email, String fullName) {
        return saveNewUser(email, fullName, null, null, true);
    }

    @Override
    @Transactional
    public UserSummaryDTO updateUnverifiedUser(UUID userId, String fullName, String phoneNumber, String password) {
        UserTbl user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        user.setFullName(fullName != null ? fullName.trim() : "");
        user.setPhoneNumber(normalizePhone(phoneNumber));
        user.setPasswordHash(passwordEncoder.encode(password));
        return UserSummaryDTO.from(userRepository.save(user));
    }

    @Override
    public boolean isEmailVerified(UUID userId) {
        return userRepository.findById(userId).map(UserTbl::isEmailVerified).orElse(false);
    }

    @Override
    @Transactional
    public void markEmailVerified(UUID userId) {
        userRepository.findById(userId)
                .filter(user -> !user.isEmailVerified())
                .ifPresent(user -> {
                    user.setEmailVerified(true);
                    userRepository.save(user);
                });
    }

    @Override
    @Transactional
    public void clearPassword(UUID userId) {
        userRepository.findById(userId)
                .filter(user -> user.getPasswordHash() != null)
                .ifPresent(user -> {
                    user.setPasswordHash(null);
                    userRepository.save(user);
                });
    }

    private UserSummaryDTO saveNewUser(String email, String fullName, String phoneNumber, String password, boolean emailVerified) {
        UserTbl newUser = UserTbl.builder()
                .authUid(email != null ? email.trim().toLowerCase() : "")
                .fullName(fullName != null ? fullName.trim() : "")
                .phoneNumber(normalizePhone(phoneNumber))
                .passwordHash(password != null ? passwordEncoder.encode(password) : null)
                .emailVerified(emailVerified)
                .globalRole(UserRole.USER)
                .build();
        return UserSummaryDTO.from(userService.createUser(newUser));
    }

    private static String normalizePhone(String phoneNumber) {
        return phoneNumber == null || phoneNumber.isBlank() ? null : phoneNumber.trim();
    }

    @Override
    @Transactional
    public void markOnboardingDone(UUID userId, String mode) {
        java.util.Objects.requireNonNull(mode, "mode");
        Optional<UserPreferenceTbl> existingOpt = userPreferenceRepository.findByUserId(userId);
        if (existingOpt.isPresent()) {
            UserPreferenceTbl preference = existingOpt.get();
            preference.setOnboardingDone(true);
            if (preference.getActiveMode() == null) {
                preference.setActiveMode(mode);
            }
            userPreferenceRepository.save(preference);
        } else {
            UserPreferenceTbl preference = UserPreferenceTbl.builder()
                    .userId(userId)
                    .activeMode(mode)
                    .onboardingDone(true)
                    .build();
            userPreferenceRepository.save(preference);
        }
        log.info("onboarding_marked_done userId={} mode={}", userId, mode);
    }

    @Override
    @Transactional
    public void registerDeviceToken(UUID userId, String expoPushToken, DevicePlatform platform) {
        userService.registerDeviceToken(userId, expoPushToken, platform);
    }

    @Override
    public List<String> getActiveDeviceTokens(UUID userId) {
        return userDeviceTokenRepository.findByUserId(userId).stream()
                .map(UserDeviceTokenTbl::getExpoPushToken)
                .toList();
    }

    @Override
    public com.livic.platform.user.dto.UserNotificationPreferencesDTO getNotificationPreferences(UUID userId) {
        return userPreferenceService.getNotificationPreferences(userId);
    }

    @Override
    public List<UUID> getUserIdsBySearch(String searchPattern) {
        if (searchPattern == null || searchPattern.isBlank()) {
            return List.of();
        }
        return userRepository.findIdsByFullNameOrPhonePattern(searchPattern.trim());
    }
}
