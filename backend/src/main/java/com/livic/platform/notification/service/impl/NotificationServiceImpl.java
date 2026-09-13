package com.livic.platform.notification.service.impl;

import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.domain.NotificationLogTbl;
import com.livic.platform.notification.domain.NotificationStatus;
import com.livic.platform.notification.service.interfaces.NotificationLogCrudService;
import com.livic.platform.notification.service.NotificationChannelSender;
import com.livic.platform.notification.service.NotificationService;
import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Core orchestrator for resolving the correct NotificationChannelSender strategy,
 * dispatching messages, and persisting audit logs.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    /** All NotificationChannelSender @Component beans are auto-injected here by Spring */
    private final List<NotificationChannelSender> senders;
    private final NotificationLogCrudService notificationLogCrudService;
    private final UserFacade userFacade;

    private static final String REDACTED_BODY = "[redacted]";

    @Override
    public void send(String recipientUserId, NotificationChannel channel, String title, String body) {
        dispatch(recipientUserId, channel, title, body, body);
    }

    @Override
    public void sendSensitive(String recipientUserId, NotificationChannel channel, String title, String body) {
        dispatch(recipientUserId, channel, title, body, REDACTED_BODY);
    }

    private void dispatch(String recipientUserId, NotificationChannel channel, String title, String body, String loggedBody) {
        UserSummaryDTO recipient;
        try {
            recipient = userFacade.getUserById(UUID.fromString(recipientUserId)).orElse(null);
            if (recipient == null) {
                log.warn("[NotificationService] Recipient user not found: {}. Skipping.", recipientUserId);
                return;
            }
        } catch (Exception e) {
            log.warn("[NotificationService] Recipient user not found: {}. Skipping.", recipientUserId);
            return;
        }

        // Check user's channel preferences
        if (!isChannelEnabledForUser(recipient.id(), channel)) {
            log.info("[NotificationService] User {} has disabled {} notifications. Skipping.", recipientUserId, channel);
            return;
        }

        // Resolve recipient contact addresses based on channel
        List<String> addresses = resolveAddresses(recipient, channel);
        if (addresses.isEmpty()) {
            log.warn("[NotificationService] No {} contact on record for user {}. Skipping.", channel, recipientUserId);
            return;
        }

        // Resolve the first matching strategy sender (Strategy Pattern)
        NotificationChannelSender sender = senders.stream()
                .filter(s -> s.supports(channel))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No sender found for channel: " + channel));

        for (String address : addresses) {
            // Persist an audit log record with PENDING status
            NotificationLogTbl logEntry = NotificationLogTbl.builder()
                    .recipientId(recipient.id())
                    .channel(channel)
                    .recipientAddress(address)
                    .title(title)
                    .body(loggedBody)
                    .status(NotificationStatus.PENDING)
                    .build();
            notificationLogCrudService.save(logEntry);

            // Dispatch and update audit log status
            try {
                sender.send(address, title, body);
                logEntry.setStatus(NotificationStatus.SENT);
            } catch (Exception e) {
                log.error("[NotificationService] Failed to send {} notification to {}: {}", channel, address, e.getMessage());
                logEntry.setStatus(NotificationStatus.FAILED);
                logEntry.setErrorMessage(e.getMessage());
            } finally {
                notificationLogCrudService.save(logEntry);
            }
        }
    }

    @Override
    public void sendBulk(List<String> recipientUserIds, NotificationChannel channel, String title, String body) {
        List<UUID> uuids = recipientUserIds.stream()
                .map(id -> {
                    try { return UUID.fromString(id); }
                    catch (Exception e) { return null; }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (uuids.isEmpty()) return;

        Map<UUID, UserSummaryDTO> recipients = userFacade.getUsersByIds(uuids);
        List<NotificationLogTbl> logs = new ArrayList<>();

        for (UUID uuid : uuids) {
            UserSummaryDTO user = recipients.get(uuid);
            if (user == null) continue;
            if (!isChannelEnabledForUser(user.id(), channel)) {
                log.info("[NotificationService] User {} has disabled {} notifications. Skipping from bulk dispatch.", user.id(), channel);
                continue;
            }
            List<String> addresses = resolveAddresses(user, channel);
            if (addresses.isEmpty()) continue;

            for (String address : addresses) {
                NotificationLogTbl logEntry = NotificationLogTbl.builder()
                        .recipientId(user.id())
                        .channel(channel)
                        .recipientAddress(address)
                        .title(title)
                        .body(body)
                        .status(NotificationStatus.PENDING)
                        .build();
                logs.add(logEntry);
            }
        }

        if (logs.isEmpty()) return;

        notificationLogCrudService.saveAll(logs);

        NotificationChannelSender sender = senders.stream()
                .filter(s -> s.supports(channel))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No sender found for channel: " + channel));

        for (NotificationLogTbl logEntry : logs) {
            try {
                sender.send(logEntry.getRecipientAddress(), title, body);
                logEntry.setStatus(NotificationStatus.SENT);
            } catch (Exception e) {
                log.error("[NotificationService] Failed to send {} notification to {}: {}", channel, logEntry.getRecipientAddress(), e.getMessage());
                logEntry.setStatus(NotificationStatus.FAILED);
                logEntry.setErrorMessage(e.getMessage());
            }
        }

        notificationLogCrudService.saveAll(logs);
    }

    private List<String> resolveAddresses(UserSummaryDTO user, NotificationChannel channel) {
        return switch (channel) {
            case EMAIL -> (user.authUid() != null && !user.authUid().isBlank()) ? List.of(user.authUid()) : List.of();
            case WHATSAPP, SMS -> (user.phoneNumber() != null && !user.phoneNumber().isBlank()) ? List.of(user.phoneNumber()) : List.of();
            case PUSH -> userFacade.getActiveDeviceTokens(user.id());
        };
    }

    private boolean isChannelEnabledForUser(UUID userId, NotificationChannel channel) {
        com.livic.platform.user.dto.UserNotificationPreferencesDTO prefs = userFacade.getNotificationPreferences(userId);
        return switch (channel) {
            case EMAIL -> prefs.emailEnabled();
            case PUSH -> prefs.pushEnabled();
            case WHATSAPP, SMS -> prefs.whatsappEnabled();
        };
    }
}
