package com.livic.auth.provider.google;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app.oauth.google")
public record GoogleOAuthProperties(
        boolean enabled,
        List<String> clientIds
) {}
