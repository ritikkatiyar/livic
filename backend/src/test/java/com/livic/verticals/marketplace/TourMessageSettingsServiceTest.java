package com.livic.verticals.marketplace;

import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.service.MessagingService;
import com.livic.verticals.marketplace.domain.TourMessageSettingsTbl;
import com.livic.verticals.marketplace.domain.TourMessageType;
import com.livic.verticals.marketplace.dto.TourMessageSettingsDTOs.ChannelChoice;
import com.livic.verticals.marketplace.dto.TourMessageSettingsDTOs.TourMessageSettingsResponse;
import com.livic.verticals.marketplace.dto.TourMessageSettingsDTOs.UpdateTourMessageSettingsRequest;
import com.livic.verticals.marketplace.repository.TourMessageSettingsRepository;
import com.livic.verticals.marketplace.service.impl.TourMessageSettingsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TourMessageSettingsServiceTest {

    private static final Set<NotificationChannel> BOTH = Set.of(NotificationChannel.SMS, NotificationChannel.WHATSAPP);

    @Mock private TourMessageSettingsRepository settingsRepository;
    @Mock private MessagingService messagingService;
    @InjectMocks private TourMessageSettingsServiceImpl service;

    private final UUID propertyId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        lenient().when(messagingService.availableChannels()).thenReturn(BOTH);
    }

    @Test
    @DisplayName("Without a saved choice every channel is on")
    void defaults() {
        when(settingsRepository.findByPropertyId(propertyId)).thenReturn(Optional.empty());

        TourMessageSettingsResponse settings = service.getSettings(propertyId);

        assertFalse(settings.customized());
        assertEquals(new ChannelChoice(true, true), settings.decision());
        assertEquals(new ChannelChoice(true, true), settings.reminder());
        assertEquals(BOTH, settings.availableChannels());
        assertEquals(BOTH, service.channelsFor(propertyId, TourMessageType.REMINDER));
    }

    @Test
    @DisplayName("Saves the choice per message type and uses it when sending")
    void savesChoice() {
        when(settingsRepository.findByPropertyId(propertyId)).thenReturn(Optional.empty());

        TourMessageSettingsResponse saved = service.updateSettings(propertyId, new UpdateTourMessageSettingsRequest(
                new ChannelChoice(true, true), new ChannelChoice(false, true)), userId);

        ArgumentCaptor<TourMessageSettingsTbl> captor = ArgumentCaptor.forClass(TourMessageSettingsTbl.class);
        verify(settingsRepository).save(captor.capture());
        TourMessageSettingsTbl row = captor.getValue();
        assertTrue(row.isDecisionSms() && row.isDecisionWhatsapp());
        assertFalse(row.isReminderSms());
        assertTrue(row.isReminderWhatsapp());
        assertEquals(userId, row.getUpdatedByUserId());
        assertTrue(saved.customized());

        when(settingsRepository.findByPropertyId(propertyId)).thenReturn(Optional.of(row));
        assertEquals(Set.of(NotificationChannel.WHATSAPP), service.channelsFor(propertyId, TourMessageType.REMINDER));
    }

    @Test
    @DisplayName("A channel the platform can't deliver can't be turned on, and is left out when sending")
    void unavailableChannel() {
        when(messagingService.availableChannels()).thenReturn(Set.of(NotificationChannel.SMS));

        UpdateTourMessageSettingsRequest whatsappOn = new UpdateTourMessageSettingsRequest(
                new ChannelChoice(true, true), new ChannelChoice(true, false));
        BusinessException error = assertThrows(BusinessException.class, () -> service.updateSettings(propertyId, whatsappOn, userId));
        assertTrue(error.getMessage().contains("WhatsApp"));
        verify(settingsRepository, never()).save(any());

        when(settingsRepository.findByPropertyId(propertyId)).thenReturn(Optional.empty());
        assertEquals(Set.of(NotificationChannel.SMS), service.channelsFor(propertyId, TourMessageType.DECISION));
    }
}
