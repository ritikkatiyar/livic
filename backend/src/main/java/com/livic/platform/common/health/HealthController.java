package com.livic.platform.common.health;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
    /**
     * Platform
     * Health and infrastructure endpoints
     */

public class HealthController {

    @GetMapping(value = "/health", produces = MediaType.TEXT_PLAIN_VALUE)
        /**
     * Application health
     * Public liveness probe; returns plain text.
     */

    public String health() {
        return "OK";
    }
}
