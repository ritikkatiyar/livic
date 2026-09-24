package com.livic.platform.notification.service.impl;

import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.domain.NotificationLogTbl;
import com.livic.platform.notification.domain.NotificationStatus;
import com.livic.platform.notification.dto.DeliveryReport;
import com.livic.platform.notification.dto.DeliveryReport.Outcome;
import com.livic.platform.notification.dto.TemplatedMessage;
import com.livic.platform.notification.exception.NotificationSendException;
import com.livic.platform.notification.service.ChannelProvider;
import com.livic.platform.notification.service.MessagingService;
import com.livic.platform.notification.service.interfaces.NotificationLogCrudService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessagingServiceImpl implements MessagingService {

    private static final String REDACTED_BODY = "[redacted]";
    /** One retry for transient gateway failures. One-time codes are not retried: the user can ask for a new one. */
    private static final int MAX_ATTEMPTS = 2;

    private final MessagingChannels messagingChannels;
    private final NotificationLogCrudService notificationLogCrudService;

    @Override
    public DeliveryReport send(String phone, TemplatedMessage message, Set<NotificationChannel> channels) {
        Map<NotificationChannel, Outcome> outcomes = new EnumMap<>(NotificationChannel.class);
        Optional<String> msisdn = recipient(phone, message);
        for (NotificationChannel channel : channels) {
            outcomes.put(channel, msisdn.map(number -> deliver(number, message, channel)).orElse(Outcome.SKIPPED));
        }
        return new DeliveryReport(outcomes);
    }

    @Override
    public DeliveryReport sendFirstSuccessful(String phone, TemplatedMessage message, List<NotificationChannel> channelsInOrder) {
        Map<NotificationChannel, Outcome> outcomes = new EnumMap<>(NotificationChannel.class);
        Optional<String> msisdn = recipient(phone, message);
        boolean delivered = false;
        for (NotificationChannel channel : channelsInOrder) {
            Outcome outcome = delivered || msisdn.isEmpty() ? Outcome.SKIPPED : deliver(msisdn.get(), message, channel);
            outcomes.putIfAbsent(channel, outcome);
            delivered = delivered || outcome == Outcome.SENT;
        }
        return new DeliveryReport(outcomes);
    }

    @Override
    public Set<NotificationChannel> availableChannels() {
        return messagingChannels.available();
    }

    private Optional<String> recipient(String phone, TemplatedMessage message) {
        Optional<String> msisdn = PhoneNumbers.toIndianMsisdn(phone);
        if (msisdn.isEmpty()) {
            log.warn("message_skipped reason=invalid_phone template={} to={}", message.template(), PhoneNumbers.mask(phone));
        }
        return msisdn;
    }

    private Outcome deliver(String msisdn, TemplatedMessage message, NotificationChannel channel) {
        Optional<ChannelProvider> provider = messagingChannels.providerFor(channel);
        if (provider.isEmpty()) {
            log.warn("message_skipped reason=channel_unavailable channel={} template={} to={}",
                    channel, message.template(), PhoneNumbers.mask(msisdn));
            return Outcome.SKIPPED;
        }
        TemplatedMessage fitted = message.forChannel(channel);

        // Recipients may have no user account, so the log keeps a masked number instead of a user id
        NotificationLogTbl logEntry = notificationLogCrudService.save(NotificationLogTbl.builder()
                .channel(channel)
                .recipientAddress(PhoneNumbers.mask(msisdn))
                .template(message.template().name())
                .title(message.template().name())
                .body(message.template().sensitive() ? REDACTED_BODY : fitted.render())
                .status(NotificationStatus.PENDING)
                .build());

        int maxAttempts = message.template().sensitive() ? 1 : MAX_ATTEMPTS;
        boolean sent = false;
        for (int attempt = 1; attempt <= maxAttempts && !sent; attempt++) {
            try {
                provider.get().send(msisdn, fitted);
                sent = true;
            } catch (NotificationSendException e) {
                boolean retrying = e.isRetryable() && attempt < maxAttempts;
                log.warn("message_failed channel={} template={} to={} attempt={} retrying={} error={}",
                        channel, message.template(), PhoneNumbers.mask(msisdn), attempt, retrying, e.getMessage());
                logEntry.setErrorMessage(e.getMessage());
                if (!retrying) {
                    break;
                }
            }
        }

        logEntry.setStatus(sent ? NotificationStatus.SENT : NotificationStatus.FAILED);
        if (sent) {
            logEntry.setErrorMessage(null);
        }
        notificationLogCrudService.save(logEntry);
        return sent ? Outcome.SENT : Outcome.FAILED;
    }
}
