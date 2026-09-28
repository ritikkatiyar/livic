package com.livic.ai;

import com.livic.ai.config.AIProperties;
import com.livic.ai.config.BackendClientProperties;
import com.livic.ai.config.CorsProperties;
import com.livic.ai.config.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({AIProperties.class, BackendClientProperties.class, JwtProperties.class, CorsProperties.class})
public class AiServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiServiceApplication.class, args);
    }
}
