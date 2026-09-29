package com.livic.verticals.marketplace.job;

import com.livic.verticals.marketplace.service.interfaces.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Nightly removal of OTP verification rows that can no longer be used. */
@Component
@RequiredArgsConstructor
public class OtpCleanupJob {

    private final OtpService otpService;

    @Scheduled(cron = "0 30 3 * * *")
    public void deleteStaleVerifications() {
        otpService.deleteStaleVerifications();
    }
}
