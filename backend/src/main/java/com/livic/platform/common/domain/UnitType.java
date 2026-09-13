package com.livic.platform.common.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum UnitType {
    SINGLE_UNIT("Single Unit"),
    SHARED_UNIT("Shared Unit"),
    ONE_BHK("1 BHK"),
    TWO_BHK("2 BHK"),
    STUDIO("Studio Apartment");

    private final String displayName;

    UnitType(String displayName) {
        this.displayName = displayName;
    }

    // Tells Spring/Jackson to output this value in API responses
    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    // Safely handles incoming JSON requests (accepts both "1 BHK" and "ONE_BHK")
    @JsonCreator
    public static UnitType fromValue(String value) {
        for (UnitType type : values()) {
            if (type.displayName.equalsIgnoreCase(value) || type.name().equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Invalid UnitType: " + value);
    }
}
