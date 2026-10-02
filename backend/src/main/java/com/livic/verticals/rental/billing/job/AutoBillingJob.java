package com.livic.verticals.rental.billing.job;

import com.livic.core.finance.domain.BillType;
import com.livic.core.finance.facade.FinanceFacade;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.verticals.rental.billing.dto.RentGenerationDTOs.GenerateBillRequest;
import com.livic.verticals.rental.billing.service.interfaces.RentGenerationService;
import com.livic.verticals.rental.lease.domain.LeaseTbl;
import com.livic.verticals.rental.lease.service.interfaces.LeaseQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class AutoBillingJob {

    private final PropertyFacade propertyFacade;
    private final LeaseQueryService leaseQueryService;
    private final RentGenerationService rentGenerationService;
    private final FinanceFacade financeFacade;
    private final UnitMemberFacade unitMemberFacade;

    /**
     * Runs once a day, at midnight, and bills the properties whose bill day it is. It used to run
     * every hour and regenerate every unpaid bill each time, rewriting bills the landlord had
     * already published or edited that day.
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void executeAutoBilling() {
        LocalDate today = LocalDate.now();
        String billingMonth = today.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        log.info("Starting Auto-Billing Job for Day: {}, Month: {}", today.getDayOfMonth(), billingMonth);

        for (PropertySummaryDTO property : propertyFacade.getPropertiesByAutoBillDayOfMonth(today.getDayOfMonth())) {
            log.info("Processing auto-billing for Property ID: {}", property.id());
            billProperty(property.id(), billingMonth, today.plusDays(5));
        }
    }

    /**
     * Generates rent for active leases that have no bill for the month yet. A bill that already
     * exists was made by hand or by an earlier run, and the job never rewrites it. Core prepares
     * the month's worksheet as part of generating, so the job no longer has to.
     */
    private void billProperty(UUID propertyId, String billingMonth, LocalDate dueDate) {
        try {
            Set<UUID> billedMemberIds = financeFacade.getBilledMemberIds(propertyId, billingMonth, BillType.RENT);
            Map<UUID, UUID> memberIdByLeaseId = unitMemberFacade.getActiveResidentsByPropertyId(propertyId).stream()
                    .filter(resident -> resident.leaseId() != null)
                    .collect(Collectors.toMap(UnitResidentDTO::leaseId, UnitResidentDTO::memberId, (a, b) -> a));

            for (LeaseTbl lease : leaseQueryService.findActiveLeasesByProperty(propertyId)) {
                if (billedMemberIds.contains(memberIdByLeaseId.get(lease.getId()))) {
                    continue;
                }
                try {
                    rentGenerationService.generate(new GenerateBillRequest(lease.getId(), billingMonth, dueDate));
                    log.info("Successfully auto-generated bill for Lease ID: {}", lease.getId());
                } catch (Exception e) {
                    log.error("Failed to auto-generate bill for Lease ID: {}", lease.getId(), e);
                }
            }
        } catch (Exception e) {
            log.error("Failed to process auto-billing for Property ID: {}", propertyId, e);
        }
    }
}
