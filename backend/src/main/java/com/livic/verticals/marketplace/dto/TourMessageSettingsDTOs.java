package com.livic.verticals.marketplace.dto;

import com.livic.platform.notification.domain.NotificationChannel;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.Set;
import java.util.UUID;

public class TourMessageSettingsDTOs {

    public record ChannelChoice(
        @NotNull(message = "Choose whether to send SMS") Boolean sms,
        @NotNull(message = "Choose whether to send WhatsApp") Boolean whatsapp
    ) {}

    public record UpdateTourMessageSettingsRequest(
        @NotNull(message = "Decision message channels are required") @Valid ChannelChoice decision,
        @NotNull(message = "Reminder channels are required") @Valid ChannelChoice reminder
    ) {}

    /**
     * @param customized        false when the property never saved a choice and these are the defaults
     * @param availableChannels channels the platform can deliver; others can't be turned on
     */
    public record TourMessageSettingsResponse(
        UUID propertyId,
        boolean customized,
        ChannelChoice decision,
        ChannelChoice reminder,
        Set<NotificationChannel> availableChannels
    ) {}
}
