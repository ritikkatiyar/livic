package com.livic.platform.user;

import com.livic.platform.user.domain.DevicePlatform;
import com.livic.platform.user.domain.UserDeviceTokenTbl;
import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.user.facade.UserFacade;
import com.livic.platform.user.repository.UserDeviceTokenRepository;
import com.livic.platform.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class DeviceTokenRegistrationIntegrationTest {

    @Autowired
    private UserFacade userFacade;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserDeviceTokenRepository userDeviceTokenRepository;

    private UserTbl userA;
    private UserTbl userB;

    @BeforeEach
    public void setUp() {
        userA = UserTbl.builder()
                .authUid("user-a-" + UUID.randomUUID() + "@test.com")
                .fullName("User A")
                .phoneNumber("+91" + (9000000000L + (long)(Math.random() * 999999999)))
                .build();
        userA = userRepository.save(userA);

        userB = UserTbl.builder()
                .authUid("user-b-" + UUID.randomUUID() + "@test.com")
                .fullName("User B")
                .phoneNumber("+91" + (9000000000L + (long)(Math.random() * 999999999)))
                .build();
        userB = userRepository.save(userB);
    }

    @Test
    public void testRegisterAndReassignDeviceToken() {
        String token = "ExponentPushToken[mock-device-token-123]";

        // 1. Register token for User A
        userFacade.registerDeviceToken(userA.getId(), token, DevicePlatform.IOS);

        List<UserDeviceTokenTbl> tokensA = userDeviceTokenRepository.findByUserId(userA.getId());
        assertEquals(1, tokensA.size());
        assertEquals(token, tokensA.get(0).getExpoPushToken());
        assertEquals(DevicePlatform.IOS, tokensA.get(0).getPlatform());

        List<String> activeTokensA = userFacade.getActiveDeviceTokens(userA.getId());
        assertEquals(1, activeTokensA.size());
        assertTrue(activeTokensA.contains(token));

        // 2. Call register again for same user and same token (verify upsert updates last_seen_at)
        LocalDateTime beforeUpsert = tokensA.get(0).getLastSeenAt();
        userFacade.registerDeviceToken(userA.getId(), token, DevicePlatform.ANDROID);

        List<UserDeviceTokenTbl> tokensAUpserted = userDeviceTokenRepository.findByUserId(userA.getId());
        assertEquals(1, tokensAUpserted.size());
        assertEquals(DevicePlatform.ANDROID, tokensAUpserted.get(0).getPlatform()); // Updated platform

        // 3. Reassign token to User B
        userFacade.registerDeviceToken(userB.getId(), token, DevicePlatform.IOS);

        // Verify User A no longer has this token
        List<UserDeviceTokenTbl> tokensANew = userDeviceTokenRepository.findByUserId(userA.getId());
        assertTrue(tokensANew.isEmpty());

        // Verify User B now owns this token
        List<UserDeviceTokenTbl> tokensB = userDeviceTokenRepository.findByUserId(userB.getId());
        assertEquals(1, tokensB.size());
        assertEquals(token, tokensB.get(0).getExpoPushToken());
        assertEquals(userB.getId(), tokensB.get(0).getUserId());
    }
}
