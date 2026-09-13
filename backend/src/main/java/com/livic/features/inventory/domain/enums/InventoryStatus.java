package com.livic.features.inventory.domain.enums;

public enum InventoryStatus {
    AVAILABLE("Available"),
    ASSIGNED("Assigned"),
    SHARED("Shared"),
    SERVICE_DUE("Service Due"),
    RETIRED("Retired");

    private final String label;

    InventoryStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static InventoryStatus fromString(String value) {
        if (value == null) return null;
        for (InventoryStatus s : values()) {
            if (s.name().equalsIgnoreCase(value) || s.label.equalsIgnoreCase(value)) {
                return s;
            }
        }
        return null;
    }
}
