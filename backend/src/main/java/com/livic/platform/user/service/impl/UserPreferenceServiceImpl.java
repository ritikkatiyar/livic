package com.livic.platform.user.service.impl;

import com.livic.platform.user.domain.UserPreferenceTbl;
import com.livic.platform.user.dto.UserPreferenceResponse;
import com.livic.platform.user.dto.SaveUserPreferenceRequest;
import com.livic.platform.user.service.interfaces.UserPreferenceCrudService;
import com.livic.platform.user.service.interfaces.UserPreferenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserPreferenceServiceImpl implements UserPreferenceService {

    private final UserPreferenceCrudService userPreferenceCrudService;

    @Override
    @Transactional
    public UserPreferenceResponse savePreference(UUID userId, SaveUserPreferenceRequest request) {
        Optional<UserPreferenceTbl> existingOpt = userPreferenceCrudService.findByUserId(userId);

        UserPreferenceTbl preference;
        if (existingOpt.isPresent()) {
            preference = existingOpt.get();
            preference.setActiveMode(request.activeMode());
            preference.setOnboardingDone(true);
        } else {
            preference = UserPreferenceTbl.builder()
                    .userId(userId)
                    .activeMode(request.activeMode())
                    .onboardingDone(true)
                    .build();
        }

        preference = userPreferenceCrudService.save(preference);
        log.info("preference_saved userId={} activeMode={}", userId, request.activeMode());

        return new UserPreferenceResponse(
                preference.getId(),
                preference.getActiveMode(),
                preference.isOnboardingDone()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public UserPreferenceResponse getPreference(UUID userId) {
        return userPreferenceCrudService.findByUserId(userId)
                .map(pref -> new UserPreferenceResponse(
                        pref.getId(),
                        pref.getActiveMode(),
                        pref.isOnboardingDone()
                ))
                .orElseGet(() -> new UserPreferenceResponse(null, null, false));
    }
}
