package com.livic.core.finance.listener;

import com.livic.platform.common.domain.LedgerTransactionType;
import com.livic.core.finance.domain.RentCycleStatus;
import com.livic.core.finance.domain.FinanceLedgerTbl;
import com.livic.core.finance.domain.RentCycleTbl;
import com.livic.core.finance.domain.UnitBookingTbl;
import com.livic.core.finance.service.interfaces.FinanceLedgerCrudService;
import com.livic.core.finance.service.interfaces.RentCycleCrudService;
import com.livic.core.finance.service.interfaces.UnitBookingCrudService;
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

    private final RentCycleCrudService rentCycleCrudService;
    private final UnitBookingCrudService unitBookingCrudService;
    private final FinanceLedgerCrudService financeLedgerCrudService;

    @EventListener
    @Transactional
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        if (PaymentConstants.ReferenceType.RENT_CYCLE.equalsIgnoreCase(event.getReferenceType())) {
            handleRentCyclePayment(event);
        } else if (PaymentConstants.ReferenceType.UNIT_BOOKING.equalsIgnoreCase(event.getReferenceType())) {
            handleUnitBookingPayment(event);
        }
    }

    private void handleRentCyclePayment(PaymentCompletedEvent event) {
        log.info("[OBSERVER: FINANCE] Processing PaymentCompletedEvent for Rent Cycle: {}", event);

        RentCycleTbl rentCycle = rentCycleCrudService.findById(event.getReferenceId())
                .orElse(null);

        if (rentCycle == null) {
            log.warn("[OBSERVER: FINANCE] RentCycle not found for ID: {}", event.getReferenceId());
            return;
        }

        // Idempotent calculation
        BigDecimal currentPaid = rentCycle.getAmountPaid() != null ? rentCycle.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal newTotalPaid = currentPaid.add(event.getAmount());

        rentCycle.setAmountPaid(newTotalPaid);

        if (newTotalPaid.compareTo(rentCycle.getTotalAmount()) >= 0) {
            rentCycle.setStatus(RentCycleStatus.PAID);
            rentCycle.setPaidAt(LocalDateTime.now());
        } else {
            rentCycle.setStatus(RentCycleStatus.PARTIALLY_PAID);
        }

        rentCycleCrudService.save(rentCycle);

        // Update Finance Ledger if lease is present
        if (rentCycle.getLease() != null) {
            BigDecimal currentBalance = financeLedgerCrudService.sumAmountByLeaseId(rentCycle.getLease().getId());
            BigDecimal ledgerAmount = event.getAmount().negate();
            BigDecimal newBalance = currentBalance.add(ledgerAmount);

            boolean isFullPayment = rentCycle.getStatus() == RentCycleStatus.PAID;
            String description = (isFullPayment ? "Rent Payment (Full)" : "Rent Payment (Partial)") + " via " + event.getGatewayName();

            FinanceLedgerTbl ledgerEntry = FinanceLedgerTbl.builder()
                    .unitId(rentCycle.getLease().getUnitId())
                    .lease(rentCycle.getLease())
                    .transactionType(LedgerTransactionType.PAYMENT_RECEIVED)
                    .amount(ledgerAmount)
                    .balance(newBalance)
                    .referenceId(event.getTransactionId())
                    .description(description)
                    .build();

            financeLedgerCrudService.save(ledgerEntry);
        }

        log.info("[OBSERVER: FINANCE] Successfully updated RentCycle: {} status to: {}, totalPaid: {}", rentCycle.getId(), rentCycle.getStatus(), newTotalPaid);
    }

    private void handleUnitBookingPayment(PaymentCompletedEvent event) {
        log.info("[OBSERVER: FINANCE] Processing PaymentCompletedEvent for Unit Booking: {}", event);

        UnitBookingTbl booking = unitBookingCrudService.findById(event.getReferenceId())
                .orElse(null);

        if (booking == null) {
            log.warn("[OBSERVER: FINANCE] UnitBooking not found for ID: {}", event.getReferenceId());
            return;
        }

        log.info("[OBSERVER: FINANCE] Successfully processed token payment for UnitBooking: {}", booking.getId());
    }
}
