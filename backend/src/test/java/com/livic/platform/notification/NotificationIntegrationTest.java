package com.livic.platform.notification;

import com.livic.core.community.issue.event.IssueCreatedEvent;
import com.livic.core.community.issue.event.IssueEscalatedEvent;
import com.livic.platform.outbox.facade.OutboxFacade;
import com.livic.platform.outbox.service.impl.OutboxDelivery;
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
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Issue notices go out end to end: the issue module publishes through the outbox, its notifier words
 * the message, and NotificationService sends it (to the console in dev) and logs it.
 */
@SpringBootTest
@ActiveProfiles("dev")
public class NotificationIntegrationTest {

    @Autowired
    private OutboxFacade outboxFacade;

    @Autowired
    private OutboxDelivery outboxDelivery;

    @Autowired
    private PlatformTransactionManager transactionManager;

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
                UUID.randomUUID().toString(),
                "Sunrise Apartments",
                "302",
                "Rahul Kumar",
                "Water Leak in Bathroom",
                "There is a persistent leak from the overhead pipe.",
                testUser.getId().toString()
        );

        // Act - the issue module publishes through the outbox; the notice goes out in the background
        publishAndDeliver(event);

        // The poller may have delivered it first; either way the log appears
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
                UUID.randomUUID().toString(),
                "Sunrise Apartments",
                "302",
                "Water Leak in Bathroom",
                "Landlord has not responded in 3 days.",
                testUser.getId().toString()
        );

        // Act
        publishAndDeliver(event);
        
        // The poller may have delivered it first; either way the log appears
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

    private void publishAndDeliver(Object event) {
        new TransactionTemplate(transactionManager).executeWithoutResult(tx -> outboxFacade.publish(event));
        outboxDelivery.deliverDue();
    }
}
