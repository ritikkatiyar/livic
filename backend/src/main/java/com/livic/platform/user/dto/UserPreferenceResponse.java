package com.livic.platform.user.dto;


import java.util.UUID;

public record UserPreferenceResponse(
        UUID id,
        String activeMode,
        boolean onboardingDone
) {
}
