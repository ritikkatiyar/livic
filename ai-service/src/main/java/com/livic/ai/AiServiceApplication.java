package com.livic.ai;

import com.livic.ai.config.AIProperties;
import com.livic.ai.config.BackendClientProperties;
import com.livic.ai.config.CorsProperties;
import com.livic.ai.config.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import java.util.TimeZone;

@SpringBootApplication
@EnableConfigurationProperties({AIProperties.class, BackendClientProperties.class, JwtProperties.class, CorsProperties.class})
public class AiServiceApplication {

    // The model is told today's date; it must be the same business day the backend uses.
    static {
        TimeZone.setDefault(TimeZone.getTimeZone(System.getenv().getOrDefault("APP_TIME_ZONE", "Asia/Kolkata")));
    }

    public static void main(String[] args) {
        SpringApplication.run(AiServiceApplication.class, args);
    }
}
