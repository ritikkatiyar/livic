package com.livic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableJpaAuditing
@EnableAsync
@EnableScheduling
public class LivicApplication {

    // Billing months, due dates and the midnight jobs are business days in one zone. Without
    // this they follow the host: IST on a laptop, UTC in a container, so anything between
    // midnight and 05:30 IST landed on the previous day. Set before any bean or job reads a date.
    static {
        TimeZone.setDefault(TimeZone.getTimeZone(System.getenv().getOrDefault("APP_TIME_ZONE", "Asia/Kolkata")));
    }

    public static void main(String[] args) {
        SpringApplication.run(LivicApplication.class, args);
    }
}
