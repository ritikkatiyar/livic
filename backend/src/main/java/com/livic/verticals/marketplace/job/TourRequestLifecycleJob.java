package com.livic.verticals.marketplace.job;

import com.livic.verticals.marketplace.service.interfaces.TourRequestManagementService;
import com.livic.verticals.marketplace.service.interfaces.TourRequestNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Every 15 minutes: closes tour requests whose visit time has passed and sends visit reminders. Rules live in the services. */
@Component
@RequiredArgsConstructor
public class TourRequestLifecycleJob {

    private final TourRequestManagementService tourRequestService;
    private final TourRequestNotificationService tourRequestNotificationService;

    @Scheduled(cron = "0 */15 * * * *")
    public void closePastTourRequests() {
        tourRequestService.closePastTourRequests();
    }

    @Scheduled(cron = "0 */15 * * * *")
    public void sendTourReminders() {
        tourRequestNotificationService.sendDueReminders();
    }
}
