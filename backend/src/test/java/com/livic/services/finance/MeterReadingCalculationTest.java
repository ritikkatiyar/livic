package com.livic.services.finance;

import com.livic.platform.common.domain.BillingFrequency;
import com.livic.platform.common.domain.CalculationStrategyType;
import com.livic.platform.common.domain.ChargeCategory;
import com.livic.platform.common.domain.FacingDirection;
import com.livic.platform.common.domain.LeaseSplitStrategy;
import com.livic.platform.common.domain.LeaseStatus;
import com.livic.platform.common.domain.UnitType;
import com.livic.platform.common.domain.UserRole;
import com.livic.services.finance.domain.ChargeConfigTbl;
import com.livic.services.finance.domain.LeaseTbl;
import com.livic.services.finance.domain.MeterReadingTbl;
import com.livic.services.finance.dto.MeterReadingDTOs.MeterReadingRequest;
import com.livic.services.finance.dto.MeterReadingDTOs.MeterReadingResponse;
import com.livic.services.finance.dto.MeterReadingDTOs.UnitReading;
import com.livic.services.finance.service.impl.MeterReadingServiceImpl;
import com.livic.services.finance.service.interfaces.ChargeConfigCrudService;
import com.livic.services.finance.service.interfaces.LeaseQueryService;
import com.livic.services.finance.service.interfaces.MeterReadingCrudService;
import com.livic.services.finance.strategy.CalculationResult;
import com.livic.services.finance.strategy.MeteredCalculation;
import com.livic.services.property.dto.PropertySummaryDTO;
import com.livic.services.property.dto.UnitSummaryDTO;
import com.livic.services.property.facade.PropertyFacade;
import com.livic.services.property.facade.UnitFacade;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MeterReadingCalculationTest {

    @Mock
    private MeterReadingCrudService meterReadingCrudService;
    @Mock
    private LeaseQueryService leaseQueryService;
    @Mock
    private ChargeConfigCrudService chargeConfigCrudService;
    @Mock
    private PropertyFacade propertyFacade;
    @Mock
    private UnitFacade unitFacade;
    @Mock
    private UserFacade userFacade;

    @InjectMocks
    private MeterReadingServiceImpl meterReadingService;

    private MeteredCalculation meteredCalculation;

    private UUID propertyId;
    private UUID unitId;
    private UUID chargeConfigId;
    private UUID leaseId;
    private UUID userId;
    private ChargeConfigTbl electricityConfig;
    private PropertySummaryDTO propertySummary;
    private UnitSummaryDTO unitSummary;
    private UserSummaryDTO userSummary;

    @BeforeEach
    void setUp() {
        propertyId = UUID.randomUUID();
        unitId = UUID.randomUUID();
        chargeConfigId = UUID.randomUUID();
        leaseId = UUID.randomUUID();
        userId = UUID.randomUUID();

        electricityConfig = ChargeConfigTbl.builder()
                .chargeName("Electricity")
                .chargeCategory(ChargeCategory.ELECTRICITY)
                .billingFrequency(BillingFrequency.MONTHLY)
                .calculationStrategy(CalculationStrategyType.METERED)
                .unitType("kWh")
                .baseRate(new BigDecimal("10.00"))
                .applySalesTax(false)
                .build();
        electricityConfig.setId(chargeConfigId);

        propertySummary = new PropertySummaryDTO(propertyId, "Test Property", "Address", "City", "Landmark", 4, true);
        unitSummary = new UnitSummaryDTO(unitId, propertyId, "Test Property", "401", 4, 1, 0, 0, 1, 1, UnitType.SINGLE_UNIT, FacingDirection.NORTH);
        userSummary = new UserSummaryDTO(userId, "ritik@example.com", "ritik katiyar", "+919999999999", UserRole.USER);

        meteredCalculation = new MeteredCalculation(meterReadingCrudService);
    }

    @Test
    @DisplayName("Initial month: previous reading defaults to 0, saves user-specified prev (15552) and current (15706)")
    void testInitialWorksheetAndSave() {
        when(propertyFacade.getPropertyById(propertyId)).thenReturn(Optional.of(propertySummary));
        when(chargeConfigCrudService.findById(chargeConfigId)).thenReturn(Optional.of(electricityConfig));
        when(unitFacade.getUnitsByPropertyId(propertyId)).thenReturn(List.of(unitSummary));

        LeaseTbl activeLease = LeaseTbl.builder()
                .unitId(unitId)
                .userId(userId)
                .moveInDate(LocalDate.of(2026, 1, 1))
                .monthlyRentAmount(new BigDecimal("15000.00"))
                .securityDeposit(new BigDecimal("30000.00"))
                .splitStrategy(LeaseSplitStrategy.FULL_UNIT)
                .status(LeaseStatus.ACTIVE)
                .build();
        activeLease.setId(leaseId);

        when(leaseQueryService.findActiveLeasesByProperty(propertyId)).thenReturn(List.of(activeLease));
        when(userFacade.getUsersByIds(Set.of(userId))).thenReturn(Map.of(userId, userSummary));

        // Month 8 (August 2026) has no existing readings
        when(meterReadingCrudService.findByPropertyIdAndChargeConfigIdAndBillingMonthAndBillingYear(propertyId, chargeConfigId, 8, 2026))
                .thenReturn(List.of());
        // Month 7 (July 2026) has no previous readings
        when(meterReadingCrudService.findByPropertyIdAndChargeConfigIdAndBillingMonthAndBillingYear(propertyId, chargeConfigId, 7, 2026))
                .thenReturn(List.of());

        when(meterReadingCrudService.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        List<MeterReadingResponse> worksheet = meterReadingService.getOrCreateWorksheet(propertyId, chargeConfigId, 8, 2026);
        assertEquals(1, worksheet.size());
        assertEquals(4, worksheet.get(0).getFloor());
        assertEquals(BigDecimal.ZERO, worksheet.get(0).getPreviousReading());
        assertNull(worksheet.get(0).getCurrentReading());

        // Now simulate user saving Prev: 15552, Current: 15706
        MeterReadingTbl existingTbl = MeterReadingTbl.builder()
                .propertyId(propertyId)
                .unitId(unitId)
                .chargeConfig(electricityConfig)
                .billingMonth(8)
                .billingYear(2026)
                .previousReading(BigDecimal.ZERO)
                .currentReading(null)
                .isBilled(false)
                .build();

        when(meterReadingCrudService.findByPropertyIdAndChargeConfigIdAndBillingMonthAndBillingYear(propertyId, chargeConfigId, 8, 2026))
                .thenReturn(List.of(existingTbl));

        MeterReadingRequest saveReq = new MeterReadingRequest(
                propertyId,
                chargeConfigId,
                8,
                2026,
                List.of(new UnitReading(unitId, new BigDecimal("15552"), new BigDecimal("15706")))
        );

        meterReadingService.batchSaveReadings(saveReq);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<MeterReadingTbl>> captor = ArgumentCaptor.forClass(List.class);
        verify(meterReadingCrudService, times(2)).saveAll(captor.capture());

        List<List<MeterReadingTbl>> allValues = captor.getAllValues();
        List<MeterReadingTbl> savedList = allValues.get(allValues.size() - 1);
        assertEquals(1, savedList.size());
        assertEquals(new BigDecimal("15552"), savedList.get(0).getPreviousReading());
        assertEquals(new BigDecimal("15706"), savedList.get(0).getCurrentReading());
    }

    @Test
    @DisplayName("Next month (September 2026): previous reading automatically carries over from August (15706)")
    void testNextMonthCarriesOverCurrentAsPrevious() {
        when(propertyFacade.getPropertyById(propertyId)).thenReturn(Optional.of(propertySummary));
        when(chargeConfigCrudService.findById(chargeConfigId)).thenReturn(Optional.of(electricityConfig));
        when(unitFacade.getUnitsByPropertyId(propertyId)).thenReturn(List.of(unitSummary));

        LeaseTbl activeLease = LeaseTbl.builder()
                .unitId(unitId)
                .userId(userId)
                .moveInDate(LocalDate.of(2026, 1, 1))
                .monthlyRentAmount(new BigDecimal("15000.00"))
                .securityDeposit(new BigDecimal("30000.00"))
                .splitStrategy(LeaseSplitStrategy.FULL_UNIT)
                .status(LeaseStatus.ACTIVE)
                .build();
        activeLease.setId(leaseId);

        when(leaseQueryService.findActiveLeasesByProperty(propertyId)).thenReturn(List.of(activeLease));
        when(userFacade.getUsersByIds(Set.of(userId))).thenReturn(Map.of(userId, userSummary));

        // Month 9 (September 2026) has no readings yet
        when(meterReadingCrudService.findByPropertyIdAndChargeConfigIdAndBillingMonthAndBillingYear(propertyId, chargeConfigId, 9, 2026))
                .thenReturn(List.of());

        // Month 8 (August 2026) had currentReading = 15706
        MeterReadingTbl augustReading = MeterReadingTbl.builder()
                .propertyId(propertyId)
                .unitId(unitId)
                .chargeConfig(electricityConfig)
                .billingMonth(8)
                .billingYear(2026)
                .previousReading(new BigDecimal("15552"))
                .currentReading(new BigDecimal("15706"))
                .isBilled(true)
                .build();
        when(meterReadingCrudService.findByPropertyIdAndChargeConfigIdAndBillingMonthAndBillingYear(propertyId, chargeConfigId, 8, 2026))
                .thenReturn(List.of(augustReading));

        when(meterReadingCrudService.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        List<MeterReadingResponse> septemberWorksheet = meterReadingService.getOrCreateWorksheet(propertyId, chargeConfigId, 9, 2026);
        assertEquals(1, septemberWorksheet.size());
        assertEquals(new BigDecimal("15706"), septemberWorksheet.get(0).getPreviousReading());
        assertNull(septemberWorksheet.get(0).getCurrentReading());
    }

    @Test
    @DisplayName("Calculation strategy: 15706 - 15552 = 154 kWh @ ₹10/kWh = ₹1540.00")
    void testMeteredCalculation() {
        MeterReadingTbl reading = MeterReadingTbl.builder()
                .unitId(unitId)
                .chargeConfig(electricityConfig)
                .billingMonth(8)
                .billingYear(2026)
                .previousReading(new BigDecimal("15552"))
                .currentReading(new BigDecimal("15706"))
                .build();

        when(meterReadingCrudService.findByUnitIdAndChargeConfigIdAndBillingMonthAndBillingYear(unitId, chargeConfigId, 8, 2026))
                .thenReturn(Optional.of(reading));

        CalculationResult result = meteredCalculation.calculate(electricityConfig, unitId, "2026-08");

        assertEquals(0, new BigDecimal("1540.00").compareTo(result.amount()));
        assertEquals("154 units", result.descriptionDetail());
    }
}
