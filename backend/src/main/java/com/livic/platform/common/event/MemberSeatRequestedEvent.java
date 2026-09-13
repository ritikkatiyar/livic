package com.livic.platform.common.event;

import org.springframework.context.ApplicationEvent;
import java.util.UUID;

/**
 * Published synchronously before a membership becomes active on a property (new member or reactivation),
 * so listeners (e.g. plan limits) can veto by throwing.
 */
public class MemberSeatRequestedEvent extends ApplicationEvent {
    private final UUID propertyId;

    public MemberSeatRequestedEvent(Object source, UUID propertyId) {
        super(source);
        this.propertyId = propertyId;
    }

    public UUID getPropertyId() {
        return propertyId;
    }
}
