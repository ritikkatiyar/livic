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
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.facade.UnitFacade;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.platform.auth.facade.AuthFacade;
import com.livic.core.finance.event.BillPublishedEvent;
import com.livic.platform.outbox.facade.OutboxFacade;
import com.livic.platform.payment.facade.PaymentFacade;
import com.livic.platform.user.facade.UserFacade;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
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
    @Mock private OutboxFacade outboxFacade;
    @Mock private UserFacade userFacade;
    @Mock private UnitFacade unitFacade;
    @Mock private UnitMemberFacade unitMemberFacade;
    @Mock private AuthFacade authFacade;

    @InjectMocks private BillServiceImpl billService;

    private UUID propertyId;
    private UUID memberId;
    private UnitResidentDTO payer;

    @BeforeEach
    void setUp() {
        propertyId = UUID.randomUUID();
        memberId = UUID.randomUUID();
        payer = new UnitResidentDTO(memberId, UUID.randomUUID(), UnitMemberRole.TENANT, UUID.randomUUID(), "101", 1, propertyId);
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
        // The payer is told through the outbox, after the publish commits.
        verify(outboxFacade, times(1)).publish(any(BillPublishedEvent.class));

        assertEquals(BillStatus.PENDING, billService.unpublish(billId).status());
    }

    @Test
    @DisplayName("Staff listing every property see only those where they hold BILL_VIEW")
    void listScopesToPropertiesWithBillView() {
        UUID staffId = UUID.randomUUID();
        UUID billsProperty = UUID.randomUUID();
        UUID issuesOnlyProperty = UUID.randomUUID();
        when(authFacade.getEffectivePermissionCodes(staffId)).thenReturn(Map.of(
                billsProperty, Set.of("BILL_VIEW"),
                issuesOnlyProperty, Set.of("ISSUE_VIEW")));
        Pageable pageable = PageRequest.of(0, 20);
        when(billRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(emptyPage(pageable));

        billService.list(staffId, null, "2026-08", null, null, pageable);

        // Being a member of a property is not enough: the caretaker who only handles issues sees no bills.
        verify(billRepository).getBillMetrics(eq(List.of(billsProperty)), eq("2026-08"), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("A property the caller cannot view bills on gives an empty page")
    void listPropertyWithoutBillViewIsEmpty() {
        UUID staffId = UUID.randomUUID();
        UUID propertyId = UUID.randomUUID();
        when(authFacade.getEffectivePermissionCodes(staffId)).thenReturn(Map.of(propertyId, Set.of("ISSUE_VIEW")));
        Pageable pageable = PageRequest.of(0, 20);

        BillDTOs.BillListResponse result = billService.list(staffId, propertyId, "2026-08", null, null, pageable);

        assertTrue(result.content().isEmpty());
        verify(billRepository, never()).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    @DisplayName("Staff who also live in a unit still get the staff view; their own bills are under /me/bills")
    void staffWhoAreAlsoPayersKeepTheStaffView() {
        UUID ownerManagerId = UUID.randomUUID();
        when(authFacade.getEffectivePermissionCodes(ownerManagerId)).thenReturn(Map.of(propertyId, Set.of("BILL_VIEW")));
        Pageable pageable = PageRequest.of(0, 20);
        when(billRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(emptyPage(pageable));

        billService.list(ownerManagerId, propertyId, "2026-08", null, null, pageable);

        verify(billRepository).findAll(any(Specification.class), eq(pageable));
        verify(unitMemberFacade, never()).getActiveResidencesByUserId(any());
    }

    @Test
    @DisplayName("A payer sees the bills they pay, and never a draft")
    void payersSeeTheirOwnPublishedBills() {
        UUID tenantId = UUID.randomUUID();
        when(unitMemberFacade.getActiveResidencesByUserId(tenantId)).thenReturn(List.of(payer));
        Pageable pageable = PageRequest.of(0, 20);
        when(billRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(emptyPage(pageable));

        assertNotNull(billService.listForPayer(tenantId, "2026-08", null, pageable));
        verify(billRepository, times(1)).findAll(any(Specification.class), eq(pageable));

        assertTrue(billService.listForPayer(tenantId, "2026-08", BillStatus.PENDING, pageable).content().isEmpty());
        verify(billRepository, times(1)).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    @DisplayName("Someone who pays for no unit has no bills of their own")
    void nonPayersHaveNoBills() {
        UUID staffId = UUID.randomUUID();
        when(unitMemberFacade.getActiveResidencesByUserId(staffId)).thenReturn(List.of());

        assertTrue(billService.listForPayer(staffId, null, null, PageRequest.of(0, 20)).content().isEmpty());
        verify(billRepository, never()).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    @DisplayName("Listing aggregates the month's metrics in one query and resolves no units")
    void listUsesOneMetricsQuery() {
        UUID landlordId = UUID.randomUUID();
        when(authFacade.getEffectivePermissionCodes(landlordId)).thenReturn(Map.of(
                UUID.randomUUID(), Set.of("BILL_VIEW"),
                UUID.randomUUID(), Set.of("BILL_VIEW", "BILL_MANAGE")));
        Pageable pageable = PageRequest.of(0, 20);
        when(billRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(emptyPage(pageable));
        when(billRepository.getBillMetrics(any(), eq("2026-08"), any(), any(), any(), any(), any()))
                .thenReturn(new BillMetricsDTO(BigDecimal.valueOf(50000), 2L, 8L));

        BillDTOs.BillListResponse result = billService.list(landlordId, null, "2026-08", null, null, pageable);

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
