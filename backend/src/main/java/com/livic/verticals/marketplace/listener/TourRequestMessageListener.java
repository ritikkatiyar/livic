package com.livic.verticals.marketplace.listener;

import com.livic.verticals.marketplace.event.TourRequestDecidedEvent;
import com.livic.verticals.marketplace.service.interfaces.TourRequestNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** Messages the prospect once a landlord's decision is committed; runs off the request thread so a slow gateway can't delay it. */
@Component
@RequiredArgsConstructor
public class TourRequestMessageListener {

    private final TourRequestNotificationService tourRequestNotificationService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTourRequestDecided(TourRequestDecidedEvent event) {
        tourRequestNotificationService.notifyDecision(event.leadId());
    }
}
