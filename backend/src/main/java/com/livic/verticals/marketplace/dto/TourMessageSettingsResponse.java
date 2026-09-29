package com.livic.verticals.marketplace.dto;

import com.livic.platform.notification.domain.NotificationChannel;

import java.util.Set;
import java.util.UUID;

/**
 * A property's tour message channels.
 *
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
