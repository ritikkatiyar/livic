package com.livic.platform.notification;

import com.livic.platform.common.event.IssueCreatedEvent;
import com.livic.platform.common.event.IssueEscalatedEvent;
import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.domain.NotificationLogTbl;
import com.livic.platform.notification.domain.NotificationStatus;
import com.livic.platform.notification.repository.NotificationLogRepository;
import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test for the Notification Infrastructure (Phase 1).
 *
 * Verifies:
 * 1. Spring ApplicationEvents are published and intercepted by the listener.
 * 2. ConsoleNotificationSender mock logs the dispatch (no real API calls).
 * 3. Notification audit log records are persisted to the database correctly.
 */
@SpringBootTest
@ActiveProfiles("dev")
public class NotificationIntegrationTest {

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private NotificationLogRepository notificationLogRepository;

    @Autowired
    private UserRepository userRepository;

    private UserTbl testUser;

    @BeforeEach
    public void setUp() {
        testUser = UserTbl.builder()
                .authUid("notification-test-" + UUID.randomUUID() + "@test.com")
                .fullName("Test Tenant")
                .phoneNumber("+91" + (9000000000L + (long)(Math.random() * 999999999)))
                .failedLoginAttempts(0)
                .build();
        testUser = userRepository.save(testUser);
    }

    @Test
    public void testIssueCreatedEventTriggersNotificationLog() throws InterruptedException {
        // Arrange
        IssueCreatedEvent event = new IssueCreatedEvent(
                this,
                UUID.randomUUID().toString(),
                "Sunrise Apartments",
                "302",
                "Rahul Kumar",
                "Water Leak in Bathroom",
                "There is a persistent leak from the overhead pipe.",
                testUser.getId().toString()
        );

        // Act - publish the Spring event (observer pattern trigger)
        eventPublisher.publishEvent(event);

        // Wait for @Async processing to complete
        List<NotificationLogTbl> logs = List.of();
        for (int i = 0; i < 30; i++) {
            logs = notificationLogRepository.findByRecipientId(testUser.getId());
            if (!logs.isEmpty()) {
                break;
            }
            TimeUnit.MILLISECONDS.sleep(100);
        }

        // Assert - verify audit log was saved to DB
        assertFalse(logs.isEmpty(), "At least one notification log should be persisted after IssueCreatedEvent");

        NotificationLogTbl emailLog = logs.stream()
                .filter(l -> l.getChannel() == NotificationChannel.EMAIL)
                .findFirst()
                .orElse(null);

        assertNotNull(emailLog, "An EMAIL notification log should be present");
        assertEquals(testUser.getAuthUid(), emailLog.getRecipientAddress());
        assertEquals("New Issue Raised: Water Leak in Bathroom", emailLog.getTitle());
        assertNotEquals(NotificationStatus.FAILED, emailLog.getStatus(), "Notification should not have failed");
    }

    @Test
    public void testIssueEscalatedEventTriggersNotificationLog() throws InterruptedException {
        // Arrange
        IssueEscalatedEvent event = new IssueEscalatedEvent(
                this,
                UUID.randomUUID().toString(),
                "Sunrise Apartments",
                "302",
                "Water Leak in Bathroom",
                "Landlord has not responded in 3 days.",
                testUser.getId().toString()
        );

        // Act
        eventPublisher.publishEvent(event);
        
        // Wait for @Async processing to complete
        List<NotificationLogTbl> logs = List.of();
        for (int i = 0; i < 30; i++) {
            logs = notificationLogRepository.findByRecipientId(testUser.getId());
            if (!logs.isEmpty()) {
                break;
            }
            TimeUnit.MILLISECONDS.sleep(100);
        }

        // Assert
        assertFalse(logs.isEmpty(), "At least one escalation notification log should be persisted");

        boolean hasEscalationTitle = logs.stream()
                .anyMatch(l -> l.getTitle().contains("ESCALATED"));
        assertTrue(hasEscalationTitle, "At least one log should have ESCALATED in the title");
    }
}
