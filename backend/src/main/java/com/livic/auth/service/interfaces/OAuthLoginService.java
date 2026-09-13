package com.livic.auth.service.interfaces;

import com.livic.auth.dto.AuthResponses.TokenBundle;

public interface OAuthLoginService {
    TokenBundle login(String provider, String idToken);
}
