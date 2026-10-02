package com.livic.verticals.rental.billing;

import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.domain.BillType;
import com.livic.core.finance.domain.UnitBookingStatus;
import com.livic.core.finance.domain.UnitBookingTbl;
import com.livic.core.finance.dto.BillDTOs;
import com.livic.core.finance.dto.BillDraft;
import com.livic.core.finance.facade.FinanceFacade;
import com.livic.core.finance.repository.UnitBookingRepository;
import com.livic.core.property.domain.UnitMemberRole;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.UnitFacade;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.verticals.rental.billing.dto.RentGenerationDTOs.BatchGenerateBillRequest;
import com.livic.verticals.rental.billing.dto.RentGenerationDTOs.BatchGenerateResult;
import com.livic.verticals.rental.billing.dto.RentGenerationDTOs.GenerateBillRequest;
import com.livic.verticals.rental.billing.service.impl.RentGenerationServiceImpl;
import com.livic.verticals.rental.lease.domain.LeaseStatus;
import com.livic.verticals.rental.lease.domain.LeaseTbl;
import com.livic.verticals.rental.lease.service.interfaces.LeaseQueryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Rental's half of billing: what a lease puts on a rent bill. Core adds the property's charges. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RentGenerationServiceTest {

    @Mock private LeaseQueryService leaseQueryService;
    @Mock private UnitMemberFacade unitMemberFacade;
    @Mock private UnitFacade unitFacade;
    @Mock private FinanceFacade financeFacade;
    @Mock private UnitBookingRepository unitBookingRepository;

    @InjectMocks private RentGenerationServiceImpl rentGenerationService;

    private final UUID propertyId = UUID.randomUUID();
    private final UUID unitId = UUID.randomUUID();

    @Test
    @DisplayName("A rent bill starts from the lease's rent, shared by nobody")
    void draftCarriesTheLeaseRent() {
        LeaseTbl lease = lease(unitId, 1500);
        UUID memberId = payerFor(lease);
        when(leaseQueryService.getLeaseById(lease.getId())).thenReturn(lease);
        when(leaseQueryService.findByUnitIdAndStatus(unitId, LeaseStatus.ACTIVE)).thenReturn(List.of(lease));
        when(financeFacade.hasOtherBills(memberId, "2026-08", BillType.RENT)).thenReturn(true);

        rentGenerationService.generate(new GenerateBillRequest(lease.getId(), "2026-08", LocalDate.now()));

        BillDraft draft = generatedDraft();
        assertThat(draft.payerMemberId()).isEqualTo(memberId);
        assertThat(draft.billType()).isEqualTo(BillType.RENT);
        assertThat(draft.shareCount()).isEqualTo(1);
        assertThat(draft.lines()).containsExactly(new BillDraft.Line("Rent", BigDecimal.valueOf(1500)));
    }

    @Test
    @DisplayName("The booking token is credited once, as a negative line on the tenant's first bill")
    void tokenIsCreditedOnTheFirstBill() {
        LeaseTbl lease = lease(unitId, 1500);
        UUID memberId = payerFor(lease);
        when(leaseQueryService.getLeaseById(lease.getId())).thenReturn(lease);
        when(leaseQueryService.findByUnitIdAndStatus(unitId, LeaseStatus.ACTIVE)).thenReturn(List.of(lease, lease(unitId, 1500)));
        when(financeFacade.hasOtherBills(memberId, "2026-08", BillType.RENT)).thenReturn(false);
        UnitBookingTbl booking = new UnitBookingTbl();
        booking.setTokenAmount(BigDecimal.valueOf(2000));
        when(unitBookingRepository.findByStatusAndConvertedLeaseId(UnitBookingStatus.CONVERTED.name(), lease.getId()))
                .thenReturn(Optional.of(booking));

        rentGenerationService.generate(new GenerateBillRequest(lease.getId(), "2026-08", LocalDate.now()));

        BillDraft draft = generatedDraft();
        assertThat(draft.shareCount()).isEqualTo(2);
        assertThat(draft.lines()).containsExactly(
                new BillDraft.Line("Rent", BigDecimal.valueOf(1500)),
                new BillDraft.Line("Token amount adjustment from unit booking", BigDecimal.valueOf(-2000)));
    }

    @Test
    @DisplayName("A batch for one block bills only that block, and reports failures against the lease")
    void batchBillsOneBlockAndReportsFailures() {
        UUID blockA = UUID.randomUUID();
        UUID unitInA = UUID.randomUUID();
        UUID unitInB = UUID.randomUUID();
        when(unitFacade.getUnitsByPropertyId(propertyId)).thenReturn(List.of(
                new UnitSummaryDTO(unitInA, propertyId, "Palm Court", blockA, "A", "101", 1, 1, 0, 0, 1, 1, null, null),
                new UnitSummaryDTO(unitInB, propertyId, "Palm Court", UUID.randomUUID(), "B", "201", 2, 1, 0, 0, 1, 1, null, null)));
        LeaseTbl inA = lease(unitInA, 1000);
        LeaseTbl alsoInA = lease(unitInA, 1000);
        LeaseTbl inB = lease(unitInB, 1000);
        payerFor(inA);
        payerFor(alsoInA);
        payerFor(inB);
        when(leaseQueryService.findActiveLeasesByProperty(propertyId)).thenReturn(List.of(inA, alsoInA, inB));
        BillDTOs.BillResponse bill = new BillDTOs.BillResponse(UUID.randomUUID(), null, "Tenant", "101", "2026-08",
                BigDecimal.valueOf(500), null, BillStatus.PENDING, null, null, null, List.of());
        when(financeFacade.generateBills(anyList())).thenReturn(List.of(
                new BillDraft.Outcome(bill, null),
                new BillDraft.Outcome(null, "Cannot regenerate a paid bill for unit 101")));

        BatchGenerateResult result = rentGenerationService.batchGenerate(
                new BatchGenerateBillRequest(propertyId, blockA, "2026-08", LocalDate.now()));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<BillDraft>> drafts = ArgumentCaptor.forClass(List.class);
        verify(financeFacade).generateBills(drafts.capture());
        assertThat(drafts.getValue()).hasSize(2);
        assertThat(drafts.getValue()).allMatch(d -> d.shareCount() == 2);
        assertThat(result.succeeded()).containsExactly(bill);
        assertThat(result.failed()).singleElement().satisfies(failure -> {
            assertThat(failure.leaseId()).isEqualTo(alsoInA.getId());
            assertThat(failure.unitNumber()).isEqualTo("101");
        });
    }

    private LeaseTbl lease(UUID unit, int rent) {
        LeaseTbl lease = new LeaseTbl();
        lease.setId(UUID.randomUUID());
        lease.setUnitId(unit);
        lease.setStatus(LeaseStatus.ACTIVE);
        lease.setMonthlyRentAmount(BigDecimal.valueOf(rent));
        return lease;
    }

    private UUID payerFor(LeaseTbl lease) {
        UUID memberId = UUID.randomUUID();
        when(unitMemberFacade.getResidentByLeaseId(lease.getId())).thenReturn(Optional.of(
                new UnitResidentDTO(memberId, UUID.randomUUID(), UnitMemberRole.TENANT, lease.getId(), lease.getUnitId(), "101", 1, propertyId)));
        return memberId;
    }

    private BillDraft generatedDraft() {
        ArgumentCaptor<BillDraft> captor = ArgumentCaptor.forClass(BillDraft.class);
        verify(financeFacade).generateBill(captor.capture());
        return captor.getValue();
    }
}
