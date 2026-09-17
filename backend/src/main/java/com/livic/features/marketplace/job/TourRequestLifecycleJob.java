package com.livic.features.marketplace.job;

import com.livic.features.marketplace.repository.MarketplaceLeadRepository;
import com.livic.platform.common.domain.LeadStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;

/**
 * Closes tour requests whose visit time has passed: pending ones expire, approved ones complete.
 * This releases the one-active-tour-per-property constraint for those phones.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TourRequestLifecycleJob {

    private final MarketplaceLeadRepository leadRepository;

    @Scheduled(cron = "0 */15 * * * *")
    @Transactional
    public void closePastTourRequests() {
        Instant now = Instant.now();
        LocalDateTime updatedAt = LocalDateTime.now();

        int expired = leadRepository.closePastTours(LeadStatus.NEW, LeadStatus.EXPIRED, now, updatedAt);
        int completed = leadRepository.closePastTours(LeadStatus.APPROVED, LeadStatus.COMPLETED, now, updatedAt);

        if (expired > 0 || completed > 0) {
            log.info("tour_request_lifecycle_closed expired={} completed={}", expired, completed);
        }
    }
}
