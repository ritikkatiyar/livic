package com.livic.verticals.rental.billing.job;

import com.livic.core.finance.domain.BillTbl;
import com.livic.core.finance.domain.BillType;
import com.livic.core.finance.domain.ChargeConfigTbl;
import com.livic.core.finance.repository.BillRepository;
import com.livic.core.finance.repository.ChargeConfigRepository;
import com.livic.verticals.rental.lease.domain.LeaseTbl;
import com.livic.core.finance.dto.BillDTOs.GenerateBillRequest;
import com.livic.verticals.rental.lease.service.interfaces.LeaseQueryService;
import com.livic.verticals.rental.billing.service.interfaces.BillingWorksheetService;
import com.livic.verticals.rental.billing.service.interfaces.RentGenerationService;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.core.property.facade.UnitMemberFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class AutoBillingJob {

    private final PropertyFacade propertyFacade;
    private final ChargeConfigRepository chargeConfigRepository;
    private final BillingWorksheetService worksheetService;
    private final LeaseQueryService leaseQueryService;
    private final RentGenerationService rentGenerationService;
    private final BillRepository billRepository;
    private final UnitMemberFacade unitMemberFacade;

    /**
     * Runs once a day, at midnight, and bills the properties whose bill day it is. It used to run
     * every hour and regenerate every unpaid bill each time, rewriting bills the landlord had
     * already published or edited that day.
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void executeAutoBilling() {
        LocalDateTime now = LocalDateTime.now();
        int currentDay = now.getDayOfMonth();
        String currentBillingMonth = now.format(DateTimeFormatter.ofPattern("yyyy-MM"));

        log.info("Starting Auto-Billing Job for Day: {}, Month: {}", currentDay, currentBillingMonth);

        List<PropertySummaryDTO> properties = propertyFacade.getPropertiesByAutoBillDayOfMonth(currentDay);

        for (PropertySummaryDTO property : properties) {
            log.info("Processing auto-billing for Property ID: {}", property.id());
            processPropertyBilling(property.id(), currentBillingMonth);
        }
    }

    private void processPropertyBilling(UUID propertyId, String billingMonth) {
        try {
            // 1. Initialize Worksheets for all active Charge Configs
            List<ChargeConfigTbl> activeConfigs = chargeConfigRepository.findAllByPropertyIdAndIsActiveTrue(propertyId);
            for (ChargeConfigTbl config : activeConfigs) {
                worksheetService.getOrCreateWorksheetForMonth(propertyId, config.getId(), billingMonth);
            }

            // 2. Generate rent for active leases that have no bill for the month yet. A bill that
            // already exists was made by hand or by an earlier run, and the job never rewrites it.
            Set<UUID> billedMemberIds = billRepository.findByPropertyIdAndBillingMonth(propertyId, billingMonth).stream()
                    .filter(bill -> bill.getBillType() == BillType.RENT)
                    .map(BillTbl::getMemberId)
                    .collect(Collectors.toSet());
            Map<UUID, UUID> memberIdByLeaseId = unitMemberFacade.getActiveResidentsByPropertyId(propertyId).stream()
                    .filter(resident -> resident.leaseId() != null)
                    .collect(Collectors.toMap(UnitResidentDTO::leaseId, UnitResidentDTO::memberId, (a, b) -> a));
            List<LeaseTbl> activeLeases = leaseQueryService.findActiveLeasesByProperty(propertyId);
            LocalDate dueDate = LocalDate.now().plusDays(5); // Default due in 5 days

            for (LeaseTbl lease : activeLeases) {
                if (billedMemberIds.contains(memberIdByLeaseId.get(lease.getId()))) {
                    continue;
                }
                try {
                    GenerateBillRequest request = new GenerateBillRequest(
                            lease.getId(),
                            billingMonth,
                            dueDate
                    );
                    rentGenerationService.generate(request);
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
