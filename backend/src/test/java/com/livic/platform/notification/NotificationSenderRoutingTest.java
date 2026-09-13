package com.livic.platform.notification;

import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.domain.NotificationLogTbl;
import com.livic.platform.notification.repository.NotificationLogRepository;
import com.livic.platform.notification.service.NotificationService;
import com.livic.platform.user.domain.DevicePlatform;
import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.user.facade.UserFacade;
import com.livic.platform.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class NotificationSenderRoutingTest {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserFacade userFacade;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationLogRepository notificationLogRepository;

    private UserTbl testUser;

    @BeforeEach
    public void setUp() {
        testUser = UserTbl.builder()
                .authUid("routing-test-" + UUID.randomUUID() + "@test.com")
                .fullName("Test Routing User")
                .phoneNumber("+91" + (9000000000L + (long)(Math.random() * 999999999)))
                .build();
        testUser = userRepository.save(testUser);
    }

    @Test
    public void testPushNotificationWithMultipleDeviceTokens() {
        String token1 = "ExponentPushToken[device-token-1]";
        String token2 = "ExponentPushToken[device-token-2]";

        // 1. Register two tokens for the same user
        userFacade.registerDeviceToken(testUser.getId(), token1, DevicePlatform.IOS);
        userFacade.registerDeviceToken(testUser.getId(), token2, DevicePlatform.ANDROID);

        // 2. Dispatch a PUSH notification to the user
        notificationService.send(testUser.getId().toString(), NotificationChannel.PUSH, "Test Push Title", "Test Push Body");

        // 3. Verify that two separate audit log entries were saved (one for each token)
        List<NotificationLogTbl> logs = notificationLogRepository.findByRecipientId(testUser.getId());
        
        List<NotificationLogTbl> pushLogs = logs.stream()
                .filter(l -> l.getChannel() == NotificationChannel.PUSH)
                .toList();

        assertEquals(2, pushLogs.size(), "Should have logged two push notifications (one per device token)");

        boolean hasToken1 = pushLogs.stream().anyMatch(l -> token1.equals(l.getRecipientAddress()));
        boolean hasToken2 = pushLogs.stream().anyMatch(l -> token2.equals(l.getRecipientAddress()));

        assertTrue(hasToken1, "Should contain audit log for token1");
        assertTrue(hasToken2, "Should contain audit log for token2");
    }

    @Test
    public void testPushNotificationWithNoRegisteredTokens() {
        // Dispatch PUSH notification when user has no tokens
        notificationService.send(testUser.getId().toString(), NotificationChannel.PUSH, "Title", "Body");

        // Verify no PUSH logs were created
        List<NotificationLogTbl> logs = notificationLogRepository.findByRecipientId(testUser.getId());
        List<NotificationLogTbl> pushLogs = logs.stream()
                .filter(l -> l.getChannel() == NotificationChannel.PUSH)
                .toList();

        assertTrue(pushLogs.isEmpty(), "Should skip and write no logs when user has no registered tokens");
    }
}
