package com.livic.core.finance;

import com.livic.core.finance.domain.CalculationStrategyType;
import com.livic.core.finance.domain.ChargeConfigTbl;
import com.livic.core.finance.dto.BillingWorksheetDTOs.WorksheetEntryResponse;
import com.livic.core.finance.repository.BillRepository;
import com.livic.core.finance.repository.BillingWorksheetRepository;
import com.livic.core.finance.repository.ChargeConfigRepository;
import com.livic.core.finance.service.impl.BillingWorksheetServiceImpl;
import com.livic.core.property.domain.UnitMemberRole;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.UnitFacade;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.platform.user.facade.UserFacade;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/** The worksheet lists units by who pays for them, so it works for owners as well as tenants. */
@ExtendWith(MockitoExtension.class)
class BillingWorksheetServiceTest {

    @Mock private BillingWorksheetRepository billingWorksheetRepository;
    @Mock private ChargeConfigRepository chargeConfigRepository;
    @Mock private BillRepository billRepository;
    @Mock private UnitFacade unitFacade;
    @Mock private UnitMemberFacade unitMemberFacade;
    @Mock private UserFacade userFacade;

    @InjectMocks private BillingWorksheetServiceImpl worksheetService;

    private final UUID propertyId = UUID.randomUUID();

    @Test
    @DisplayName("A new entry starts from the charge's base rate, for each unit that has a payer")
    void entriesStartFromTheBaseRate() {
        UUID ownerUnit = UUID.randomUUID();
        UUID familyOnlyUnit = UUID.randomUUID();
        ChargeConfigTbl water = ChargeConfigTbl.builder().propertyId(propertyId).chargeName("Water")
                .calculationStrategy(CalculationStrategyType.FIXED_RATE).baseRate(BigDecimal.valueOf(250)).isActive(true).build();
        water.setId(UUID.randomUUID());

        when(chargeConfigRepository.findById(water.getId())).thenReturn(Optional.of(water));
        when(unitMemberFacade.getActiveResidentsByPropertyId(propertyId)).thenReturn(List.of(
                resident(ownerUnit, UnitMemberRole.OWNER),
                // Family members live in a unit but do not pay for it.
                resident(familyOnlyUnit, UnitMemberRole.FAMILY)));
        when(billingWorksheetRepository.findAllByPropertyIdAndChargeConfigIdAndBillingMonth(propertyId, water.getId(), "2026-08"))
                .thenReturn(List.of());
        when(unitFacade.getUnitsByPropertyId(propertyId)).thenReturn(List.of(
                new UnitSummaryDTO(ownerUnit, propertyId, "Palm Court", "102", 1, 1, 0, 0, 1, 1, null, null)));
        when(userFacade.getUsersByIds(any())).thenReturn(Map.of());
        when(billRepository.findByPropertyIdAndBillingMonth(propertyId, "2026-08")).thenReturn(List.of());

        List<WorksheetEntryResponse> entries = worksheetService.getOrCreateWorksheetForMonth(propertyId, water.getId(), "2026-08", null);

        assertThat(entries).hasSize(1);
        assertThat(entries.get(0).getUnitId()).isEqualTo(ownerUnit);
        assertThat(entries.get(0).getEnteredValue()).isEqualByComparingTo("250");
        assertThat(entries.get(0).isBilled()).isFalse();
    }

    private UnitResidentDTO resident(UUID unitId, UnitMemberRole role) {
        return new UnitResidentDTO(UUID.randomUUID(), UUID.randomUUID(), role, null, unitId, "1", 1, propertyId);
    }
}
