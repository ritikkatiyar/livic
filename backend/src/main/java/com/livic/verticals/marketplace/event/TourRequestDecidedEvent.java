package com.livic.verticals.marketplace.event;

import java.util.UUID;

/** A landlord approved or declined a tour request. Published inside the deciding transaction. */
public record TourRequestDecidedEvent(UUID leadId) {
}
