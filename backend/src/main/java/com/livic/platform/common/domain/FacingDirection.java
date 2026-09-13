package com.livic.platform.common.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum FacingDirection {
    NORTH("North"),
    SOUTH("South"),
    EAST("East"),
    WEST("West"),
    UNKNOWN("Unknown");

    private final String displayName;

    FacingDirection(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static FacingDirection fromValue(String value) {
        for (FacingDirection direction : values()) {
            if (direction.displayName.equalsIgnoreCase(value) || direction.name().equalsIgnoreCase(value)) {
                return direction;
            }
        }
        throw new IllegalArgumentException("Invalid FacingDirection: " + value);
    }
}
