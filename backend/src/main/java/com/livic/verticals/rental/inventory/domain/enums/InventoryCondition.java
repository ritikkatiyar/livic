package com.livic.verticals.rental.inventory.domain.enums;

public enum InventoryCondition {
    EXCELLENT("Excellent"),
    GOOD("Good"),
    FAIR("Fair"),
    DAMAGED("Damaged");

    private final String label;

    InventoryCondition(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static InventoryCondition fromString(String value) {
        if (value == null) return null;
        for (InventoryCondition c : values()) {
            if (c.name().equalsIgnoreCase(value) || c.label.equalsIgnoreCase(value)) {
                return c;
            }
        }
        return null;
    }
}
