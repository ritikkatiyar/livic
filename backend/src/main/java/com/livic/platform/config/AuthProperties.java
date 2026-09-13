package com.livic.platform.config;

import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "app.auth")
@Validated
public record AuthProperties(
        @Min(1) int maxFailedLoginAttempts,
        @Min(60000L) long lockoutDurationMs
) {
}
