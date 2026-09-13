package com.livic.platform.auth.controller;

import com.livic.platform.auth.dto.AuthRequests.LoginRequest;
import com.livic.platform.auth.dto.AuthRequests.LogoutRequest;
import com.livic.platform.auth.dto.AuthRequests.OAuthLoginRequest;
import com.livic.platform.auth.dto.AuthRequests.RefreshRequest;
import com.livic.platform.auth.dto.AuthRequests.ResendVerificationRequest;
import com.livic.platform.auth.dto.AuthRequests.SignupRequest;
import com.livic.platform.auth.dto.AuthRequests.VerifyEmailRequest;
import com.livic.platform.auth.dto.AuthResponses.SignupResponse;
import com.livic.platform.auth.dto.AuthResponses.TokenBundle;
import com.livic.platform.auth.service.interfaces.AuthService;
import com.livic.platform.auth.service.interfaces.EmailVerificationService;
import com.livic.platform.auth.service.interfaces.OAuthLoginService;
import com.livic.platform.common.response.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * HTTP API for authentication: signup with email verification, password login, external identity
 * providers, token refresh, and logout.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;
    private final OAuthLoginService oAuthLoginService;

    /**
     * Register a new account. No tokens are issued until the emailed code is verified.
     */
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<SignupResponse>> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.signup(request)));
    }

    /**
     * Verify the 6-digit signup code and receive access and refresh tokens.
     */
    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<TokenBundle>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return ResponseEntity.ok(ApiResponse.success(emailVerificationService.verify(request.email(), request.code())));
    }

    /**
     * Send a fresh verification code for a pending signup.
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Void>> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        emailVerificationService.resend(request.email());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Login with email and password. Returns 403 if the email has not been verified yet.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenBundle>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(request)));
    }

    /**
     * Sign in with an ID token from an external provider (e.g. google).
     */
    @PostMapping("/oauth/{provider}")
    public ResponseEntity<ApiResponse<TokenBundle>> oauthLogin(@PathVariable String provider,
                                                               @Valid @RequestBody OAuthLoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(oAuthLoginService.login(provider, request.idToken())));
    }

    /**
     * Refresh tokens. The old refresh token is removed and a new pair is returned.
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenBundle>> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.refresh(request)));
    }

    /**
     * Revoke the provided refresh token. The access token naturally expires.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
