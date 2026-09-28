package com.livic.platform.notification.service.impl;

import com.livic.platform.notification.domain.MessageTemplate;
import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.domain.NotificationLogTbl;
import com.livic.platform.notification.domain.NotificationStatus;
import com.livic.platform.notification.dto.DeliveryReport;
import com.livic.platform.notification.dto.DeliveryReport.Outcome;
import com.livic.platform.notification.dto.TemplatedMessage;
import com.livic.platform.notification.repository.NotificationLogRepository;
import com.livic.platform.notification.service.interfaces.NotificationChannelSender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Messages go to a phone number rather than a user, over the platform's channel senders. A channel with no
 * gateway is skipped rather than reported as sent, and each attempt is logged with a masked number.
 */
class MessagingServiceImplTest {

    private static final String PHONE = "9876543210";
    private static final String LONG_PROPERTY = "Sunshine Residency Co-living for Working Professionals";

    private NotificationLogRepository logRepository;
    private final List<NotificationLogTbl> saved = new ArrayList<>();

    @BeforeEach
    void setUp() {
        saved.clear();
        logRepository = mock(NotificationLogRepository.class);
        when(logRepository.save(any(NotificationLogTbl.class))).thenAnswer(invocation -> {
            NotificationLogTbl row = invocation.getArgument(0);
            saved.add(row);
            return row;
        });
    }

    @Test
    @DisplayName("Sends on every requested channel and logs each attempt against a masked number")
    void sendsOnEveryChannel() {
        RecordingSender sms = new RecordingSender(NotificationChannel.SMS);
        RecordingSender whatsapp = new RecordingSender(NotificationChannel.WHATSAPP);
        MessagingServiceImpl service = service(false, sms, whatsapp);

        DeliveryReport report = service.send(PHONE, reminder(LONG_PROPERTY),
                Set.of(NotificationChannel.SMS, NotificationChannel.WHATSAPP));

        assertEquals(Map.of(NotificationChannel.SMS, Outcome.SENT, NotificationChannel.WHATSAPP, Outcome.SENT),
                report.outcomes());
        assertEquals(1, sms.sent.size());
        assertEquals(1, whatsapp.sent.size());
        assertEquals("******3210", saved.get(0).getRecipientAddress());
        assertEquals("TOUR_REMINDER", saved.get(0).getTemplate());
        assertEquals(NotificationStatus.SENT, saved.get(saved.size() - 1).getStatus());
    }

    @Test
    @DisplayName("An SMS is cut to the DLT variable limit while WhatsApp keeps the full text")
    void fitsPerChannel() {
        RecordingSender sms = new RecordingSender(NotificationChannel.SMS);
        RecordingSender whatsapp = new RecordingSender(NotificationChannel.WHATSAPP);
        MessagingServiceImpl service = service(false, sms, whatsapp);

        service.send(PHONE, reminder(LONG_PROPERTY), Set.of(NotificationChannel.SMS, NotificationChannel.WHATSAPP));

        assertFalse(sms.sent.get(0).contains(LONG_PROPERTY));
        assertTrue(sms.sent.get(0).contains(LONG_PROPERTY.substring(0, MessageTemplate.MAX_SMS_VARIABLE_LENGTH - 3)));
        assertTrue(whatsapp.sent.get(0).contains(LONG_PROPERTY));
    }

    @Test
    @DisplayName("sendFirstSuccessful moves to the next channel when the first one fails")
    void firstSuccessfulFallsBack() {
        RecordingSender sms = new RecordingSender(NotificationChannel.SMS, new RuntimeException("rejected"));
        RecordingSender whatsapp = new RecordingSender(NotificationChannel.WHATSAPP);
        MessagingServiceImpl service = service(false, sms, whatsapp);

        DeliveryReport report = service.sendFirstSuccessful(PHONE, reminder("Sunshine"),
                List.of(NotificationChannel.SMS, NotificationChannel.WHATSAPP));

        assertTrue(report.anySent());
        assertEquals(Outcome.FAILED, report.outcome(NotificationChannel.SMS));
        assertEquals(Outcome.SENT, report.outcome(NotificationChannel.WHATSAPP));
    }

    @Test
    @DisplayName("Without a gateway the channel is skipped, so nothing is reported as delivered")
    void channelWithoutGatewayIsSkipped() {
        MessagingServiceImpl service = service(false, new RecordingSender(NotificationChannel.SMS));

        DeliveryReport report = service.send(PHONE, reminder("Sunshine"), Set.of(NotificationChannel.WHATSAPP));

        assertEquals(Outcome.SKIPPED, report.outcome(NotificationChannel.WHATSAPP));
        assertFalse(report.anySent());
        assertTrue(saved.isEmpty());
    }

    private MessagingServiceImpl service(boolean consoleFallback, NotificationChannelSender... senders) {
        return new MessagingServiceImpl(List.of(senders), logRepository, consoleFallback);
    }

    private TemplatedMessage reminder(String property) {
        return TemplatedMessage.of(MessageTemplate.TOUR_REMINDER, Map.of(
                "property", property,
                "date", "12 Oct",
                "time", "4:00 PM",
                "link", "https://livic.example/tours/1"));
    }

    /** A gateway that records what it was asked to send, and can fail like a rejecting provider. */
    private static final class RecordingSender implements NotificationChannelSender {

        private final NotificationChannel channel;
        private final RuntimeException failure;
        private final List<String> sent = new ArrayList<>();

        RecordingSender(NotificationChannel channel) {
            this(channel, null);
        }

        RecordingSender(NotificationChannel channel, RuntimeException failure) {
            this.channel = channel;
            this.failure = failure;
        }

        @Override
        public boolean supports(NotificationChannel candidate) {
            return candidate == channel;
        }

        @Override
        public void send(String recipientAddress, String title, String body) {
            if (failure != null) {
                throw failure;
            }
            sent.add(body);
        }
    }
}
