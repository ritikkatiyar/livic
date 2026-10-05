package com.livic.platform.notification.event;

import com.livic.platform.auth.event.EmailVerificationRequestedEvent;
import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.service.interfaces.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Sends what platform itself asks for: the email verification code. Business modules word and send
 * their own notices through the outbox.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;

    /**
     * Fires after the signup/resend transaction commits, so the recipient row is guaranteed to exist.
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onEmailVerificationRequested(EmailVerificationRequestedEvent event) {
        log.info("[NotificationEventListener] EmailVerificationRequestedEvent received for userId={}", event.getRecipientUserId());

        String title = "Your Livic verification code";
        String body = String.format(
                "Your Livic verification code is %s.\n\nIt expires in %d minutes. If you didn't try to sign up, you can ignore this email.",
                event.getCode(),
                event.getExpiresInMinutes()
        );

        notificationService.sendSensitive(event.getRecipientUserId(), NotificationChannel.EMAIL, title, body);
    }
}
