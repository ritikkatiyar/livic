package com.livic.platform.user.dto;

import com.livic.platform.user.domain.UserMode;
import jakarta.validation.constraints.NotNull;

public record SaveUserPreferenceRequest(
        @NotNull(message = "Active mode is required") UserMode activeMode
) {
}
