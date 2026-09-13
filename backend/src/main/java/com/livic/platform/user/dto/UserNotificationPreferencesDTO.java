package com.livic.platform.user.dto;

public record UserNotificationPreferencesDTO(
        boolean emailEnabled,
        boolean pushEnabled,
        boolean whatsappEnabled
) {
}
