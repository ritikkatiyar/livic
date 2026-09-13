package com.livic.platform.common.event;

import org.springframework.context.ApplicationEvent;
import java.util.UUID;

public class PropertyDeletionEvent extends ApplicationEvent {
    private final UUID propertyId;

    public PropertyDeletionEvent(Object source, UUID propertyId) {
        super(source);
        this.propertyId = propertyId;
    }

    public UUID getPropertyId() {
        return propertyId;
    }
}
