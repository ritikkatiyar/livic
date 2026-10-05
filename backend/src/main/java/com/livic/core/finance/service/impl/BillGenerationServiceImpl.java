package com.livic.core.finance.service.impl;

import com.livic.core.finance.domain.BillLineTbl;
import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.domain.BillTbl;
import com.livic.core.finance.domain.ChargeConfigTbl;
import com.livic.core.finance.domain.LedgerTransactionType;
import com.livic.core.finance.dto.BillDTOs;
import com.livic.core.finance.dto.BillDraft;
import com.livic.core.finance.repository.BillLineRepository;
import com.livic.core.finance.repository.BillRepository;
import com.livic.core.finance.repository.ChargeConfigRepository;
import com.livic.core.finance.service.interfaces.BillGenerationService;
import com.livic.core.finance.service.interfaces.BillService;
import com.livic.core.finance.service.interfaces.BillingWorksheetService;
import com.livic.core.finance.service.interfaces.LedgerService;
import com.livic.core.finance.strategy.CalculationResult;
import com.livic.core.finance.strategy.ChargeCalculationService;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.platform.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillGenerationServiceImpl implements BillGenerationService {

    private final BillRepository billRepository;
    private final BillLineRepository billLineRepository;
    private final ChargeConfigRepository chargeConfigRepository;
    private final ChargeCalculationService chargeCalculationService;
    private final BillingWorksheetService worksheetService;
    private final LedgerService ledgerService;
    private final BillService billService;
    private final UnitMemberFacade unitMemberFacade;
    private final PlatformTransactionManager transactionManager;

    @Override
    @Transactional
    public BillDTOs.BillResponse generate(BillDraft draft) {
        UnitResidentDTO payer = unitMemberFacade.getResidentByMemberId(draft.payerMemberId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "There is no unit member to bill"));
        worksheetService.prepareMonth(payer.propertyId(), draft.billingMonth(), null);
        BillTbl bill = write(draft, payer, chargeConfigRepository.findAllByPropertyIdAndIsActiveTrue(payer.propertyId()));
        return billService.getById(bill.getId());
    }

    @Override
    public List<BillDraft.Outcome> generateAll(List<BillDraft> drafts) {
        Map<UUID, UnitResidentDTO> payers = unitMemberFacade.getResidentsByMemberIds(drafts.stream()
                        .map(BillDraft::payerMemberId)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(UnitResidentDTO::memberId, Function.identity(), (a, b) -> a));

        // Charges and the worksheet are prepared once per property and month, not once per bill.
        Map<UUID, List<ChargeConfigTbl>> chargesByProperty = new HashMap<>();
        Set<String> preparedMonths = new HashSet<>();
        TransactionTemplate ownTransaction = new TransactionTemplate(transactionManager);
        ownTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        List<BillTbl> bills = new ArrayList<>();
        List<String> failures = new ArrayList<>();
        for (BillDraft draft : drafts) {
            UnitResidentDTO payer = payers.get(draft.payerMemberId());
            if (payer == null) {
                bills.add(null);
                failures.add("There is no unit member to bill");
                continue;
            }
            try {
                if (preparedMonths.add(payer.propertyId() + "|" + draft.billingMonth())) {
                    ownTransaction.executeWithoutResult(status ->
                            worksheetService.prepareMonth(payer.propertyId(), draft.billingMonth(), null));
                }
                List<ChargeConfigTbl> charges = chargesByProperty.computeIfAbsent(
                        payer.propertyId(), chargeConfigRepository::findAllByPropertyIdAndIsActiveTrue);
                bills.add(ownTransaction.execute(status -> write(draft, payer, charges)));
                failures.add(null);
            } catch (Exception e) {
                log.error("bill_generation_failed memberId={} unit={} billingMonth={}",
                        payer.memberId(), payer.unitNumber(), draft.billingMonth(), e);
                bills.add(null);
                failures.add(e.getMessage());
            }
        }

        // One batched read for every generated bill, rather than a lookup per bill.
        Map<UUID, BillDTOs.BillResponse> responses = billService.toResponses(bills.stream().filter(Objects::nonNull).toList())
                .stream()
                .collect(Collectors.toMap(BillDTOs.BillResponse::id, Function.identity()));
        List<BillDraft.Outcome> outcomes = new ArrayList<>(drafts.size());
        for (int i = 0; i < drafts.size(); i++) {
            BillTbl bill = bills.get(i);
            outcomes.add(new BillDraft.Outcome(bill != null ? responses.get(bill.getId()) : null, failures.get(i)));
        }
        return outcomes;
    }

    /** Writes or rewrites one bill: the draft's lines, then the property's charges for the payer's unit. */
    private BillTbl write(BillDraft draft, UnitResidentDTO payer, List<ChargeConfigTbl> charges) {
        Optional<BillTbl> existing = billRepository.findByMemberIdAndBillingMonthAndBillType(
                payer.memberId(), draft.billingMonth(), draft.billType());
        BigDecimal previousTotal = BigDecimal.ZERO;
        BillTbl bill;
        if (existing.isPresent()) {
            bill = existing.get();
            if (bill.getStatus() == BillStatus.PAID) {
                throw new BusinessException(HttpStatus.CONFLICT, "Cannot regenerate a paid bill for unit " + payer.unitNumber());
            }
            previousTotal = bill.getTotalAmount();
            billLineRepository.deleteAll(billLineRepository.findByBill_Id(bill.getId()));
        } else {
            bill = billRepository.save(BillTbl.builder()
                    .propertyId(payer.propertyId())
                    .memberId(payer.memberId())
                    .issuedByMemberId(draft.issuedByMemberId())
                    .billType(draft.billType())
                    .billingMonth(draft.billingMonth())
                    .dueDate(draft.dueDate())
                    .totalAmount(BigDecimal.ZERO)
                    .status(BillStatus.PENDING)
                    .build());
        }

        List<BillLineTbl> lines = new ArrayList<>();
        for (BillDraft.Line line : draft.lines()) {
            lines.add(BillLineTbl.builder().bill(bill).amount(line.amount()).description(line.description()).build());
        }
        int shareCount = Math.max(1, draft.shareCount());
        for (ChargeConfigTbl charge : charges) {
            CalculationResult result = chargeCalculationService.executeChargePipeline(charge, payer.unitId(), draft.billingMonth(), false);
            BigDecimal amount = result.amount();
            if (amount.signum() == 0) {
                continue;
            }
            // A unit's charges are shared by the people who pay for it, such as roommates.
            if (shareCount > 1) {
                amount = amount.divide(BigDecimal.valueOf(shareCount), 2, RoundingMode.HALF_UP);
            }
            String description = result.descriptionDetail() != null
                    ? charge.getChargeName() + " (" + result.descriptionDetail() + ")"
                    : charge.getChargeName();
            lines.add(BillLineTbl.builder().bill(bill).customChargeConfig(charge).amount(amount).description(description).build());
        }
        billLineRepository.saveAll(lines);

        // Amounts are signed, so a discount or credit simply lowers the sum.
        BigDecimal total = lines.stream().map(BillLineTbl::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        bill.setTotalAmount(total);
        bill = billRepository.save(bill);

        BigDecimal delta = total.subtract(previousTotal);
        if (delta.signum() != 0) {
            ledgerService.post(payer.memberId(), payer.unitId(),
                    existing.isPresent() ? LedgerTransactionType.ADJUSTMENT : LedgerTransactionType.INVOICE_GENERATED,
                    delta, bill.getId(),
                    "Invoice " + (existing.isPresent() ? "Regeneration" : "Generation") + " for " + draft.billingMonth());
        }

        log.info("bill_generated billId={} memberId={} billType={} billingMonth={} totalAmount={}",
                bill.getId(), payer.memberId(), draft.billType(), draft.billingMonth(), total);
        return bill;
    }
}
