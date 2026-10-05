package com.livic.core.finance;

import com.livic.core.finance.domain.CalculationStrategyType;
import com.livic.core.finance.domain.ChargeConfigTbl;
import com.livic.core.finance.domain.MeterReadingTbl;
import com.livic.core.finance.dto.BillDTOs;
import com.livic.core.finance.repository.BillLineRepository;
import com.livic.core.finance.repository.BillRepository;
import com.livic.core.finance.repository.BillingWorksheetRepository;
import com.livic.core.finance.repository.ChargeConfigRepository;
import com.livic.core.finance.repository.MeterReadingRepository;
import com.livic.core.finance.service.impl.BillServiceImpl;
import com.livic.core.property.domain.UnitMemberRole;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.core.property.facade.UnitFacade;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.payment.facade.PaymentFacade;
import com.livic.platform.user.facade.UserFacade;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/** The pre-flight card compares payers with beds, and meter readings with occupied units. */
@ExtendWith(MockitoExtension.class)
class PreFlightChecklistTest {

    @Mock private BillRepository billRepository;
    @Mock private BillLineRepository billLineRepository;
    @Mock private BillingWorksheetRepository billingWorksheetRepository;
    @Mock private MeterReadingRepository meterReadingRepository;
    @Mock private ChargeConfigRepository chargeConfigRepository;
    @Mock private PaymentFacade paymentFacade;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private UserFacade userFacade;
    @Mock private UnitFacade unitFacade;
    @Mock private UnitMemberFacade unitMemberFacade;
    @Mock private PropertyFacade propertyFacade;

    @InjectMocks private BillServiceImpl billService;

    private final UUID propertyId = UUID.randomUUID();
    private final UUID sharedRoomId = UUID.randomUUID();
    private final UUID singleRoomId = UUID.randomUUID();

    @Test
    @DisplayName("A shared room with two tenants is two payers in three beds, needing one meter reading")
    void sharedRoomWithTwoTenants() {
        when(unitFacade.getUnitsByPropertyId(propertyId)).thenReturn(List.of(
                unit(sharedRoomId, "101", 2),
                unit(singleRoomId, "102", 1)));
        when(unitMemberFacade.getActiveResidentsByPropertyId(propertyId)).thenReturn(List.of(
                member(sharedRoomId, UnitMemberRole.TENANT),
                member(sharedRoomId, UnitMemberRole.TENANT),
                // A family member lives there but does not pay.
                member(sharedRoomId, UnitMemberRole.FAMILY)));
        meteredElectricity();
        when(meterReadingRepository.findByPropertyIdAndBillingMonthAndBillingYear(propertyId, 9, 2026)).thenReturn(List.of(
                MeterReadingTbl.builder().propertyId(propertyId).unitId(sharedRoomId)
                        .billingMonth(9).billingYear(2026).currentReading(BigDecimal.valueOf(1250)).build()));

        BillDTOs.PreFlightChecklistResponse checklist = billService.getPreFlightChecklist(propertyId, "2026-09");

        assertThat(checklist.totalUnits()).isEqualTo(2);
        assertThat(checklist.totalBeds()).isEqualTo(3);
        assertThat(checklist.activePayers()).isEqualTo(2);
        assertThat(checklist.meterReadingsExpected()).isEqualTo(1);
        assertThat(checklist.meterReadingsEntered()).isEqualTo(1);
        assertThat(checklist.isReady()).isTrue();
    }

    @Test
    @DisplayName("An owner-occupied flat counts as a payer, so residential buildings get a checklist too")
    void ownerCountsAsAPayer() {
        when(unitFacade.getUnitsByPropertyId(propertyId)).thenReturn(List.of(unit(singleRoomId, "102", 1)));
        when(unitMemberFacade.getActiveResidentsByPropertyId(propertyId)).thenReturn(List.of(
                member(singleRoomId, UnitMemberRole.OWNER)));
        meteredElectricity();
        when(meterReadingRepository.findByPropertyIdAndBillingMonthAndBillingYear(propertyId, 9, 2026)).thenReturn(List.of());

        BillDTOs.PreFlightChecklistResponse checklist = billService.getPreFlightChecklist(propertyId, "2026-09");

        assertThat(checklist.activePayers()).isEqualTo(1);
        assertThat(checklist.meterReadingsExpected()).isEqualTo(1);
        assertThat(checklist.isReady()).isFalse();
    }

    @Test
    @DisplayName("A malformed month is refused rather than counted as zero readings")
    void malformedMonthIsRefused() {
        assertThatThrownBy(() -> billService.getPreFlightChecklist(propertyId, "September"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("yyyy-MM");
    }

    private void meteredElectricity() {
        when(chargeConfigRepository.findAllByPropertyIdAndIsActiveTrue(propertyId)).thenReturn(List.of(
                ChargeConfigTbl.builder().propertyId(propertyId).chargeName("Electricity")
                        .calculationStrategy(CalculationStrategyType.METERED).build()));
    }

    private UnitSummaryDTO unit(UUID id, String number, int capacity) {
        return new UnitSummaryDTO(id, propertyId, "Shared Room PG", number, 1, capacity, 0, 0, 1, 1, null, null);
    }

    private UnitResidentDTO member(UUID unitId, UnitMemberRole role) {
        return new UnitResidentDTO(UUID.randomUUID(), UUID.randomUUID(), role, unitId, "101", 1, propertyId);
    }
}
