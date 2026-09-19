package com.livic.verticals.marketplace.listener;

import com.livic.platform.common.domain.LeadStatus;
import com.livic.platform.common.domain.LeadType;
import com.livic.verticals.marketplace.domain.MarketplaceLeadTbl;
import com.livic.verticals.marketplace.repository.MarketplaceLeadRepository;
import com.livic.platform.payment.event.PaymentCompletedEvent;
import com.livic.core.finance.dto.UnitBookingDTOs;
import com.livic.core.finance.facade.FinanceFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class MarketplacePaymentEventListener {

    private final MarketplaceLeadRepository leadRepository;
    private final FinanceFacade financeFacade;

    @EventListener
    @Transactional
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        if (!"MARKETPLACE_LEAD".equalsIgnoreCase(event.getReferenceType())) {
            return;
        }

        log.info("[OBSERVER: MARKETPLACE] Processing PaymentCompletedEvent for Marketplace Lead: {}", event);

        MarketplaceLeadTbl lead = leadRepository.findById(event.getReferenceId()).orElse(null);
        if (lead == null) {
            log.warn("[OBSERVER: MARKETPLACE] Marketplace Lead not found for ID: {}", event.getReferenceId());
            return;
        }

        lead.setStatus(LeadStatus.CONFIRMED);

        if (lead.getLeadType() == LeadType.BOOKING && lead.getConvertedUnitBookingId() == null) {
            LocalDate moveInDate = lead.getExpectedMoveInDate() != null
                    ? lead.getExpectedMoveInDate()
                    : LocalDate.now().plusDays(7);

            UnitBookingDTOs.UnitBookingResponse booking = financeFacade.createPaidBooking(new UnitBookingDTOs.PaidBookingRequest(
                    lead.getUnitId(),
                    lead.getProspectName(),
                    lead.getProspectPhone(),
                    lead.getProspectEmail(),
                    event.getAmount(),
                    moveInDate,
                    event.getTransactionId()
            ));

            lead.setConvertedUnitBookingId(booking.id());
            lead.setStatus(LeadStatus.CONVERTED);

            log.info("[OBSERVER: MARKETPLACE] Spawning unit_booking_tbl entry: id={} for Marketplace Lead: {}",
                    booking.id(), lead.getId());
        }

        leadRepository.save(lead);
        log.info("[OBSERVER: MARKETPLACE] Successfully confirmed and converted Marketplace Lead: {}", lead.getId());
    }
}
