package com.livic.core.finance;

import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.domain.BillTbl;
import com.livic.core.finance.domain.BillType;
import com.livic.core.finance.dto.BillDTOs;
import com.livic.core.finance.dto.BillMetricsDTO;
import com.livic.core.finance.repository.BillLineRepository;
import com.livic.core.finance.repository.BillRepository;
import com.livic.core.finance.repository.BillingWorksheetRepository;
import com.livic.core.finance.repository.ChargeConfigRepository;
import com.livic.core.finance.repository.MeterReadingRepository;
import com.livic.core.finance.service.impl.BillServiceImpl;
import com.livic.core.property.domain.UnitMemberRole;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.core.property.facade.UnitFacade;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.platform.common.event.RentPublishedEvent;
import com.livic.platform.payment.facade.PaymentFacade;
import com.livic.platform.user.facade.UserFacade;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Publishing and listing bills: core's side of billing, which knows payers, not leases. */
@ExtendWith(MockitoExtension.class)
class BillServiceTest {

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

    private UUID propertyId;
    private UUID memberId;
    private UnitResidentDTO payer;

    @BeforeEach
    void setUp() {
        propertyId = UUID.randomUUID();
        memberId = UUID.randomUUID();
        payer = new UnitResidentDTO(memberId, UUID.randomUUID(), UnitMemberRole.TENANT,
                UUID.randomUUID(), UUID.randomUUID(), "101", 1, propertyId);
    }

    @Test
    @DisplayName("Publishing and unpublishing a bill move its status and announce the publication")
    void publishAndUnpublish() {
        BillTbl bill = BillTbl.builder()
                .propertyId(propertyId)
                .memberId(memberId)
                .billType(BillType.RENT)
                .billingMonth("2026-08")
                .dueDate(LocalDate.now().plusDays(5))
                .totalAmount(BigDecimal.valueOf(1500.00))
                .status(BillStatus.PENDING)
                .build();
        UUID billId = UUID.randomUUID();
        bill.setId(billId);

        when(billRepository.findById(billId)).thenReturn(Optional.of(bill));
        when(billRepository.save(any(BillTbl.class))).thenAnswer(i -> i.getArgument(0));

        assertEquals(BillStatus.PUBLISHED, billService.publish(billId).status());
        verify(eventPublisher, times(1)).publishEvent(any(RentPublishedEvent.class));

        assertEquals(BillStatus.PENDING, billService.unpublish(billId).status());
    }

    @Test
    @DisplayName("A landlord listing all properties sees only the properties they belong to")
    void listAllPropertiesScopesToTheLandlordsProperties() {
        UUID landlordId = UUID.randomUUID();
        when(unitMemberFacade.getActiveResidencesByUserId(landlordId)).thenReturn(List.of());
        when(propertyFacade.getPropertiesByUserId(landlordId)).thenReturn(List.of(
                new PropertySummaryDTO(UUID.randomUUID(), "My PG 1", "Address 1", "City", "Landmark", true),
                new PropertySummaryDTO(UUID.randomUUID(), "My PG 2", "Address 2", "City", "Landmark", true)));
        Pageable pageable = PageRequest.of(0, 20);
        when(billRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(emptyPage(pageable));

        BillDTOs.BillListResponse result = billService.list(landlordId, null, null, "2026-08", null, null, pageable);

        assertNotNull(result);
        assertEquals(0, result.totalElements());
        verify(propertyFacade, times(1)).getPropertiesByUserId(landlordId);
    }

    @Test
    @DisplayName("A landlord asking for a property they do not belong to gets an empty page")
    void listForeignPropertyIsEmpty() {
        UUID landlordId = UUID.randomUUID();
        when(unitMemberFacade.getActiveResidencesByUserId(landlordId)).thenReturn(List.of());
        when(propertyFacade.getPropertiesByUserId(landlordId)).thenReturn(List.of());
        Pageable pageable = PageRequest.of(0, 20);

        BillDTOs.BillListResponse result = billService.list(landlordId, UUID.randomUUID(), null, "2026-08", null, null, pageable);

        assertTrue(result.content().isEmpty());
        verify(billRepository, never()).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    @DisplayName("A tenant listing bills sees only their own")
    void listForATenantScopesToTheirOwnBills() {
        UUID tenantId = UUID.randomUUID();
        when(unitMemberFacade.getActiveResidencesByUserId(tenantId)).thenReturn(List.of(payer));
        Pageable pageable = PageRequest.of(0, 20);
        when(billRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(emptyPage(pageable));

        assertNotNull(billService.list(tenantId, null, null, "2026-08", null, null, pageable));
        verify(propertyFacade, never()).getPropertiesByUserId(any());
    }

    @Test
    @DisplayName("Listing aggregates the month's metrics in one query and resolves no units")
    void listUsesOneMetricsQuery() {
        UUID landlordId = UUID.randomUUID();
        when(unitMemberFacade.getActiveResidencesByUserId(landlordId)).thenReturn(List.of());
        when(propertyFacade.getPropertiesByUserId(landlordId)).thenReturn(List.of(
                new PropertySummaryDTO(UUID.randomUUID(), "Property 1", "Addr 1", "City", "Landmark", true),
                new PropertySummaryDTO(UUID.randomUUID(), "Property 2", "Addr 2", "City", "Landmark", true)));
        Pageable pageable = PageRequest.of(0, 20);
        when(billRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(emptyPage(pageable));
        when(billRepository.getBillMetrics(any(), eq("2026-08"), any(), any(), any(), any(), any()))
                .thenReturn(new BillMetricsDTO(BigDecimal.valueOf(50000), 2L, 8L));

        BillDTOs.BillListResponse result = billService.list(landlordId, null, null, "2026-08", null, null, pageable);

        assertEquals(BigDecimal.valueOf(50000), result.metrics().totalExpectedRevenue());
        assertEquals(2L, result.metrics().pendingDraftsCount());
        assertEquals(8L, result.metrics().publishedCount());
        // Bills carry their property, so listing them resolves no units at all.
        verify(unitFacade, never()).getUnitsByPropertyIds(any());
        verify(unitFacade, never()).getUnitsByPropertyId(any());
        verify(billRepository, times(1)).getBillMetrics(any(), eq("2026-08"), any(), any(), any(), any(), any());
    }

    private static Page<BillTbl> emptyPage(Pageable pageable) {
        return new PageImpl<>(List.of(), pageable, 0);
    }
}
