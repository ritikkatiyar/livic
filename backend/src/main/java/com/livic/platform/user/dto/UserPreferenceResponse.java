package com.livic.platform.user.dto;

import com.livic.platform.user.domain.UserMode;

import java.util.UUID;

public record UserPreferenceResponse(
        UUID id,
        UserMode activeMode,
        boolean onboardingDone
) {
}
