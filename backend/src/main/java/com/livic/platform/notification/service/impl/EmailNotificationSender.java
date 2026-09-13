package com.livic.platform.notification.service.impl;

import com.livic.platform.notification.config.EmailProperties;
import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.exception.NotificationSendException;
import com.livic.platform.notification.service.NotificationChannelSender;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@Order(1)
@ConditionalOnProperty(prefix = "email", name = "enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationSender implements NotificationChannelSender {

    private final EmailProperties emailProperties;
    private final JavaMailSender mailSender;

    @Override
    public boolean supports(NotificationChannel channel) {
        return channel == NotificationChannel.EMAIL;
    }

    @Override
    public void send(String recipientAddress, String title, String body) {
        log.info("[EmailNotificationSender] Attempting to send email to {}", recipientAddress);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(emailProperties.getFromAddress());
            message.setTo(recipientAddress);
            message.setSubject(title);
            message.setText(body);

            mailSender.send(message);
            log.info("[EmailNotificationSender] Email sent successfully to {}", recipientAddress);
        } catch (Exception e) {
            log.error("[EmailNotificationSender] Failed to send email to {}: {}", recipientAddress, e.getMessage(), e);
            throw new NotificationSendException("Email delivery failed: " + e.getMessage(), e);
        }
    }
}
