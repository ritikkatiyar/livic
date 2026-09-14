package com.livic.features.marketplace;

import com.livic.platform.common.exception.BusinessException;
import com.livic.features.marketplace.domain.OtpVerificationTbl;
import com.livic.features.marketplace.dto.OtpDTOs;
import com.livic.features.marketplace.repository.OtpVerificationRepository;
import com.livic.features.marketplace.service.impl.OtpServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OtpServiceTest {

    @Mock
    private OtpVerificationRepository otpRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private OtpServiceImpl otpService;

    private static final String TEST_PHONE = "9876543210";
    private static final String TEST_CODE = "123456";
    private static final String HASHED_CODE = "$2a$10$hashedOtpCodeForTesting";

    @BeforeEach
    public void setUp() {
        // Any common setup if needed
    }

    @Test
    @DisplayName("Request OTP - Success")
    public void testRequestOtpSuccess() {
        when(otpRepository.findByPhoneAndCreatedAtAfter(eq(TEST_PHONE), any(Instant.class)))
                .thenReturn(Collections.emptyList());
        when(passwordEncoder.encode(any(String.class))).thenReturn(HASHED_CODE);

        OtpDTOs.OtpRequestRequest request = new OtpDTOs.OtpRequestRequest(TEST_PHONE);
        OtpDTOs.OtpRequestResponse response = otpService.requestOtp(request);

        assertTrue(response.success());
        assertEquals("OTP sent successfully", response.message());
        assertEquals(300, response.expiresSeconds());

        ArgumentCaptor<OtpVerificationTbl> captor = ArgumentCaptor.forClass(OtpVerificationTbl.class);
        verify(otpRepository).save(captor.capture());
        assertEquals(TEST_PHONE, captor.getValue().getPhone());
        assertEquals(HASHED_CODE, captor.getValue().getOtpCodeHash());
        assertEquals(0, captor.getValue().getAttempts());
    }

    @Test
    @DisplayName("Request OTP - Fails when requested within 60s cooldown")
    public void testRequestOtpCooldownFailure() {
        OtpVerificationTbl recentReq = OtpVerificationTbl.builder().phone(TEST_PHONE).build();
        when(otpRepository.findByPhoneAndCreatedAtAfter(eq(TEST_PHONE), any(Instant.class)))
                .thenReturn(List.of(recentReq));

        OtpDTOs.OtpRequestRequest request = new OtpDTOs.OtpRequestRequest(TEST_PHONE);
        BusinessException exception = assertThrows(BusinessException.class, () -> otpService.requestOtp(request));

        assertTrue(exception.getMessage().contains("cooldown") || exception.getMessage().contains("another OTP"));
        verify(otpRepository, never()).save(any());
    }

    @Test
    @DisplayName("Verify OTP - Success returns Session Token")
    public void testVerifyOtpSuccess() {
        OtpVerificationTbl entity = OtpVerificationTbl.builder()
                .phone(TEST_PHONE)
                .otpCodeHash(HASHED_CODE)
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .attempts(0)
                .build();

        when(otpRepository.findTopByPhoneOrderByCreatedAtDesc(TEST_PHONE)).thenReturn(Optional.of(entity));
        when(passwordEncoder.matches(TEST_CODE, HASHED_CODE)).thenReturn(true);

        OtpDTOs.OtpVerifyRequest verifyRequest = new OtpDTOs.OtpVerifyRequest(TEST_PHONE, TEST_CODE);
        OtpDTOs.OtpVerifyResponse response = otpService.verifyOtp(verifyRequest);

        assertNotNull(response.sessionToken());
        assertTrue(response.sessionToken().startsWith("livic_otp_session_"));
        assertNotNull(response.expiresAt());
        assertNotNull(entity.getVerifiedAt());

        verify(otpRepository).save(entity);
    }

    @Test
    @DisplayName("Verify OTP - Fails when maximum attempts exceeded")
    public void testVerifyOtpMaxAttemptsExceeded() {
        OtpVerificationTbl entity = OtpVerificationTbl.builder()
                .phone(TEST_PHONE)
                .otpCodeHash(HASHED_CODE)
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .attempts(5)
                .build();

        when(otpRepository.findTopByPhoneOrderByCreatedAtDesc(TEST_PHONE)).thenReturn(Optional.of(entity));

        OtpDTOs.OtpVerifyRequest verifyRequest = new OtpDTOs.OtpVerifyRequest(TEST_PHONE, TEST_CODE);
        BusinessException exception = assertThrows(BusinessException.class, () -> otpService.verifyOtp(verifyRequest));

        assertTrue(exception.getMessage().contains("Maximum verification attempts exceeded"));
    }

    @Test
    @DisplayName("Validate Session Token - Valid Token passes")
    public void testValidateSessionTokenSuccess() {
        String token = "livic_otp_session_12345";
        OtpVerificationTbl entity = OtpVerificationTbl.builder()
                .phone(TEST_PHONE)
                .sessionToken(token)
                .verifiedAt(Instant.now().minus(2, ChronoUnit.MINUTES))
                .build();

        when(otpRepository.findBySessionToken(token)).thenReturn(Optional.of(entity));

        assertDoesNotThrow(() -> otpService.validateSessionToken(token, TEST_PHONE));
    }
}
