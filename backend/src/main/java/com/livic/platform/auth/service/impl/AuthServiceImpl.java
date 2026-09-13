package com.livic.platform.auth.service.impl;

import com.livic.platform.auth.domain.RefreshTokenTbl;
import com.livic.platform.auth.dto.AuthRequests.LoginRequest;
import com.livic.platform.auth.dto.AuthRequests.LogoutRequest;
import com.livic.platform.auth.dto.AuthRequests.RefreshRequest;
import com.livic.platform.auth.dto.AuthRequests.SignupRequest;
import com.livic.platform.auth.dto.AuthRequests.ValidateRequest;
import com.livic.platform.auth.dto.AuthResponses.SignupResponse;
import com.livic.platform.auth.dto.AuthResponses.TokenBundle;
import com.livic.platform.auth.dto.AuthResponses.ValidateResponse;
import com.livic.platform.auth.service.JwtService;
import com.livic.platform.auth.service.TokenHasher;
import com.livic.platform.auth.service.TokenIssuer;
import com.livic.platform.auth.service.interfaces.AuthService;
import com.livic.platform.auth.service.interfaces.EmailVerificationService;
import com.livic.platform.auth.service.interfaces.RefreshTokenCrudService;
import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Application use-cases for registration, credential login, token refresh, and JWT validation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserFacade userFacade;
    private final RefreshTokenCrudService refreshTokenCrudService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final TokenIssuer tokenIssuer;
    private final EmailVerificationService emailVerificationService;

    @Override
    @Transactional
    public SignupResponse signup(SignupRequest request) {
        String email = normalizeEmail(request.email());
        Optional<UserSummaryDTO> existing = userFacade.getUserByEmail(email);

        UserSummaryDTO user;
        if (existing.isPresent()) {
            if (userFacade.isEmailVerified(existing.get().id())) {
                throw new BusinessException(HttpStatus.CONFLICT, "Email already registered");
            }
            user = userFacade.updateUnverifiedUser(existing.get().id(), request.fullName(), request.phoneNumber(), request.password());
        } else {
            user = userFacade.createUnverifiedUser(email, request.fullName(), request.phoneNumber(), request.password());
        }

        emailVerificationService.issueCode(user.id());
        return new SignupResponse(
                "VERIFICATION_REQUIRED",
                user.authUid(),
                EmailVerificationService.CODE_TTL.toSeconds(),
                EmailVerificationService.RESEND_COOLDOWN.toSeconds()
        );
    }

    @Override
    @Transactional
    public TokenBundle login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        UserSummaryDTO user = userFacade.getUserByEmail(email)
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
        } catch (AuthenticationException e) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        if (!userFacade.isEmailVerified(user.id())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Please verify your email before signing in");
        }

        return tokenIssuer.issueFor(user);
    }

    @Override
    @Transactional
    public TokenBundle refresh(RefreshRequest request) {
        RefreshTokenTbl stored = refreshTokenCrudService.findByTokenHashAndRevokedIsFalse(TokenHasher.sha256Hex(request.refreshToken()))
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Refresh token expired");
        }

        UUID userId = stored.getUserId();
        UserSummaryDTO user = userFacade.getUserById(userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "User not found"));

        refreshTokenCrudService.delete(stored);
        return tokenIssuer.issueFor(user);
    }

    @Override
    @Transactional
    public void logout(LogoutRequest request) {
        refreshTokenCrudService.findByTokenHashAndRevokedIsFalse(TokenHasher.sha256Hex(request.refreshToken()))
                .ifPresent(refreshTokenCrudService::delete);
    }

    @Override
    public ValidateResponse validate(ValidateRequest request) {
        try {
            Claims claims = jwtService.parseAndValidate(request.accessToken());
            Long exp = claims.getExpiration() != null
                    ? claims.getExpiration().toInstant().getEpochSecond()
                    : null;
            return new ValidateResponse(true, claims.getSubject(), claims.get("email", String.class), exp, null);
        } catch (ExpiredJwtException e) {
            return new ValidateResponse(false, null, null, null, "Token expired");
        } catch (JwtException e) {
            return new ValidateResponse(false, null, null, null, "Invalid token");
        }
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
