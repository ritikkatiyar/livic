package com.livic.platform.notification.service.impl;

import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.domain.NotificationLogTbl;
import com.livic.platform.notification.domain.NotificationStatus;
import com.livic.platform.notification.dto.TemplatedMessage;
import com.livic.platform.notification.exception.NotificationSendException;
import com.livic.platform.notification.service.SmsProvider;
import com.livic.platform.notification.service.SmsService;
import com.livic.platform.notification.service.interfaces.NotificationLogCrudService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SmsServiceImpl implements SmsService {

    private static final String REDACTED_BODY = "[redacted]";
    /** One retry for transient gateway failures. One-time codes are not retried: the user can ask for a new one. */
    private static final int MAX_ATTEMPTS = 2;

    private final SmsProvider smsProvider;
    private final NotificationLogCrudService notificationLogCrudService;

    @Override
    public boolean sendToPhone(String phone, TemplatedMessage message) {
        Optional<String> msisdn = PhoneNumbers.toIndianMsisdn(phone);
        if (msisdn.isEmpty()) {
            log.warn("sms_skipped reason=invalid_phone template={} to={}", message.template(), PhoneNumbers.mask(phone));
            return false;
        }

        // Recipients here may have no user account, so the log keeps a masked number instead of a user id
        NotificationLogTbl logEntry = notificationLogCrudService.save(NotificationLogTbl.builder()
                .channel(NotificationChannel.SMS)
                .recipientAddress(PhoneNumbers.mask(msisdn.get()))
                .template(message.template().name())
                .title(message.template().name())
                .body(message.template().sensitive() ? REDACTED_BODY : message.render())
                .status(NotificationStatus.PENDING)
                .build());

        int maxAttempts = message.template().sensitive() ? 1 : MAX_ATTEMPTS;
        boolean sent = false;
        for (int attempt = 1; attempt <= maxAttempts && !sent; attempt++) {
            try {
                smsProvider.send(msisdn.get(), message);
                sent = true;
            } catch (NotificationSendException e) {
                boolean retrying = e.isRetryable() && attempt < maxAttempts;
                log.warn("sms_failed template={} to={} attempt={} retrying={} error={}",
                        message.template(), PhoneNumbers.mask(msisdn.get()), attempt, retrying, e.getMessage());
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
        return sent;
    }
}
