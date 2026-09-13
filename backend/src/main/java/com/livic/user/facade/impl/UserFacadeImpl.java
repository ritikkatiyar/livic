package com.livic.user.facade.impl;

import com.livic.common.domain.UserRole;
import com.livic.user.domain.DevicePlatform;
import com.livic.user.domain.ResidentNotificationPreferenceTbl;
import com.livic.user.domain.UserDeviceTokenTbl;
import com.livic.user.domain.UserMode;
import com.livic.user.domain.UserPreferenceTbl;
import com.livic.user.domain.UserTbl;
import com.livic.user.dto.UserSummaryDTO;
import com.livic.user.facade.UserFacade;
import com.livic.user.repository.ResidentNotificationPreferenceRepository;
import com.livic.user.service.interfaces.UserCrudService;
import com.livic.user.service.interfaces.UserDeviceTokenCrudService;
import com.livic.user.service.interfaces.UserPreferenceCrudService;
import com.livic.user.service.interfaces.UserQueryService;
import com.livic.user.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
    private final UserCrudService userCrudService;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    private final UserPreferenceCrudService userPreferenceCrudService;
    private final UserDeviceTokenCrudService userDeviceTokenCrudService;
    private final ResidentNotificationPreferenceRepository residentNotificationPreferenceRepository;

    @Override
    public Optional<UserSummaryDTO> getUserById(UUID userId) {
        return userCrudService.findById(userId)
                .map(UserSummaryDTO::from);
    }

    @Override
    public Optional<UserSummaryDTO> getUserByEmail(String email) {
        return userQueryService.findByEmail(email)
                .map(UserSummaryDTO::from);
    }

    @Override
    public Optional<com.livic.user.dto.UserCredentialsDTO> findCredentialsByEmail(String email) {
        return userQueryService.findByEmail(email)
                .map(com.livic.user.dto.UserCredentialsDTO::from);
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
        return userCrudService.existsById(userId);
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
        UserTbl user = userCrudService.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        user.setFullName(fullName != null ? fullName.trim() : "");
        user.setPhoneNumber(normalizePhone(phoneNumber));
        user.setPasswordHash(passwordEncoder.encode(password));
        return UserSummaryDTO.from(userCrudService.save(user));
    }

    @Override
    public boolean isEmailVerified(UUID userId) {
        return userCrudService.findById(userId).map(UserTbl::isEmailVerified).orElse(false);
    }

    @Override
    @Transactional
    public void markEmailVerified(UUID userId) {
        userCrudService.findById(userId)
                .filter(user -> !user.isEmailVerified())
                .ifPresent(user -> {
                    user.setEmailVerified(true);
                    userCrudService.save(user);
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
    public UserMode getActiveModeForUser(UUID userId) {
        return userPreferenceCrudService.findByUserId(userId)
                .map(UserPreferenceTbl::getActiveMode)
                .orElse(UserMode.RENTAL);
    }

    @Override
    @Transactional
    public void markOnboardingDone(UUID userId, UserMode defaultMode) {
        Optional<UserPreferenceTbl> existingOpt = userPreferenceCrudService.findByUserId(userId);
        if (existingOpt.isPresent()) {
            UserPreferenceTbl preference = existingOpt.get();
            preference.setOnboardingDone(true);
            if (preference.getActiveMode() == null && defaultMode != null) {
                preference.setActiveMode(defaultMode);
            }
            userPreferenceCrudService.save(preference);
        } else {
            UserPreferenceTbl preference = UserPreferenceTbl.builder()
                    .userId(userId)
                    .activeMode(defaultMode != null ? defaultMode : UserMode.RENTAL)
                    .onboardingDone(true)
                    .build();
            userPreferenceCrudService.save(preference);
        }
        log.info("onboarding_marked_done userId={} mode={}", userId, defaultMode);
    }

    @Override
    @Transactional
    public void registerDeviceToken(UUID userId, String expoPushToken, DevicePlatform platform) {
        Optional<UserDeviceTokenTbl> existingOpt = userDeviceTokenCrudService.findByExpoPushToken(expoPushToken);
        if (existingOpt.isPresent()) {
            UserDeviceTokenTbl token = existingOpt.get();
            token.setUserId(userId);
            token.setPlatform(platform);
            token.setLastSeenAt(LocalDateTime.now());
            userDeviceTokenCrudService.save(token);
        } else {
            UserDeviceTokenTbl token = UserDeviceTokenTbl.builder()
                    .userId(userId)
                    .expoPushToken(expoPushToken)
                    .platform(platform)
                    .registeredAt(LocalDateTime.now())
                    .lastSeenAt(LocalDateTime.now())
                    .build();
            userDeviceTokenCrudService.save(token);
        }
    }

    @Override
    public List<String> getActiveDeviceTokens(UUID userId) {
        return userDeviceTokenCrudService.findByUserId(userId).stream()
                .map(UserDeviceTokenTbl::getExpoPushToken)
                .toList();
    }

    @Override
    public com.livic.user.dto.UserNotificationPreferencesDTO getNotificationPreferences(UUID userId) {
        return residentNotificationPreferenceRepository.findByUserId(userId)
                .map(pref -> new com.livic.user.dto.UserNotificationPreferencesDTO(
                        pref.isEmailEnabled(),
                        pref.isPushEnabled(),
                        pref.isWhatsappEnabled()
                ))
                .orElse(new com.livic.user.dto.UserNotificationPreferencesDTO(true, true, true));
    }

    @Override
    @Transactional
    public com.livic.user.dto.UserNotificationPreferencesDTO updateNotificationPreferences(UUID userId, com.livic.user.dto.UserNotificationPreferencesDTO dto) {
        ResidentNotificationPreferenceTbl pref = residentNotificationPreferenceRepository.findByUserId(userId)
                .orElseGet(() -> ResidentNotificationPreferenceTbl.builder()
                        .userId(userId)
                        .build());
        pref.setEmailEnabled(dto.emailEnabled());
        pref.setPushEnabled(dto.pushEnabled());
        pref.setWhatsappEnabled(dto.whatsappEnabled());
        ResidentNotificationPreferenceTbl saved = residentNotificationPreferenceRepository.save(pref);
        return new com.livic.user.dto.UserNotificationPreferencesDTO(
                saved.isEmailEnabled(),
                saved.isPushEnabled(),
                saved.isWhatsappEnabled()
        );
    }

    @Override
    public List<UUID> getUserIdsBySearch(String searchPattern) {
        return userCrudService.findIdsByFullNameOrPhonePattern(searchPattern);
    }
}
