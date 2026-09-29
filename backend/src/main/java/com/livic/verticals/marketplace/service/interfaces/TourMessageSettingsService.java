package com.livic.verticals.marketplace.service.interfaces;

import com.livic.verticals.marketplace.domain.TourMessageType;
import com.livic.verticals.marketplace.dto.TourMessageSettingsResponse;
import com.livic.verticals.marketplace.dto.UpdateTourMessageSettingsRequest;
import com.livic.platform.notification.domain.NotificationChannel;

import java.util.Set;
import java.util.UUID;

/** Which channels (SMS, WhatsApp, both or none) a property uses for each tour message. */
public interface TourMessageSettingsService {

    TourMessageSettingsResponse getSettings(UUID propertyId);

    TourMessageSettingsResponse updateSettings(UUID propertyId, UpdateTourMessageSettingsRequest request, UUID userId);

    /** The property's chosen channels for a message, limited to channels the platform can deliver. */
    Set<NotificationChannel> channelsFor(UUID propertyId, TourMessageType type);
}
