package com.livic.platform.notification.service.impl;

import com.livic.platform.notification.domain.MessageTemplate;
import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.domain.NotificationLogTbl;
import com.livic.platform.notification.domain.NotificationStatus;
import com.livic.platform.notification.dto.DeliveryReport;
import com.livic.platform.notification.dto.DeliveryReport.Outcome;
import com.livic.platform.notification.dto.TemplatedMessage;
import com.livic.platform.notification.exception.NotificationSendException;
import com.livic.platform.notification.service.ChannelProvider;
import com.livic.platform.notification.service.interfaces.NotificationLogCrudService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessagingServiceImplTest {

    private static final TemplatedMessage OTP = TemplatedMessage.of(MessageTemplate.MARKETPLACE_OTP, Map.of("otp", "482913", "minutes", "5"));
    private static final TemplatedMessage REMINDER = TemplatedMessage.of(MessageTemplate.TOUR_REMINDER, Map.of(
            "property", "Test Residency", "date", "Thu, 17 Sep", "time", "11:00 AM", "link", "http://localhost:3000/market-place/my-requests"));

    @Mock private ChannelProvider smsProvider;
    @Mock private ChannelProvider whatsappProvider;
    @Mock private NotificationLogCrudService notificationLogCrudService;

    private MessagingServiceImpl service;

    @BeforeEach
    void setUp() {
        lenient().when(smsProvider.channel()).thenReturn(NotificationChannel.SMS);
        lenient().when(whatsappProvider.channel()).thenReturn(NotificationChannel.WHATSAPP);
        lenient().when(notificationLogCrudService.save(any(NotificationLogTbl.class))).thenAnswer(invocation -> invocation.getArgument(0));
        service = new MessagingServiceImpl(new MessagingChannels(List.of(smsProvider, whatsappProvider), false), notificationLogCrudService);
    }

    @Test
    @DisplayName("Sends on each requested channel and logs one masked row per channel without a user id")
    void sendsOnEveryChannel() {
        DeliveryReport report = service.send("9876543210", REMINDER, Set.of(NotificationChannel.SMS, NotificationChannel.WHATSAPP));

        assertEquals(Map.of(NotificationChannel.SMS, Outcome.SENT, NotificationChannel.WHATSAPP, Outcome.SENT), report.outcomes());
        verify(smsProvider).send(eq("919876543210"), any());
        verify(whatsappProvider).send(eq("919876543210"), any());

        List<NotificationLogTbl> rows = loggedRows();
        assertEquals(Set.of(NotificationChannel.SMS, NotificationChannel.WHATSAPP),
                Set.copyOf(rows.stream().map(NotificationLogTbl::getChannel).toList()));
        for (NotificationLogTbl row : rows) {
            assertNull(row.getRecipientId());
            assertEquals("******3210", row.getRecipientAddress());
            assertEquals("TOUR_REMINDER", row.getTemplate());
            assertEquals(NotificationStatus.SENT, row.getStatus());
        }
    }

    @Test
    @DisplayName("Fits values per channel: SMS gets DLT-length values, WhatsApp the full text")
    void fitsPerChannel() {
        TemplatedMessage longName = TemplatedMessage.of(MessageTemplate.TOUR_REMINDER, Map.of(
                "property", "Sunshine Residency Co-living for Working Professionals", "date", "Thu, 17 Sep", "time", "11:00 AM",
                "link", "http://localhost:3000/market-place/my-requests"));

        service.send("9876543210", longName, Set.of(NotificationChannel.SMS, NotificationChannel.WHATSAPP));

        ArgumentCaptor<TemplatedMessage> sms = ArgumentCaptor.forClass(TemplatedMessage.class);
        ArgumentCaptor<TemplatedMessage> whatsapp = ArgumentCaptor.forClass(TemplatedMessage.class);
        verify(smsProvider).send(any(), sms.capture());
        verify(whatsappProvider).send(any(), whatsapp.capture());
        assertEquals(MessageTemplate.MAX_SMS_VARIABLE_LENGTH, sms.getValue().variables().get("property").length());
        assertEquals("Sunshine Residency Co-living for Working Professionals", whatsapp.getValue().variables().get("property"));
    }

    @Test
    @DisplayName("Falls back to the next channel only when the first fails")
    void firstSuccessfulFallsBack() {
        doThrow(new NotificationSendException("rejected", null, false)).when(smsProvider).send(any(), any());

        DeliveryReport report = service.sendFirstSuccessful("9876543210", OTP, List.of(NotificationChannel.SMS, NotificationChannel.WHATSAPP));

        assertTrue(report.anySent());
        assertEquals(Outcome.FAILED, report.outcome(NotificationChannel.SMS));
        assertEquals(Outcome.SENT, report.outcome(NotificationChannel.WHATSAPP));

        clearInvocations(whatsappProvider);
        doNothing().when(smsProvider).send(any(), any());
        DeliveryReport smsWorks = service.sendFirstSuccessful("9876543210", OTP, List.of(NotificationChannel.SMS, NotificationChannel.WHATSAPP));
        assertEquals(Outcome.SKIPPED, smsWorks.outcome(NotificationChannel.WHATSAPP));
        verify(whatsappProvider, never()).send(any(), any());
    }

    @Test
    @DisplayName("Never stores a one-time code in the log")
    void redactsSensitiveBody() {
        service.send("9876543210", OTP, Set.of(NotificationChannel.SMS));

        assertEquals("[redacted]", loggedRows().getLast().getBody());
    }

    @Test
    @DisplayName("Retries a transient failure once for ordinary messages, never for one-time codes")
    void retries() {
        doThrow(new NotificationSendException("timeout", null, true)).doNothing().when(smsProvider).send(any(), any());
        assertEquals(Outcome.SENT, service.send("9876543210", REMINDER, Set.of(NotificationChannel.SMS)).outcome(NotificationChannel.SMS));
        verify(smsProvider, times(2)).send(any(), any());

        doThrow(new NotificationSendException("timeout", null, true)).when(whatsappProvider).send(any(), any());
        DeliveryReport otp = service.send("9876543210", OTP, Set.of(NotificationChannel.WHATSAPP));
        assertEquals(Outcome.FAILED, otp.outcome(NotificationChannel.WHATSAPP));
        verify(whatsappProvider, times(1)).send(any(), any());
        assertEquals("timeout", loggedRows().getLast().getErrorMessage());
    }

    @Test
    @DisplayName("Skips channels without a gateway and invalid numbers, without logging")
    void skipsUnavailable() {
        MessagingServiceImpl smsOnly = new MessagingServiceImpl(new MessagingChannels(List.of(smsProvider), false), notificationLogCrudService);

        DeliveryReport report = smsOnly.send("9876543210", REMINDER, Set.of(NotificationChannel.WHATSAPP));
        assertEquals(Outcome.SKIPPED, report.outcome(NotificationChannel.WHATSAPP));
        assertEquals(Set.of(NotificationChannel.SMS), smsOnly.availableChannels());

        assertFalse(service.send("12345", REMINDER, Set.of(NotificationChannel.SMS)).anySent());
        verifyNoInteractions(notificationLogCrudService);
    }

    @Test
    @DisplayName("Console fallback makes every messaging channel available")
    void consoleFallback() {
        MessagingServiceImpl dev = new MessagingServiceImpl(new MessagingChannels(List.of(), true), notificationLogCrudService);

        assertEquals(Set.of(NotificationChannel.SMS, NotificationChannel.WHATSAPP), dev.availableChannels());
        assertTrue(dev.send("9876543210", REMINDER, Set.of(NotificationChannel.WHATSAPP)).anySent());
    }

    private List<NotificationLogTbl> loggedRows() {
        ArgumentCaptor<NotificationLogTbl> captor = ArgumentCaptor.forClass(NotificationLogTbl.class);
        verify(notificationLogCrudService, atLeastOnce()).save(captor.capture());
        // Each row is saved twice (pending, then final); entities without an id compare equal, so dedupe by identity
        List<NotificationLogTbl> rows = new ArrayList<>();
        for (NotificationLogTbl row : captor.getAllValues()) {
            if (rows.stream().noneMatch(seen -> seen == row)) {
                rows.add(row);
            }
        }
        return rows;
    }
}
