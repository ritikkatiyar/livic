package com.livic.verticals.marketplace.service.impl;

import com.livic.verticals.marketplace.domain.OtpVerificationTbl;
import com.livic.verticals.marketplace.dto.OtpDTOs.OtpRequestRequest;
import com.livic.verticals.marketplace.dto.OtpDTOs.OtpRequestResponse;
import com.livic.verticals.marketplace.dto.OtpDTOs.OtpVerifyRequest;
import com.livic.verticals.marketplace.dto.OtpDTOs.OtpVerifyResponse;
import com.livic.verticals.marketplace.exception.OtpDeliveryException;
import com.livic.verticals.marketplace.repository.OtpVerificationRepository;
import com.livic.verticals.marketplace.service.interfaces.OtpService;
import com.livic.platform.common.exception.BusinessException;
import com.livic.verticals.marketplace.config.MarketplaceOtpProperties;
import com.livic.platform.notification.domain.MessageTemplate;
import com.livic.platform.notification.dto.TemplatedMessage;
import com.livic.platform.notification.service.MessagingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private final OtpVerificationRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final MessagingService messagingService;
    private final MarketplaceOtpProperties otpProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int SESSION_TOKEN_EXPIRY_MINUTES = 15;
    private static final int COOLDOWN_SECONDS = 60;
    private static final int MAX_REQUESTS_PER_HOUR = 5;
    private static final int MAX_ATTEMPTS = 5;
    /** Stops one client from sending codes to many numbers; generous enough for shared networks. */
    private static final int MAX_REQUESTS_PER_IP_PER_HOUR = 20;
    /** Rows are kept a day past expiry; sessions last minutes, so nothing usable is deleted. */
    private static final int STALE_AFTER_HOURS = 24;

    /** Fixed OTP used instead of a random code when set; configured only in the dev profile (no messaging gateway locally). */
    @Value("${app.marketplace.otp.dev-code:}")
    private String devOtpCode;

    /**
     * Not transactional: each save commits on its own, so the database connection is not held while the messaging gateway
     * is called.
     */
    @Override
    public OtpRequestResponse requestOtp(OtpRequestRequest request, String clientIp) {
        String phone = request.phone().trim();
        Instant now = Instant.now();

        // 1. Cooldown check: 60s
        List<OtpVerificationTbl> recentRequests = otpRepository.findByPhoneAndCreatedAtAfter(
                phone, now.minus(COOLDOWN_SECONDS, ChronoUnit.SECONDS));
        if (!recentRequests.isEmpty()) {
            throw new BusinessException("Please wait before requesting another OTP code");
        }

        // 2. Hourly cap check: 5 requests
        List<OtpVerificationTbl> hourlyRequests = otpRepository.findByPhoneAndCreatedAtAfter(
                phone, now.minus(1, ChronoUnit.HOURS));
        if (hourlyRequests.size() >= MAX_REQUESTS_PER_HOUR) {
            throw new BusinessException("Maximum OTP requests exceeded for this hour. Please try again later.");
        }

        // 3. Per-IP cap: one client cycling through phone numbers
        if (clientIp != null && otpRepository.countByRequestIpAndCreatedAtAfter(clientIp, now.minus(1, ChronoUnit.HOURS))
                >= MAX_REQUESTS_PER_IP_PER_HOUR) {
            log.warn("otp_request_blocked reason=ip_limit ip={}", clientIp);
            throw new BusinessException(HttpStatus.TOO_MANY_REQUESTS, "Too many verification requests. Please try again later.");
        }

        // 4. Generate 6-digit OTP (fixed code when a dev code is configured)
        boolean useDevCode = devOtpCode != null && devOtpCode.matches("^[0-9]{6}$");
        String otpCode = useDevCode ? devOtpCode : String.format("%06d", secureRandom.nextInt(1_000_000));
        String hashedOtp = passwordEncoder.encode(otpCode);

        OtpVerificationTbl entity = OtpVerificationTbl.builder()
                .phone(phone)
                .otpCodeHash(hashedOtp)
                .expiresAt(now.plus(OTP_EXPIRY_MINUTES, ChronoUnit.MINUTES))
                .attempts(0)
                .requestIp(clientIp)
                .build();

        otpRepository.save(entity);

        // Structured logging — NEVER log raw OTP code in production
        log.info("Generated OTP verification request for phone ending in {}", 
                phone.length() > 4 ? phone.substring(phone.length() - 4) : "****");
        if (useDevCode) {
            log.warn("Marketplace OTP dev code is enabled (app.marketplace.otp.dev-code); no message was sent");
        } else {
            sendCode(entity, otpCode);
        }

        return new OtpRequestResponse(OTP_EXPIRY_MINUTES * 60, COOLDOWN_SECONDS);
    }

    @Override
    @Transactional
    public OtpVerifyResponse verifyOtp(OtpVerifyRequest request) {
        String phone = request.phone().trim();
        String code = request.code().trim();
        Instant now = Instant.now();

        OtpVerificationTbl entity = otpRepository.findTopByPhoneOrderByCreatedAtDesc(phone)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "No OTP request found for phone: " + phone));

        if (entity.getExpiresAt().isBefore(now)) {
            throw new BusinessException("OTP code has expired. Please request a new one.");
        }

        if (entity.getAttempts() >= MAX_ATTEMPTS) {
            throw new BusinessException("Maximum verification attempts exceeded. Please request a new OTP.");
        }

        // Increment attempt count
        entity.setAttempts(entity.getAttempts() + 1);

        if (!passwordEncoder.matches(code, entity.getOtpCodeHash())) {
            otpRepository.save(entity);
            throw new BusinessException("Invalid OTP code. Please check and try again.");
        }

        // Issued Session Token
        String sessionToken = "livic_otp_session_" + UUID.randomUUID().toString().replace("-", "");
        Instant tokenExpiresAt = now.plus(SESSION_TOKEN_EXPIRY_MINUTES, ChronoUnit.MINUTES);

        entity.setSessionToken(sessionToken);
        entity.setVerifiedAt(now);
        otpRepository.save(entity);

        return new OtpVerifyResponse(sessionToken, tokenExpiresAt);
    }

    @Override
    @Transactional
    public int deleteStaleVerifications() {
        int deleted = otpRepository.deleteByExpiresAtBefore(Instant.now().minus(STALE_AFTER_HOURS, ChronoUnit.HOURS));
        if (deleted > 0) {
            log.info("otp_verifications_deleted count={}", deleted);
        }
        return deleted;
    }

    private void sendCode(OtpVerificationTbl entity, String otpCode) {
        TemplatedMessage message = TemplatedMessage.of(MessageTemplate.MARKETPLACE_OTP, Map.of(
                "otp", otpCode,
                "minutes", String.valueOf(OTP_EXPIRY_MINUTES)));
        if (!messagingService.sendFirstSuccessful(entity.getPhone(), message, otpProperties.getChannels()).anySent()) {
            // The code never reached the user, so it must not be verifiable; the cooldown still applies to retries
            entity.setExpiresAt(Instant.now());
            otpRepository.save(entity);
            throw new OtpDeliveryException();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void validateSessionToken(String sessionToken, String prospectPhone) {
        String verifiedPhone = resolveVerifiedPhone(sessionToken);

        if (prospectPhone != null && !prospectPhone.trim().equals(verifiedPhone)) {
            throw new BusinessException("OTP session token phone mismatch");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public String resolveVerifiedPhone(String sessionToken) {
        if (sessionToken == null || sessionToken.isBlank()) {
            throw new BusinessException("Missing OTP verification session token header (X-Otp-Session-Token)");
        }

        OtpVerificationTbl entity = otpRepository.findBySessionToken(sessionToken)
                .orElseThrow(() -> new BusinessException("Invalid or expired OTP session token"));

        if (entity.getVerifiedAt() == null) {
            throw new BusinessException("OTP session token is unverified");
        }

        Instant tokenExpiresAt = entity.getVerifiedAt().plus(SESSION_TOKEN_EXPIRY_MINUTES, ChronoUnit.MINUTES);
        if (Instant.now().isAfter(tokenExpiresAt)) {
            throw new BusinessException("OTP session token has expired. Please verify OTP again.");
        }

        return entity.getPhone();
    }
}
