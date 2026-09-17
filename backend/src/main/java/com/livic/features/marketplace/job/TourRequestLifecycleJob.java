package com.livic.features.marketplace.job;

import com.livic.features.marketplace.service.interfaces.TourRequestManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Periodically closes tour requests whose visit time has passed; the rules live in the service. */
@Component
@RequiredArgsConstructor
public class TourRequestLifecycleJob {

    private final TourRequestManagementService tourRequestService;

    @Scheduled(cron = "0 */15 * * * *")
    public void closePastTourRequests() {
        tourRequestService.closePastTourRequests();
    }
}
