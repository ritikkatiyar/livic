package com.livic.platform.notification.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "email")
@Getter
@Setter
public class EmailProperties {
    private boolean enabled;
    private String host;
    private int port;
    private String username;
    private String password;
    private String fromAddress;
}
