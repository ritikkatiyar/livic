package com.livic.platform.notification.service.impl;

import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.service.NotificationChannelSender;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;

/**
 * Mock/development implementation of NotificationChannelSender.
 *
 * During local development (when no SMTP or Twilio keys are configured),
 * this sender prints the notification payload to the Spring Boot console log
 * instead of making real external API calls.
 *
 * Design Notes:
 * - SRP: This class is solely responsible for mock console output.
 * - OCP: To swap in a real sender, add a new @Component class. This class is untouched.
 * - This bean is always registered and serves as the universal fallback.
 */
@Slf4j
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class ConsoleNotificationSender implements NotificationChannelSender {

    @Override
    public boolean supports(NotificationChannel channel) {
        // Acts as the universal fallback - supports all channels in dev mode
        return true;
    }

    @Override
    public void send(String recipientAddress, String title, String body) {
        log.info("""
                ╔══════════════════════════════════════════╗
                ║        [NOTIFICATION MOCK - DEV]         ║
                ╠══════════════════════════════════════════╣
                ║ To      : {}
                ║ Subject : {}
                ║ Body    : {}
                ╚══════════════════════════════════════════╝
                """, recipientAddress, title, body);
    }
}
