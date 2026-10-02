package com.livic.core.finance.listener;

import com.livic.core.finance.repository.UnitBookingRepository;
import com.livic.core.finance.repository.BillRepository;
import com.livic.core.finance.domain.LedgerTransactionType;
import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.service.interfaces.LedgerService;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.core.finance.domain.BillTbl;
import com.livic.core.finance.domain.UnitBookingTbl;
import com.livic.platform.payment.constant.PaymentConstants;
import com.livic.platform.payment.event.PaymentCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class FinancePaymentEventListener {

    private final BillRepository billRepository;
    private final UnitBookingRepository unitBookingRepository;
    private final LedgerService ledgerService;
    private final UnitMemberFacade unitMemberFacade;

    @EventListener
    @Transactional
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        if (PaymentConstants.ReferenceType.BILL.equalsIgnoreCase(event.getReferenceType())) {
            handleBillPayment(event);
        } else if (PaymentConstants.ReferenceType.UNIT_BOOKING.equalsIgnoreCase(event.getReferenceType())) {
            handleUnitBookingPayment(event);
        }
    }

    private void handleBillPayment(PaymentCompletedEvent event) {
        log.info("[OBSERVER: FINANCE] Processing PaymentCompletedEvent for Rent Cycle: {}", event);

        BillTbl bill = billRepository.findByIdForUpdate(event.getReferenceId())
                .orElse(null);

        if (bill == null) {
            log.warn("[OBSERVER: FINANCE] Bill not found for ID: {}", event.getReferenceId());
            return;
        }

        // Each payment transaction completes exactly once (its row is locked while it is marked
        // SUCCESS), and the bill is locked above, so adding this payment's amount is safe.
        BigDecimal currentPaid = bill.getAmountPaid() != null ? bill.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal newTotalPaid = currentPaid.add(event.getAmount());

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
                    event.getAmount().negate(), event.getTransactionId(),
                    (isFullPayment ? "Payment (full)" : "Payment (partial)") + " via " + event.getGatewayName());
        }

        log.info("[OBSERVER: FINANCE] Successfully updated Bill: {} status to: {}, totalPaid: {}", bill.getId(), bill.getStatus(), newTotalPaid);
    }

    private void handleUnitBookingPayment(PaymentCompletedEvent event) {
        log.info("[OBSERVER: FINANCE] Processing PaymentCompletedEvent for Unit Booking: {}", event);

        UnitBookingTbl booking = unitBookingRepository.findById(event.getReferenceId())
                .orElse(null);

        if (booking == null) {
            log.warn("[OBSERVER: FINANCE] UnitBooking not found for ID: {}", event.getReferenceId());
            return;
        }

        log.info("[OBSERVER: FINANCE] Successfully processed token payment for UnitBooking: {}", booking.getId());
    }
}
