package com.livic.platform.notification.service.impl;

import com.livic.platform.notification.domain.MessageTemplate;
import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.domain.NotificationLogTbl;
import com.livic.platform.notification.domain.NotificationStatus;
import com.livic.platform.notification.dto.TemplatedMessage;
import com.livic.platform.notification.exception.NotificationSendException;
import com.livic.platform.notification.service.SmsProvider;
import com.livic.platform.notification.service.interfaces.NotificationLogCrudService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SmsServiceImplTest {

    private static final TemplatedMessage OTP = TemplatedMessage.of(MessageTemplate.MARKETPLACE_OTP, Map.of("otp", "482913", "minutes", "5"));
    private static final TemplatedMessage REMINDER = TemplatedMessage.of(MessageTemplate.TOUR_REMINDER, Map.of(
            "property", "Test Residency", "date", "Thu, 17 Sep", "time", "11:00 AM", "link", "http://localhost:3000/market-place/my-requests"));

    @Mock private SmsProvider smsProvider;
    @Mock private NotificationLogCrudService notificationLogCrudService;
    @InjectMocks private SmsServiceImpl smsService;

    @BeforeEach
    void setUp() {
        lenient().when(notificationLogCrudService.save(any(NotificationLogTbl.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    @DisplayName("Sends to the normalized number and logs a masked address without a user id")
    void sendsAndLogs() {
        assertTrue(smsService.sendToPhone("9876543210", REMINDER));

        verify(smsProvider).send("919876543210", REMINDER);
        NotificationLogTbl entry = lastLogEntry();
        assertNull(entry.getRecipientId());
        assertEquals(NotificationChannel.SMS, entry.getChannel());
        assertEquals("******3210", entry.getRecipientAddress());
        assertEquals("TOUR_REMINDER", entry.getTemplate());
        assertEquals(REMINDER.render(), entry.getBody());
        assertEquals(NotificationStatus.SENT, entry.getStatus());
    }

    @Test
    @DisplayName("Never stores a one-time code in the log")
    void redactsSensitiveBody() {
        assertTrue(smsService.sendToPhone("9876543210", OTP));

        NotificationLogTbl entry = lastLogEntry();
        assertEquals("[redacted]", entry.getBody());
    }

    @Test
    @DisplayName("Retries a transient failure once for ordinary messages")
    void retriesTransientFailure() {
        doThrow(new NotificationSendException("timeout", null, true)).doNothing()
                .when(smsProvider).send(eq("919876543210"), any());

        assertTrue(smsService.sendToPhone("9876543210", REMINDER));

        verify(smsProvider, times(2)).send(eq("919876543210"), any());
        NotificationLogTbl entry = lastLogEntry();
        assertEquals(NotificationStatus.SENT, entry.getStatus());
        assertNull(entry.getErrorMessage());
    }

    @Test
    @DisplayName("Does not retry one-time codes or rejected messages, and records the failure")
    void noRetryForOtpOrRejection() {
        doThrow(new NotificationSendException("timeout", null, true)).when(smsProvider).send(any(), eq(OTP));
        doThrow(new NotificationSendException("invalid template", null, false)).when(smsProvider).send(any(), eq(REMINDER));

        assertFalse(smsService.sendToPhone("9876543210", OTP));
        assertEquals(NotificationStatus.FAILED, lastLogEntry().getStatus());
        assertFalse(smsService.sendToPhone("9876543210", REMINDER));
        assertEquals("invalid template", lastLogEntry().getErrorMessage());

        verify(smsProvider, times(1)).send(any(), eq(OTP));
        verify(smsProvider, times(1)).send(any(), eq(REMINDER));
    }

    @Test
    @DisplayName("Skips invalid numbers without calling the gateway")
    void skipsInvalidNumber() {
        assertFalse(smsService.sendToPhone("12345", REMINDER));

        verifyNoInteractions(smsProvider, notificationLogCrudService);
    }

    private NotificationLogTbl lastLogEntry() {
        ArgumentCaptor<NotificationLogTbl> captor = ArgumentCaptor.forClass(NotificationLogTbl.class);
        verify(notificationLogCrudService, atLeastOnce()).save(captor.capture());
        return captor.getValue();
    }
}
