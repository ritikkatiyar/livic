package com.livic.platform.auth.service.interfaces;

import com.livic.platform.auth.dto.AuthRequests.LoginRequest;
import com.livic.platform.auth.dto.AuthRequests.LogoutRequest;
import com.livic.platform.auth.dto.AuthRequests.RefreshRequest;
import com.livic.platform.auth.dto.AuthRequests.SignupRequest;
import com.livic.platform.auth.dto.AuthRequests.ValidateRequest;
import com.livic.platform.auth.dto.AuthResponses.SignupResponse;
import com.livic.platform.auth.dto.AuthResponses.TokenBundle;
import com.livic.platform.auth.dto.AuthResponses.ValidateResponse;

public interface AuthService {
    SignupResponse signup(SignupRequest request);
    TokenBundle login(LoginRequest request);
    TokenBundle refresh(RefreshRequest request);
    void logout(LogoutRequest request);
    ValidateResponse validate(ValidateRequest request);
}
