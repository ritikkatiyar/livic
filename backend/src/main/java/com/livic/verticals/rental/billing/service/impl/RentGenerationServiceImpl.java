package com.livic.verticals.rental.billing.service.impl;

import com.livic.core.finance.domain.BillType;
import com.livic.core.finance.dto.BillDTOs;
import com.livic.core.finance.dto.BillDraft;
import com.livic.core.finance.facade.FinanceFacade;
import com.livic.verticals.rental.booking.facade.BookingFacade;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.UnitFacade;
import com.livic.platform.common.exception.BusinessException;
import com.livic.verticals.rental.billing.dto.RentGenerationDTOs.BatchGenerateBillRequest;
import com.livic.verticals.rental.billing.dto.RentGenerationDTOs.BatchGenerateFailure;
import com.livic.verticals.rental.billing.dto.RentGenerationDTOs.BatchGenerateResult;
import com.livic.verticals.rental.billing.dto.RentGenerationDTOs.GenerateBillRequest;
import com.livic.verticals.rental.billing.service.interfaces.RentGenerationService;
import com.livic.verticals.rental.lease.domain.LeaseStatus;
import com.livic.verticals.rental.lease.domain.LeaseTbl;
import com.livic.verticals.rental.lease.service.interfaces.LeaseQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RentGenerationServiceImpl implements RentGenerationService {

    private final LeaseQueryService leaseQueryService;
    private final UnitFacade unitFacade;
    private final FinanceFacade financeFacade;
    private final BookingFacade bookingFacade;

    @Override
    public BillDTOs.BillResponse generate(GenerateBillRequest request) {
        LeaseTbl lease = leaseQueryService.getLeaseById(request.leaseId());
        int roommates = leaseQueryService.findByUnitIdAndStatus(lease.getUnitId(), LeaseStatus.ACTIVE).size();
        return financeFacade.generateBill(draftFor(lease, request.billingMonth(), request.dueDate(), roommates));
    }

    @Override
    public BatchGenerateResult batchGenerate(BatchGenerateBillRequest request) {
        Map<UUID, UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(request.propertyId()).stream()
                .collect(Collectors.toMap(UnitSummaryDTO::id, Function.identity(), (a, b) -> a));
        List<LeaseTbl> leases = leaseQueryService.findActiveLeasesByProperty(request.propertyId()).stream()
                .filter(lease -> request.blockId() == null || isInBlock(units.get(lease.getUnitId()), request.blockId()))
                .toList();
        Map<UUID, Long> roommatesByUnitId = leases.stream()
                .collect(Collectors.groupingBy(LeaseTbl::getUnitId, Collectors.counting()));

        List<LeaseTbl> drafted = new ArrayList<>();
        List<BillDraft> drafts = new ArrayList<>();
        List<BatchGenerateFailure> failed = new ArrayList<>();
        for (LeaseTbl lease : leases) {
            try {
                drafts.add(draftFor(lease, request.billingMonth(), request.dueDate(),
                        roommatesByUnitId.get(lease.getUnitId()).intValue()));
                drafted.add(lease);
            } catch (BusinessException e) {
                failed.add(new BatchGenerateFailure(lease.getId(), unitNumberOf(units, lease), e.getMessage()));
            }
        }

        List<BillDraft.Outcome> outcomes = financeFacade.generateBills(drafts);
        List<BillDTOs.BillResponse> succeeded = new ArrayList<>();
        for (int i = 0; i < outcomes.size(); i++) {
            BillDraft.Outcome outcome = outcomes.get(i);
            if (outcome.bill() != null) {
                succeeded.add(outcome.bill());
            } else {
                LeaseTbl lease = drafted.get(i);
                failed.add(new BatchGenerateFailure(lease.getId(), unitNumberOf(units, lease), outcome.failure()));
            }
        }
        succeeded.sort(Comparator.comparing(BillDTOs.BillResponse::unitNumber, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(BillDTOs.BillResponse::tenantName, Comparator.nullsLast(Comparator.naturalOrder())));
        return new BatchGenerateResult(succeeded, failed);
    }

    /** What the lease contributes to a rent bill; core adds the property's charges. */
    private BillDraft draftFor(LeaseTbl lease, String billingMonth, LocalDate dueDate, int roommates) {
        List<BillDraft.Line> lines = new ArrayList<>();
        BigDecimal rent = lease.getMonthlyRentAmount();
        if (rent != null && rent.signum() > 0) {
            lines.add(new BillDraft.Line("Rent", rent));
        }
        // The token paid when the unit was booked is credited once, on the tenant's first bill.
        if (!financeFacade.hasOtherBills(lease.getMemberId(), billingMonth, BillType.RENT)) {
            bookingFacade.findConvertedToken(lease.getId()).ifPresent(token -> lines.add(
                    new BillDraft.Line("Token amount adjustment from unit booking", token.negate())));
        }
        return new BillDraft(lease.getMemberId(), null, BillType.RENT, billingMonth, dueDate, lines, Math.max(1, roommates));
    }

    private static boolean isInBlock(UnitSummaryDTO unit, UUID blockId) {
        return unit != null && Objects.equals(unit.blockId(), blockId);
    }

    private static String unitNumberOf(Map<UUID, UnitSummaryDTO> units, LeaseTbl lease) {
        UnitSummaryDTO unit = units.get(lease.getUnitId());
        return unit != null ? unit.unitNumber() : null;
    }
}
