package com.livic.core.finance.job;

import com.livic.platform.common.domain.LeaseStatus;
import com.livic.core.finance.domain.ChargeConfigTbl;
import com.livic.core.finance.domain.LeaseTbl;
import com.livic.core.finance.dto.BillDTOs.GenerateBillRequest;
import com.livic.core.finance.repository.ChargeConfigRepository;
import com.livic.core.finance.repository.LeaseRepository;
import com.livic.core.finance.service.BillingWorksheetService;
import com.livic.core.finance.service.interfaces.BillService;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.facade.PropertyFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AutoBillingJob {

    private final PropertyFacade propertyFacade;
    private final ChargeConfigRepository chargeConfigRepository;
    private final BillingWorksheetService worksheetService;
    private final LeaseRepository leaseRepository;
    private final BillService billService;
    private final com.livic.core.property.facade.UnitFacade unitFacade;

    /**
     * Runs at the top of every hour to check for properties that need auto-billing.
     */
    @Scheduled(cron = "0 0 * * * *") // Every hour
    public void executeAutoBilling() {
        LocalDateTime now = LocalDateTime.now();
        int currentDay = now.getDayOfMonth();
        int currentHour = now.getHour();
        String currentBillingMonth = now.format(DateTimeFormatter.ofPattern("yyyy-MM"));

        log.info("Starting Auto-Billing Job for Day: {}, Hour: {}, Month: {}", currentDay, currentHour, currentBillingMonth);

        List<PropertySummaryDTO> properties = propertyFacade.getPropertiesByAutoBillDayOfMonth(currentDay);

        for (PropertySummaryDTO property : properties) {
            log.info("Processing auto-billing for Property ID: {}", property.id());
            processPropertyBilling(property.id(), currentBillingMonth);
        }
    }

    private void processPropertyBilling(java.util.UUID propertyId, String billingMonth) {
        try {
            // 1. Initialize Worksheets for all active Charge Configs
            List<ChargeConfigTbl> activeConfigs = chargeConfigRepository.findAllByPropertyIdAndIsActiveTrue(propertyId);
            for (ChargeConfigTbl config : activeConfigs) {
                worksheetService.getOrCreateWorksheetForMonth(propertyId, config.getId(), billingMonth);
            }

            // 2. Generate Rent Cycles for all active leases
            List<com.livic.core.property.dto.UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(propertyId);
            List<java.util.UUID> unitIds = units.stream().map(com.livic.core.property.dto.UnitSummaryDTO::id).toList();
            List<LeaseTbl> activeLeases = unitIds.isEmpty() ? List.of() :
                    leaseRepository.findByUnitIdInAndStatus(unitIds, LeaseStatus.ACTIVE);
            LocalDate dueDate = LocalDate.now().plusDays(5); // Default due in 5 days

            for (LeaseTbl lease : activeLeases) {
                try {
                    GenerateBillRequest request = new GenerateBillRequest(
                            lease.getId(),
                            billingMonth,
                            dueDate
                    );
                    billService.generate(request);
                    log.info("Successfully auto-generated rent cycle for Lease ID: {}", lease.getId());
                } catch (Exception e) {
                    log.error("Failed to auto-generate rent cycle for Lease ID: {}", lease.getId(), e);
                }
            }
        } catch (Exception e) {
            log.error("Failed to process auto-billing for Property ID: {}", propertyId, e);
        }
    }
}
