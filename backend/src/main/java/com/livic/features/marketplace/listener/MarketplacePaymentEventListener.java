package com.livic.features.marketplace.listener;

import com.livic.platform.common.domain.LeadStatus;
import com.livic.platform.common.domain.LeadType;
import com.livic.services.finance.domain.UnitBookingTbl;
import com.livic.services.finance.repository.UnitBookingRepository;
import com.livic.features.marketplace.domain.MarketplaceLeadTbl;
import com.livic.features.marketplace.repository.MarketplaceLeadRepository;
import com.livic.platform.payment.event.PaymentCompletedEvent;
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
    private final UnitBookingRepository unitBookingRepository;

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

        if (lead.getLeadType() == LeadType.BOOKING && lead.getConvertedUnitBooking() == null) {
            LocalDate moveInDate = lead.getExpectedMoveInDate() != null 
                    ? lead.getExpectedMoveInDate() 
                    : LocalDate.now().plusDays(7);

            UnitBookingTbl booking = UnitBookingTbl.builder()
                    .unitId(lead.getUnit().getId())
                    .prospectiveTenantName(lead.getProspectName())
                    .prospectiveTenantPhone(lead.getProspectPhone())
                    .prospectiveTenantEmail(lead.getProspectEmail())
                    .tokenAmount(event.getAmount())
                    .expectedMoveInDate(moveInDate)
                    .status("BOOKED")
                    .paymentTransactionId(event.getTransactionId())
                    .build();

            unitBookingRepository.save(booking);
            lead.setConvertedUnitBooking(booking);
            lead.setStatus(LeadStatus.CONVERTED);

            log.info("[OBSERVER: MARKETPLACE] Spawning unit_booking_tbl entry: id={} for Marketplace Lead: {}", 
                    booking.getId(), lead.getId());
        }

        leadRepository.save(lead);
        log.info("[OBSERVER: MARKETPLACE] Successfully confirmed and converted Marketplace Lead: {}", lead.getId());
    }
}
