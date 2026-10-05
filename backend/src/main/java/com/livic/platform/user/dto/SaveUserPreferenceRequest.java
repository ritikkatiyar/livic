package com.livic.platform.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** {@code activeMode} names the product the apps open, such as RENTAL; the backend only stores it. */
public record SaveUserPreferenceRequest(
        @NotBlank(message = "Active mode is required")
        @Pattern(regexp = "^[A-Z_]{1,20}$", message = "Active mode must be 1-20 capital letters or underscores")
        String activeMode
) {
}
