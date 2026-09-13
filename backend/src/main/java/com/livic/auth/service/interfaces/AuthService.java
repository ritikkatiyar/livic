package com.livic.auth.service.interfaces;

import com.livic.auth.dto.AuthRequests.LoginRequest;
import com.livic.auth.dto.AuthRequests.LogoutRequest;
import com.livic.auth.dto.AuthRequests.RefreshRequest;
import com.livic.auth.dto.AuthRequests.SignupRequest;
import com.livic.auth.dto.AuthRequests.ValidateRequest;
import com.livic.auth.dto.AuthResponses.SignupResponse;
import com.livic.auth.dto.AuthResponses.TokenBundle;
import com.livic.auth.dto.AuthResponses.ValidateResponse;

public interface AuthService {
    SignupResponse signup(SignupRequest request);
    TokenBundle login(LoginRequest request);
    TokenBundle refresh(RefreshRequest request);
    void logout(LogoutRequest request);
    ValidateResponse validate(ValidateRequest request);
}
