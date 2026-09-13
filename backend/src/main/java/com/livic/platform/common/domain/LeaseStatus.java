package com.livic.platform.common.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum LeaseStatus {
    ACTIVE("Active"),
    ENDED("Ended");

    private final String displayName;

    LeaseStatus(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static LeaseStatus fromValue(String value) {
        for (LeaseStatus status : values()) {
            if (status.displayName.equalsIgnoreCase(value) || status.name().equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Invalid LeaseStatus: " + value);
    }
}
