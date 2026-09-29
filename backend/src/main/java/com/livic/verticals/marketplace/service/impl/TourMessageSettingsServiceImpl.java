package com.livic.verticals.marketplace.service.impl;

import com.livic.verticals.marketplace.domain.TourMessageSettingsTbl;
import com.livic.verticals.marketplace.domain.TourMessageType;
import com.livic.verticals.marketplace.dto.ChannelChoice;
import com.livic.verticals.marketplace.dto.TourMessageSettingsResponse;
import com.livic.verticals.marketplace.dto.UpdateTourMessageSettingsRequest;
import com.livic.verticals.marketplace.repository.TourMessageSettingsRepository;
import com.livic.verticals.marketplace.service.interfaces.TourMessageSettingsService;
import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.service.interfaces.MessagingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TourMessageSettingsServiceImpl implements TourMessageSettingsService {

    /** Without a saved choice every channel is on; WhatsApp still only reaches prospects who opted in. */
    static final ChannelChoice DEFAULT_CHOICE = new ChannelChoice(true, true);

    private final TourMessageSettingsRepository settingsRepository;
    private final MessagingService messagingService;

    @Override
    @Transactional(readOnly = true)
    public TourMessageSettingsResponse getSettings(UUID propertyId) {
        return settingsRepository.findByPropertyId(propertyId)
                .map(settings -> toResponse(propertyId, settings))
                .orElseGet(() -> new TourMessageSettingsResponse(
                        propertyId, false, DEFAULT_CHOICE, DEFAULT_CHOICE, messagingService.availableChannels()));
    }

    @Override
    @Transactional
    public TourMessageSettingsResponse updateSettings(UUID propertyId, UpdateTourMessageSettingsRequest request, UUID userId) {
        Set<NotificationChannel> available = messagingService.availableChannels();
        requireAvailable(request.decision(), available);
        requireAvailable(request.reminder(), available);

        TourMessageSettingsTbl settings = settingsRepository.findByPropertyId(propertyId)
                .orElseGet(() -> TourMessageSettingsTbl.builder().propertyId(propertyId).build());
        settings.setDecisionSms(request.decision().sms());
        settings.setDecisionWhatsapp(request.decision().whatsapp());
        settings.setReminderSms(request.reminder().sms());
        settings.setReminderWhatsapp(request.reminder().whatsapp());
        settings.setUpdatedByUserId(userId);
        settingsRepository.save(settings);

        log.info("tour_message_settings_updated propertyId={} decision={} reminder={} userId={}",
                propertyId, request.decision(), request.reminder(), userId);
        return toResponse(propertyId, settings);
    }

    @Override
    @Transactional(readOnly = true)
    public Set<NotificationChannel> channelsFor(UUID propertyId, TourMessageType type) {
        ChannelChoice choice = settingsRepository.findByPropertyId(propertyId)
                .map(settings -> type == TourMessageType.DECISION ? decisionOf(settings) : reminderOf(settings))
                .orElse(DEFAULT_CHOICE);

        Set<NotificationChannel> channels = EnumSet.noneOf(NotificationChannel.class);
        if (choice.sms()) {
            channels.add(NotificationChannel.SMS);
        }
        if (choice.whatsapp()) {
            channels.add(NotificationChannel.WHATSAPP);
        }
        channels.retainAll(messagingService.availableChannels());
        return channels;
    }

    private static void requireAvailable(ChannelChoice choice, Set<NotificationChannel> available) {
        if (choice.sms() && !available.contains(NotificationChannel.SMS)) {
            throw new BusinessException("SMS isn't set up yet, so it can't be turned on");
        }
        if (choice.whatsapp() && !available.contains(NotificationChannel.WHATSAPP)) {
            throw new BusinessException("WhatsApp isn't set up yet, so it can't be turned on");
        }
    }

    private TourMessageSettingsResponse toResponse(UUID propertyId, TourMessageSettingsTbl settings) {
        return new TourMessageSettingsResponse(
                propertyId, true, decisionOf(settings), reminderOf(settings), messagingService.availableChannels());
    }

    private static ChannelChoice decisionOf(TourMessageSettingsTbl settings) {
        return new ChannelChoice(settings.isDecisionSms(), settings.isDecisionWhatsapp());
    }

    private static ChannelChoice reminderOf(TourMessageSettingsTbl settings) {
        return new ChannelChoice(settings.isReminderSms(), settings.isReminderWhatsapp());
    }
}
