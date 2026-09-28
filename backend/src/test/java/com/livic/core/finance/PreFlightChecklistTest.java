package com.livic.core.finance;

import com.livic.core.finance.domain.ChargeConfigTbl;
import com.livic.core.finance.domain.MeterReadingTbl;
import com.livic.core.finance.dto.BillDTOs;
import com.livic.core.finance.service.interfaces.BillService;
import com.livic.core.finance.service.interfaces.BillingWorksheetCrudService;
import com.livic.core.finance.service.interfaces.ChargeConfigCrudService;
import com.livic.core.finance.service.interfaces.MeterReadingCrudService;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.UnitFacade;
import com.livic.platform.common.domain.CalculationStrategyType;
import com.livic.platform.common.domain.LeaseStatus;
import com.livic.verticals.rental.billing.service.impl.BillTransactionHelper;
import com.livic.verticals.rental.billing.service.impl.RentGenerationServiceImpl;
import com.livic.verticals.rental.lease.domain.LeaseTbl;
import com.livic.verticals.rental.lease.service.interfaces.LeaseCrudService;
import com.livic.verticals.rental.lease.service.interfaces.LeaseQueryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/** The Rent Roll pre-flight card compares tenants with beds and meter readings with occupied units. */
@ExtendWith(MockitoExtension.class)
class PreFlightChecklistTest {

    @Mock private LeaseQueryService leaseQueryService;
    @Mock private LeaseCrudService leaseCrudService;
    @Mock private ChargeConfigCrudService chargeConfigCrudService;
    @Mock private MeterReadingCrudService meterReadingCrudService;
    @Mock private UnitFacade unitFacade;
    @Mock private BillingWorksheetCrudService billingWorksheetCrudService;
    @Mock private BillTransactionHelper transactionHelper;
    @Mock private BillService billService;

    @InjectMocks private RentGenerationServiceImpl rentGenerationService;

    private final UUID propertyId = UUID.randomUUID();
    private final UUID sharedRoomId = UUID.randomUUID();
    private final UUID singleRoomId = UUID.randomUUID();

    @Test
    @DisplayName("A shared room with two tenants is two leases of three beds, needing one meter reading")
    void sharedRoomWithTwoTenants() {
        when(unitFacade.getUnitsByPropertyId(propertyId)).thenReturn(List.of(
                unit(sharedRoomId, "101", 2),
                unit(singleRoomId, "102", 1)));
        when(leaseCrudService.findByUnitIdInAndStatus(any(), eq(LeaseStatus.ACTIVE))).thenReturn(List.of(
                activeLease(sharedRoomId),
                activeLease(sharedRoomId)));
        when(chargeConfigCrudService.findAllByPropertyIdAndIsActiveTrue(propertyId)).thenReturn(List.of(
                ChargeConfigTbl.builder().propertyId(propertyId).chargeName("Electricity")
                        .calculationStrategy(CalculationStrategyType.METERED).build()));
        when(meterReadingCrudService.findByPropertyIdAndBillingMonthAndBillingYear(propertyId, 9, 2026)).thenReturn(List.of(
                MeterReadingTbl.builder().propertyId(propertyId).unitId(sharedRoomId)
                        .billingMonth(9).billingYear(2026).currentReading(BigDecimal.valueOf(1250)).build()));

        BillDTOs.PreFlightChecklistResponse checklist = rentGenerationService.getPreFlightChecklist(propertyId, "2026-09");

        assertThat(checklist.totalUnits()).isEqualTo(2);
        assertThat(checklist.totalBeds()).isEqualTo(3);
        assertThat(checklist.activeLeases()).isEqualTo(2);
        assertThat(checklist.activeLeases()).isLessThanOrEqualTo(checklist.totalBeds());
        assertThat(checklist.meterReadingsExpected()).isEqualTo(1);
        assertThat(checklist.meterReadingsEntered()).isEqualTo(1);
        assertThat(checklist.isReady()).isTrue();
    }

    @Test
    @DisplayName("A missing reading for the shared room blocks generation")
    void missingSharedRoomReadingIsNotReady() {
        when(unitFacade.getUnitsByPropertyId(propertyId)).thenReturn(List.of(unit(sharedRoomId, "101", 2)));
        when(leaseCrudService.findByUnitIdInAndStatus(any(), eq(LeaseStatus.ACTIVE))).thenReturn(List.of(
                activeLease(sharedRoomId),
                activeLease(sharedRoomId)));
        when(chargeConfigCrudService.findAllByPropertyIdAndIsActiveTrue(propertyId)).thenReturn(List.of(
                ChargeConfigTbl.builder().propertyId(propertyId).chargeName("Electricity")
                        .calculationStrategy(CalculationStrategyType.METERED).build()));
        when(meterReadingCrudService.findByPropertyIdAndBillingMonthAndBillingYear(propertyId, 9, 2026)).thenReturn(List.of());

        BillDTOs.PreFlightChecklistResponse checklist = rentGenerationService.getPreFlightChecklist(propertyId, "2026-09");

        assertThat(checklist.meterReadingsExpected()).isEqualTo(1);
        assertThat(checklist.meterReadingsEntered()).isZero();
        assertThat(checklist.isReady()).isFalse();
    }

    private UnitSummaryDTO unit(UUID id, String number, int capacity) {
        return new UnitSummaryDTO(id, propertyId, "Shared Room PG", number, 1, capacity, 0, 0, 1, 1, null, null);
    }

    private LeaseTbl activeLease(UUID unitId) {
        LeaseTbl lease = new LeaseTbl();
        lease.setId(UUID.randomUUID());
        lease.setUnitId(unitId);
        lease.setStatus(LeaseStatus.ACTIVE);
        return lease;
    }
}
