package com.livic.core.finance;

import com.livic.platform.common.domain.BillingFrequency;
import com.livic.platform.common.domain.CalculationStrategyType;
import com.livic.platform.common.domain.ChargeCategory;
import com.livic.platform.common.domain.LeaseSplitStrategy;
import com.livic.platform.common.domain.LeaseStatus;
import com.livic.platform.common.domain.RentChargeType;
import com.livic.core.finance.domain.BillStatus;
import com.livic.platform.common.event.RentPublishedEvent;
import com.livic.platform.common.exception.BusinessException;
import com.livic.core.finance.domain.BillingWorksheetEntryTbl;
import com.livic.core.finance.domain.ChargeConfigTbl;
import com.livic.verticals.rental.lease.domain.LeaseTbl;
import com.livic.core.finance.domain.BillLineTbl;
import com.livic.core.finance.domain.BillTbl;
import com.livic.core.finance.domain.BillType;
import com.livic.core.finance.dto.BillingWorksheetDTOs.WorksheetEntryResponse;
import com.livic.core.finance.dto.ChargeConfigRequest;
import com.livic.verticals.rental.lease.dto.LeaseDTOs;
import com.livic.core.finance.dto.BillDTOs;
import com.livic.core.finance.dto.RentRollMetricsDTO;
import com.livic.verticals.rental.lease.mapper.LeaseMapper;
import com.livic.verticals.rental.billing.service.impl.BillingWorksheetServiceImpl;
import com.livic.core.finance.service.impl.ChargeConfigServiceImpl;
import com.livic.core.finance.service.impl.BillServiceImpl;
import com.livic.verticals.rental.billing.service.impl.RentGenerationServiceImpl;
import com.livic.verticals.rental.billing.service.impl.BillTransactionHelper;
import com.livic.core.finance.service.interfaces.BillingWorksheetCrudService;
import com.livic.core.finance.service.interfaces.ChargeConfigCrudService;
import com.livic.verticals.rental.lease.service.interfaces.LeaseCrudService;
import com.livic.verticals.rental.lease.service.interfaces.LeaseQueryService;
import com.livic.core.finance.service.interfaces.MeterReadingCrudService;
import com.livic.core.finance.service.interfaces.BillLineCrudService;
import com.livic.core.finance.service.interfaces.BillCrudService;
import com.livic.core.finance.service.interfaces.BillService;
import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.domain.UnitTbl;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.core.property.facade.UnitFacade;
import com.livic.platform.user.facade.UserFacade;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RentModelingFixesTest {

    @Mock
    private ChargeConfigCrudService chargeConfigCrudService;
    @Mock
    private PropertyFacade propertyFacade;
    @Mock
    private UnitFacade unitFacade;
    @Mock
    private BillingWorksheetCrudService billingWorksheetCrudService;
    @Mock
    private MeterReadingCrudService meterReadingCrudService;
    @Mock
    private BillLineCrudService billLineCrudService;
    @Mock
    private BillCrudService billCrudService;
    @Mock
    private LeaseQueryService leaseQueryService;
    @Mock
    private LeaseCrudService leaseCrudService;
    @Mock
    private ApplicationEventPublisher eventPublisher;
    @Mock
    private UserFacade userFacade;
    @Mock
    private com.livic.core.finance.service.interfaces.UnitBookingCrudService unitBookingCrudService;
    @Mock
    private com.livic.core.finance.service.interfaces.FinanceLedgerCrudService financeLedgerCrudService;
    @Mock
    private com.livic.core.finance.strategy.ChargeCalculationService chargeCalculationService;
    @Mock
    private com.livic.platform.payment.facade.PaymentFacade paymentFacade;
    @Mock
    private BillTransactionHelper transactionHelper;
    @Mock
    private com.livic.core.property.facade.UnitMemberFacade unitMemberFacade;

    @InjectMocks
    private ChargeConfigServiceImpl chargeConfigService;

    @InjectMocks
    private BillingWorksheetServiceImpl billingWorksheetService;

    @InjectMocks
    private BillServiceImpl billService;

    private RentGenerationServiceImpl rentGenerationService;

    private UUID propertyId;
    private UUID unitId;
    private UUID leaseId;
    private UUID chargeConfigId;
    private UUID memberId;
    private com.livic.core.property.dto.UnitResidentDTO payerResident;
    private PropertyTbl property;
    private UnitTbl unit;
    private LeaseTbl lease;
    private ChargeConfigTbl rentConfig;

    @BeforeEach
    void setUp() {
        propertyId = UUID.randomUUID();
        unitId = UUID.randomUUID();
        leaseId = UUID.randomUUID();
        chargeConfigId = UUID.randomUUID();
        memberId = UUID.randomUUID();

        property = new PropertyTbl();
        property.setId(propertyId);
        property.setName("Test Property");

        unit = new UnitTbl();
        unit.setId(unitId);
        unit.setProperty(property);
        unit.setUnitNumber("101");
        unit.setFloor(1);

        lease = LeaseTbl.builder()
                .userId(UUID.randomUUID())
                .unitId(unitId)
                .monthlyRentAmount(BigDecimal.valueOf(1500.00))
                .securityDeposit(BigDecimal.valueOf(3000.00))
                .splitStrategy(LeaseSplitStrategy.FULL_UNIT)
                .moveInDate(LocalDate.now())
                .status(LeaseStatus.ACTIVE)
                .build();
        lease.setId(leaseId);

        rentConfig = ChargeConfigTbl.builder()
                .propertyId(propertyId)
                .chargeName("Rent Charge")
                .chargeCategory(ChargeCategory.RENT)
                .billingFrequency(BillingFrequency.MONTHLY)
                .calculationStrategy(CalculationStrategyType.FIXED_RATE)
                .baseRate(BigDecimal.valueOf(9999.00)) // Legacy base rate should be ignored
                .isSystemRequired(true)
                .isActive(true)
                .build();
        rentConfig.setId(chargeConfigId);

        payerResident = new com.livic.core.property.dto.UnitResidentDTO(
                memberId, UUID.randomUUID(), com.livic.core.property.domain.UnitMemberRole.TENANT,
                leaseId, unitId, "101", 1, propertyId);

        transactionHelper = new BillTransactionHelper(
                billCrudService,
                billLineCrudService,
                unitFacade,
                unitMemberFacade,
                billingWorksheetCrudService,
                leaseCrudService,
                chargeConfigCrudService,
                chargeCalculationService,
                unitBookingCrudService,
                financeLedgerCrudService,
                billService
        );
        rentGenerationService = new RentGenerationServiceImpl(
                leaseQueryService,
                leaseCrudService,
                chargeConfigCrudService,
                meterReadingCrudService,
                unitFacade,
                billingWorksheetCrudService,
                transactionHelper,
                billService
        );
        billService = new BillServiceImpl(
                billCrudService,
                billLineCrudService,
                billingWorksheetCrudService,
                meterReadingCrudService,
                chargeConfigCrudService,
                paymentFacade,
                eventPublisher,
                userFacade,
                unitFacade,
                unitMemberFacade,
                propertyFacade
        );
    }

    @Test
    @DisplayName("Verification 3 & 4: ChargeConfigServiceImpl rejects category RENT")
    void testCreateChargeConfig_RejectsRentCategory() {
        ChargeConfigRequest request = new ChargeConfigRequest();
        request.setPropertyId(propertyId);
        request.setChargeName("Custom Rent Config");
        request.setChargeCategory(ChargeCategory.RENT);

        BusinessException exception = assertThrows(BusinessException.class, () ->
                chargeConfigService.createChargeConfig(request)
        );

        assertTrue(exception.getMessage().contains("Rent is no longer configured here"));
    }

    @Test
    @DisplayName("Verification 5: Rent cycle generation uses lease.monthlyRentAmount, not charge_config_tbl base_rate")
    void testProcessLeaseGeneration_SourcesFromLeaseMonthlyRentAmount() {
        when(leaseQueryService.getLeaseById(leaseId)).thenReturn(lease);
        when(unitMemberFacade.getResidentByLeaseId(leaseId)).thenReturn(Optional.of(payerResident));
        when(billCrudService.findByMemberIdAndBillingMonth(memberId, "2026-08", BillType.RENT)).thenReturn(Optional.empty());
        java.util.concurrent.atomic.AtomicReference<BillTbl> saved = new java.util.concurrent.atomic.AtomicReference<>();
        when(billCrudService.save(any(BillTbl.class))).thenAnswer(i -> {
            BillTbl c = i.getArgument(0);
            if (c.getId() == null) c.setId(UUID.randomUUID());
            saved.set(c);
            return c;
        });
        // generation hands back through core's read path, so that lookup has to resolve
        when(billCrudService.findById(any(UUID.class))).thenAnswer(i -> Optional.ofNullable(saved.get()));
        when(unitMemberFacade.getResidentByMemberId(memberId)).thenReturn(Optional.of(payerResident));

        BillDTOs.GenerateBillRequest request = new BillDTOs.GenerateBillRequest(leaseId, "2026-08", LocalDate.now().plusDays(10));
        rentGenerationService.generate(request);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<BillLineTbl>> chargeCaptor = ArgumentCaptor.forClass(List.class);
        verify(billLineCrudService, times(1)).saveAll(chargeCaptor.capture());

        BillLineTbl savedCharge = chargeCaptor.getValue().get(0);
        assertEquals(RentChargeType.BASE_RENT, savedCharge.getChargeType());
        assertEquals(BigDecimal.valueOf(1500.00), savedCharge.getAmount()); // Matches lease, NOT charge_config baseRate (9999.00)
    }

    @Test
    @DisplayName("Verification 6: Billing worksheet defaults RENT category from lease.monthlyRentAmount")
    void testGetOrCreateWorksheet_PrefillsRentFromLease() {
        org.springframework.security.core.context.SecurityContext securityContext = mock(org.springframework.security.core.context.SecurityContext.class);
        org.springframework.security.core.Authentication authentication = mock(org.springframework.security.core.Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(UUID.randomUUID().toString());
        org.springframework.security.core.context.SecurityContextHolder.setContext(securityContext);

        when(chargeConfigCrudService.findById(chargeConfigId)).thenReturn(Optional.of(rentConfig));
        when(unitFacade.getUnitsByPropertyId(propertyId)).thenReturn(List.of(UnitSummaryDTO.from(unit)));
        when(leaseQueryService.findActiveLeasesByProperty(propertyId)).thenReturn(List.of(lease));
        when(billingWorksheetCrudService.findAllByPropertyIdAndChargeConfigIdAndBillingMonth(propertyId, chargeConfigId, "2026-08")).thenReturn(List.of());
        when(userFacade.getUsersByIds(any())).thenReturn(Map.of());
        when(billCrudService.findByPropertyIdAndBillingMonth(propertyId, "2026-08")).thenReturn(List.of());

        List<WorksheetEntryResponse> responses = billingWorksheetService.getOrCreateWorksheetForMonth(propertyId, chargeConfigId, "2026-08");

        assertEquals(1, responses.size());
        assertEquals(BigDecimal.valueOf(1500.00), responses.get(0).getEnteredValue()); // Prefilled from lease
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Verification 7: Single cycle publish and unpublish transition status and fire event")
    void testSingleCyclePublishAndUnpublish() {
        BillTbl cycle = BillTbl.builder()
                .propertyId(propertyId)
                .memberId(memberId)
                .billType(BillType.RENT)
                .billingMonth("2026-08")
                .dueDate(LocalDate.now().plusDays(5))
                .totalAmount(BigDecimal.valueOf(1500.00))
                .status(BillStatus.PENDING)
                .build();
        UUID cycleId = UUID.randomUUID();
        cycle.setId(cycleId);

        when(billCrudService.findById(cycleId)).thenReturn(Optional.of(cycle));
        when(billCrudService.save(any(BillTbl.class))).thenAnswer(i -> i.getArgument(0));

        // Test Publish
        BillDTOs.BillResponse publishedResp = billService.publish(cycleId);
        assertEquals(BillStatus.PUBLISHED, publishedResp.status());
        verify(eventPublisher, times(1)).publishEvent(any(RentPublishedEvent.class));

        // Test Unpublish
        BillDTOs.BillResponse unpublishedResp = billService.unpublish(cycleId);
        assertEquals(BillStatus.PENDING, unpublishedResp.status());
    }

    @Test
    @DisplayName("LeaseMapper correctly maps monthlyRentAmount")
    void testLeaseMapper_MapsMonthlyRentAmount() {
        LeaseDTOs.CreateLeaseRequest request = new LeaseDTOs.CreateLeaseRequest(
                UUID.randomUUID(),
                unitId,
                BigDecimal.valueOf(2500.00),
                BigDecimal.valueOf(5000.00),
                LeaseSplitStrategy.FULL_UNIT,
                LocalDate.now(),
                null,
                LeaseStatus.ACTIVE,
                null
        );

        LeaseTbl entity = LeaseMapper.toEntity(request, request.unitId(), request.userId());
        assertEquals(BigDecimal.valueOf(2500.00), entity.getMonthlyRentAmount());

        LeaseDTOs.LeaseResponse response = LeaseMapper.toResponseWithDetails(entity, "John Doe", "1234567890");
        assertEquals(BigDecimal.valueOf(2500.00), response.monthlyRentAmount());
    }

    @Test
    @DisplayName("Landlord querying All Properties scopes strictly to owned properties")
    void testList_AllProperties_ScopesToLandlordProperties() {
        UUID landlordId = UUID.randomUUID();
        UUID myProperty1 = UUID.randomUUID();
        UUID myProperty2 = UUID.randomUUID();

        when(unitMemberFacade.getActiveResidencesByUserId(landlordId)).thenReturn(List.of());
        when(propertyFacade.getPropertiesByUserId(landlordId)).thenReturn(List.of(
                new PropertySummaryDTO(myProperty1, "My PG 1", "Address 1", "City", "Landmark", 3, true),
                new PropertySummaryDTO(myProperty2, "My PG 2", "Address 2", "City", "Landmark", 3, true)
        ));


        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 20);
        org.springframework.data.domain.Page<BillTbl> mockPage = new org.springframework.data.domain.PageImpl<>(List.of(), pageable, 0);
        when(billCrudService.findAll(any(org.springframework.data.jpa.domain.Specification.class), eq(pageable)))
                .thenReturn(mockPage);

        BillDTOs.BillListResponse result = billService.list(landlordId, null, null, "2026-08", null, null, pageable);

        assertNotNull(result);
        assertEquals(0, result.totalElements());
        verify(propertyFacade, times(1)).getPropertiesByUserId(landlordId);
    }

    @Test
    @DisplayName("Landlord querying foreign property they do not own returns empty 0 results immediately")
    void testList_UnauthorizedForeignProperty_ReturnsEmpty() {
        UUID landlordId = UUID.randomUUID();
        UUID foreignPropertyId = UUID.randomUUID();

        when(unitMemberFacade.getActiveResidencesByUserId(landlordId)).thenReturn(List.of());
        when(propertyFacade.getPropertiesByUserId(landlordId)).thenReturn(List.of()); // Owns 0 properties

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 20);
        BillDTOs.BillListResponse result = billService.list(landlordId, foreignPropertyId, null, "2026-08", null, null, pageable);

        assertNotNull(result);
        assertEquals(0, result.totalElements());
        assertTrue(result.content().isEmpty());
        verify(billCrudService, never()).findAll(any(org.springframework.data.jpa.domain.Specification.class), any(org.springframework.data.domain.Pageable.class));
    }

    @Test
    @DisplayName("Tenant querying bills scopes strictly to their own tenancy")
    void testList_Tenant_ScopesStrictlyToOwnTenancy() {
        UUID tenantId = UUID.randomUUID();

        when(unitMemberFacade.getActiveResidencesByUserId(tenantId)).thenReturn(List.of(payerResident));

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 20);
        org.springframework.data.domain.Page<BillTbl> mockPage = new org.springframework.data.domain.PageImpl<>(List.of(), pageable, 0);
        when(billCrudService.findAll(any(org.springframework.data.jpa.domain.Specification.class), eq(pageable)))
                .thenReturn(mockPage);

        BillDTOs.BillListResponse result = billService.list(tenantId, null, null, "2026-08", null, null, pageable);

        assertNotNull(result);
        verify(propertyFacade, never()).getPropertiesByUserId(any());
    }

    @Test
    @DisplayName("Landlord querying rent cycles uses bulk unit resolution and single-query metrics aggregation")
    void testList_LandlordScope_UsesBulkUnitResolutionAndMetrics() {
        UUID landlordId = UUID.randomUUID();
        UUID propertyId1 = UUID.randomUUID();
        UUID propertyId2 = UUID.randomUUID();

        when(unitMemberFacade.getActiveResidencesByUserId(landlordId)).thenReturn(List.of());
        when(propertyFacade.getPropertiesByUserId(landlordId)).thenReturn(List.of(
                new PropertySummaryDTO(propertyId1, "Property 1", "Addr 1", "City", "Landmark", 5, true),
                new PropertySummaryDTO(propertyId2, "Property 2", "Addr 2", "City", "Landmark", 5, true)
        ));

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 20);
        org.springframework.data.domain.Page<BillTbl> mockPage = new org.springframework.data.domain.PageImpl<>(List.of(), pageable, 0);
        when(billCrudService.findAll(any(org.springframework.data.jpa.domain.Specification.class), eq(pageable)))
                .thenReturn(mockPage);

        when(billCrudService.getRentRollMetricsForProperties(any(), eq("2026-08"), any(), any(), any(), any(), any()))
                .thenReturn(new RentRollMetricsDTO(BigDecimal.valueOf(50000), 2L, 8L));

        BillDTOs.BillListResponse result = billService.list(landlordId, null, null, "2026-08", null, null, pageable);

        assertNotNull(result);
        assertEquals(BigDecimal.valueOf(50000), result.metrics().totalExpectedRevenue());
        assertEquals(2L, result.metrics().pendingDraftsCount());
        assertEquals(8L, result.metrics().publishedCount());

        // Bills carry their property, so listing them resolves no units at all now — not per
        // property, and not in bulk either.
        verify(unitFacade, never()).getUnitsByPropertyIds(any());
        verify(unitFacade, never()).getUnitsByPropertyId(any());
        verify(billCrudService, times(1)).getRentRollMetricsForProperties(any(), eq("2026-08"), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Verification: RentGenerationServiceImpl.batchGenerate uses billService.toResponses and avoids N+1 getById")
    void testBatchGenerate_UsesBulkToResponses() {
        BillService mockBillService = mock(BillService.class);
        BillTransactionHelper mockTxHelper = mock(BillTransactionHelper.class);
        RentGenerationServiceImpl service = new RentGenerationServiceImpl(
                leaseQueryService,
                leaseCrudService,
                chargeConfigCrudService,
                meterReadingCrudService,
                unitFacade,
                billingWorksheetCrudService,
                mockTxHelper,
                mockBillService
        );

        UUID propId = UUID.randomUUID();
        UUID u1 = UUID.randomUUID();
        UUID u2 = UUID.randomUUID();

        when(unitFacade.getUnitsByPropertyId(propId)).thenReturn(List.of(
                new UnitSummaryDTO(u1, propId, "Test Property", "101", 1, 1, 0, 0, 1, 1, null, null),
                new UnitSummaryDTO(u2, propId, "Test Property", "102", 1, 1, 0, 0, 1, 1, null, null)
        ));

        LeaseTbl lease1 = new LeaseTbl();
        lease1.setId(UUID.randomUUID());
        lease1.setUnitId(u1);
        lease1.setStatus(LeaseStatus.ACTIVE);

        LeaseTbl lease2 = new LeaseTbl();
        lease2.setId(UUID.randomUUID());
        lease2.setUnitId(u2);
        lease2.setStatus(LeaseStatus.ACTIVE);

        when(leaseCrudService.findByUnitIdInAndStatus(any(), eq(LeaseStatus.ACTIVE)))
                .thenReturn(List.of(lease1, lease2));

        BillTbl bill1 = new BillTbl();
        bill1.setId(UUID.randomUUID());
        BillTbl bill2 = new BillTbl();
        bill2.setId(UUID.randomUUID());

        when(mockTxHelper.generateSingleInTransaction(eq(lease1), any(), any(), any(), any(), any(), any()))
                .thenReturn(bill1);
        when(mockTxHelper.generateSingleInTransaction(eq(lease2), any(), any(), any(), any(), any(), any()))
                .thenReturn(bill2);

        BillDTOs.BillResponse response1 = new BillDTOs.BillResponse(
                bill1.getId(), lease1.getId(), "Tenant 1", "101", "2026-08",
                BigDecimal.valueOf(1000), LocalDate.now(), BillStatus.PENDING, null, null, null, List.of()
        );
        BillDTOs.BillResponse response2 = new BillDTOs.BillResponse(
                bill2.getId(), lease2.getId(), "Tenant 2", "102", "2026-08",
                BigDecimal.valueOf(1200), LocalDate.now(), BillStatus.PENDING, null, null, null, List.of()
        );

        when(mockBillService.toResponses(List.of(bill1, bill2))).thenReturn(List.of(response1, response2));

        BillDTOs.BatchGenerateResult result = service.batchGenerate(
                new BillDTOs.BatchGenerateBillRequest(propId, "2026-08", LocalDate.now().plusDays(5))
        );

        assertNotNull(result);
        assertEquals(2, result.succeeded().size());
        assertEquals(0, result.failed().size());

        // Verify bulk mapping was invoked once with all generated bills, and getById was NEVER called
        verify(mockBillService, times(1)).toResponses(List.of(bill1, bill2));
        verify(mockBillService, never()).getById(any());
    }
}

