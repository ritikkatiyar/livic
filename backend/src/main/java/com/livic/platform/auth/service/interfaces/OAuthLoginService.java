package com.livic.platform.auth.service.interfaces;

import com.livic.platform.auth.dto.AuthResponses.TokenBundle;

public interface OAuthLoginService {
    TokenBundle login(String provider, String idToken);
}
