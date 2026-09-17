package com.livic.verticals.marketplace;

import com.livic.platform.common.exception.BusinessException;
import com.livic.verticals.marketplace.domain.OtpVerificationTbl;
import com.livic.verticals.marketplace.dto.OtpDTOs;
import com.livic.verticals.marketplace.exception.OtpDeliveryException;
import com.livic.verticals.marketplace.repository.OtpVerificationRepository;
import com.livic.verticals.marketplace.service.impl.OtpServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.livic.platform.notification.domain.MessageTemplate;
import com.livic.platform.notification.dto.TemplatedMessage;
import com.livic.platform.notification.service.SmsService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

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

    @Mock
    private SmsService smsService;

    @InjectMocks
    private OtpServiceImpl otpService;

    private static final String TEST_PHONE = "9876543210";
    private static final String TEST_IP = "203.0.113.7";
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
        when(smsService.sendToPhone(eq(TEST_PHONE), any(TemplatedMessage.class))).thenReturn(true);

        OtpDTOs.OtpRequestRequest request = new OtpDTOs.OtpRequestRequest(TEST_PHONE);
        OtpDTOs.OtpRequestResponse response = otpService.requestOtp(request, TEST_IP);
        assertEquals(300, response.expiresSeconds());
        assertEquals(60, response.resendAfterSeconds());

        ArgumentCaptor<OtpVerificationTbl> captor = ArgumentCaptor.forClass(OtpVerificationTbl.class);
        verify(otpRepository).save(captor.capture());
        assertEquals(TEST_PHONE, captor.getValue().getPhone());
        assertEquals(HASHED_CODE, captor.getValue().getOtpCodeHash());
        assertEquals(0, captor.getValue().getAttempts());
        assertEquals(TEST_IP, captor.getValue().getRequestIp());

        // The code sent by SMS is the one whose hash was stored
        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(passwordEncoder).encode(codeCaptor.capture());
        ArgumentCaptor<TemplatedMessage> messageCaptor = ArgumentCaptor.forClass(TemplatedMessage.class);
        verify(smsService).sendToPhone(eq(TEST_PHONE), messageCaptor.capture());
        assertEquals(MessageTemplate.MARKETPLACE_OTP, messageCaptor.getValue().template());
        assertEquals(codeCaptor.getValue(), messageCaptor.getValue().variables().get("otp"));
        assertEquals("5", messageCaptor.getValue().variables().get("minutes"));
    }

    @Test
    @DisplayName("Request OTP - Expires the code and answers 503 when the SMS can't be delivered")
    public void testRequestOtpDeliveryFailure() {
        when(otpRepository.findByPhoneAndCreatedAtAfter(eq(TEST_PHONE), any(Instant.class)))
                .thenReturn(Collections.emptyList());
        when(passwordEncoder.encode(any(String.class))).thenReturn(HASHED_CODE);
        when(smsService.sendToPhone(eq(TEST_PHONE), any(TemplatedMessage.class))).thenReturn(false);

        OtpDTOs.OtpRequestRequest request = new OtpDTOs.OtpRequestRequest(TEST_PHONE);
        OtpDeliveryException exception = assertThrows(OtpDeliveryException.class, () -> otpService.requestOtp(request, TEST_IP));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatus());
        ArgumentCaptor<OtpVerificationTbl> captor = ArgumentCaptor.forClass(OtpVerificationTbl.class);
        verify(otpRepository, times(2)).save(captor.capture());
        assertFalse(captor.getValue().getExpiresAt().isAfter(Instant.now()), "an undelivered code must not stay verifiable");
    }

    @Test
    @DisplayName("Request OTP - Blocks a client IP over the hourly limit before creating a code")
    public void testRequestOtpIpLimit() {
        when(otpRepository.findByPhoneAndCreatedAtAfter(eq(TEST_PHONE), any(Instant.class)))
                .thenReturn(Collections.emptyList());
        when(otpRepository.countByRequestIpAndCreatedAtAfter(eq(TEST_IP), any(Instant.class))).thenReturn(20L);

        OtpDTOs.OtpRequestRequest request = new OtpDTOs.OtpRequestRequest(TEST_PHONE);
        BusinessException exception = assertThrows(BusinessException.class, () -> otpService.requestOtp(request, TEST_IP));

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exception.getStatus());
        verify(otpRepository, never()).save(any());
        verifyNoInteractions(smsService);
    }

    @Test
    @DisplayName("Request OTP - Uses the configured dev code instead of a random one")
    public void testRequestOtpUsesDevCode() {
        ReflectionTestUtils.setField(otpService, "devOtpCode", "000000");
        when(otpRepository.findByPhoneAndCreatedAtAfter(eq(TEST_PHONE), any(Instant.class)))
                .thenReturn(Collections.emptyList());
        when(passwordEncoder.encode("000000")).thenReturn(HASHED_CODE);

        otpService.requestOtp(new OtpDTOs.OtpRequestRequest(TEST_PHONE), TEST_IP);

        verify(passwordEncoder).encode("000000");
        verifyNoInteractions(smsService);
    }

    @Test
    @DisplayName("Request OTP - Ignores a malformed dev code and generates a random one")
    public void testRequestOtpIgnoresMalformedDevCode() {
        ReflectionTestUtils.setField(otpService, "devOtpCode", "1234");
        when(otpRepository.findByPhoneAndCreatedAtAfter(eq(TEST_PHONE), any(Instant.class)))
                .thenReturn(Collections.emptyList());
        when(passwordEncoder.encode(any(String.class))).thenReturn(HASHED_CODE);
        when(smsService.sendToPhone(eq(TEST_PHONE), any(TemplatedMessage.class))).thenReturn(true);

        otpService.requestOtp(new OtpDTOs.OtpRequestRequest(TEST_PHONE), TEST_IP);

        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(passwordEncoder).encode(codeCaptor.capture());
        assertTrue(codeCaptor.getValue().matches("^[0-9]{6}$"));
        assertNotEquals("1234", codeCaptor.getValue());
    }

    @Test
    @DisplayName("Request OTP - Fails when requested within 60s cooldown")
    public void testRequestOtpCooldownFailure() {
        OtpVerificationTbl recentReq = OtpVerificationTbl.builder().phone(TEST_PHONE).build();
        when(otpRepository.findByPhoneAndCreatedAtAfter(eq(TEST_PHONE), any(Instant.class)))
                .thenReturn(List.of(recentReq));

        OtpDTOs.OtpRequestRequest request = new OtpDTOs.OtpRequestRequest(TEST_PHONE);
        BusinessException exception = assertThrows(BusinessException.class, () -> otpService.requestOtp(request, TEST_IP));

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
