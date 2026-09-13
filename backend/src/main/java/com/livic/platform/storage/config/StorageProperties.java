package com.livic.platform.storage.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "storage.cloudinary")
@Getter
@Setter
public class StorageProperties {

    private String cloudName = "demo";
    private String apiKey = "mock-key";
    private String apiSecret = "mock-secret";
    private String folderPrefix = "livic";
}
