package com.livic.platform.common.enums;

public enum ResourceType {
    PROPERTY,
    UNIT,
    LEASE,
    BILL,
    CHARGE_CONFIG,
    INVENTORY_ITEM,
    INVENTORY_ASSIGNMENT,
    MEDIA_ASSET;

    public static ResourceType forOwnerModule(OwnerModule ownerModule) {
        return switch (ownerModule) {
            case PROPERTY -> PROPERTY;
            case LEASE -> LEASE;
            case INVENTORY -> INVENTORY_ITEM;
        };
    }
}
