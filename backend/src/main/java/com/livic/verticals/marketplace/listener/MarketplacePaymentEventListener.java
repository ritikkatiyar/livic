package com.livic.verticals.marketplace.listener;

import com.livic.platform.outbox.spi.OutboxConsumer;
import com.livic.verticals.marketplace.domain.LeadStatus;
import com.livic.verticals.marketplace.domain.LeadType;
import com.livic.verticals.marketplace.domain.MarketplaceLeadTbl;
import com.livic.verticals.marketplace.repository.MarketplaceLeadRepository;
import com.livic.platform.payment.event.PaymentCompletedEvent;
import com.livic.core.property.spi.PaidUnitBooking;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
/** Confirms a lead, and books its unit, once its token payment is committed. */
public class MarketplacePaymentEventListener implements OutboxConsumer<PaymentCompletedEvent> {

    private final MarketplaceLeadRepository leadRepository;
    // Booking a unit is rental's; the marketplace reaches it through core, never directly.
    private final PaidUnitBooking paidUnitBooking;

    /** What marketplace calls a lead's token payment; payment hands it back untouched. */
    public static final String REFERENCE_TYPE = "MARKETPLACE_LEAD";

    @Override
    public String name() {
        return "marketplace.lead-payment";
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
        if (!REFERENCE_TYPE.equalsIgnoreCase(event.referenceType())) {
            return;
        }

        log.info("[OBSERVER: MARKETPLACE] Processing PaymentCompletedEvent for Marketplace Lead: {}", event);

        MarketplaceLeadTbl lead = leadRepository.findById(event.referenceId()).orElse(null);
        if (lead == null) {
            log.warn("[OBSERVER: MARKETPLACE] Marketplace Lead not found for ID: {}", event.referenceId());
            return;
        }

        lead.setStatus(LeadStatus.CONFIRMED);

        if (lead.getLeadType() == LeadType.BOOKING && lead.getConvertedUnitBookingId() == null) {
            LocalDate moveInDate = lead.getExpectedMoveInDate() != null
                    ? lead.getExpectedMoveInDate()
                    : LocalDate.now().plusDays(7);

            UUID bookingId = paidUnitBooking.bookPaidUnit(new PaidUnitBooking.Request(
                    lead.getUnitId(),
                    lead.getProspectName(),
                    lead.getProspectPhone(),
                    lead.getProspectEmail(),
                    event.amount(),
                    moveInDate,
                    event.transactionId()
            ));

            lead.setConvertedUnitBookingId(bookingId);
            lead.setStatus(LeadStatus.CONVERTED);

            log.info("[OBSERVER: MARKETPLACE] Spawning unit_booking_tbl entry: id={} for Marketplace Lead: {}",
                    bookingId, lead.getId());
        }

        leadRepository.save(lead);
        log.info("[OBSERVER: MARKETPLACE] Successfully confirmed and converted Marketplace Lead: {}", lead.getId());
    }
}
