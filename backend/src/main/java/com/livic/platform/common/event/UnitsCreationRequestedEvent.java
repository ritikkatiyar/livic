package com.livic.platform.common.event;

import org.springframework.context.ApplicationEvent;
import java.util.UUID;

/**
 * Published synchronously before new units are saved, so listeners (e.g. plan limits) can veto by throwing.
 */
public class UnitsCreationRequestedEvent extends ApplicationEvent {
    private final UUID propertyId;
    private final int additionalUnits;

    public UnitsCreationRequestedEvent(Object source, UUID propertyId, int additionalUnits) {
        super(source);
        this.propertyId = propertyId;
        this.additionalUnits = additionalUnits;
    }

    public UUID getPropertyId() {
        return propertyId;
    }

    public int getAdditionalUnits() {
        return additionalUnits;
    }
}
