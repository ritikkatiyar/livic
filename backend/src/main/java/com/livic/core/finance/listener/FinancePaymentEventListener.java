package com.livic.core.finance.listener;

import com.livic.platform.outbox.spi.OutboxConsumer;
import com.livic.core.finance.repository.BillRepository;
import com.livic.core.finance.domain.LedgerTransactionType;
import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.service.interfaces.LedgerService;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.core.finance.domain.BillTbl;
import com.livic.platform.payment.event.PaymentCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
/** Marks a bill paid, and posts it to the ledger, once its payment is committed. */
public class FinancePaymentEventListener implements OutboxConsumer<PaymentCompletedEvent> {

    private final BillRepository billRepository;
    private final LedgerService ledgerService;
    private final UnitMemberFacade unitMemberFacade;

    /** What finance calls a bill payment; payment hands it back untouched. */
    public static final String REFERENCE_TYPE = "BILL";

    @Override
    public String name() {
        return "finance.bill-payment";
    }

    @Override
    public Class<PaymentCompletedEvent> eventType() {
        return PaymentCompletedEvent.class;
    }

    @Override
    public boolean accepts(PaymentCompletedEvent event) {
        return REFERENCE_TYPE.equalsIgnoreCase(event.referenceType());
    }

    @Override
    public void handle(PaymentCompletedEvent event) {
        if (REFERENCE_TYPE.equalsIgnoreCase(event.referenceType())) {
            handleBillPayment(event);
        }
    }

    private void handleBillPayment(PaymentCompletedEvent event) {
        log.info("[OBSERVER: FINANCE] Processing PaymentCompletedEvent for Rent Cycle: {}", event);

        BillTbl bill = billRepository.findByIdForUpdate(event.referenceId())
                .orElse(null);

        if (bill == null) {
            log.warn("[OBSERVER: FINANCE] Bill not found for ID: {}", event.referenceId());
            return;
        }

        // Each payment transaction completes exactly once (its row is locked while it is marked
        // SUCCESS), and the bill is locked above, so adding this payment's amount is safe.
        BigDecimal currentPaid = bill.getAmountPaid() != null ? bill.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal newTotalPaid = currentPaid.add(event.amount());

        bill.setAmountPaid(newTotalPaid);

        if (newTotalPaid.compareTo(bill.getTotalAmount()) >= 0) {
            bill.setStatus(BillStatus.PAID);
            bill.setPaidAt(LocalDateTime.now());
        } else {
            bill.setStatus(BillStatus.PARTIALLY_PAID);
        }

        billRepository.save(bill);

        // The ledger follows the payer, so it works for owners with no lease too.
        UnitResidentDTO payer = bill.getMemberId() == null ? null
                : unitMemberFacade.getResidentByMemberId(bill.getMemberId()).orElse(null);
        if (payer != null) {
            boolean isFullPayment = bill.getStatus() == BillStatus.PAID;
            ledgerService.post(bill.getMemberId(), payer.unitId(), LedgerTransactionType.PAYMENT_RECEIVED,
                    event.amount().negate(), event.transactionId(),
                    (isFullPayment ? "Payment (full)" : "Payment (partial)") + " via " + event.gatewayName());
        }

        log.info("[OBSERVER: FINANCE] Successfully updated Bill: {} status to: {}, totalPaid: {}", bill.getId(), bill.getStatus(), newTotalPaid);
    }
}
