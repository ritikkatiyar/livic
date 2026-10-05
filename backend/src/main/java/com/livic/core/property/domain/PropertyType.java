package com.livic.core.property.domain;

public enum PropertyType {
    /** A landlord rents rooms or flats to tenants. */
    RENTAL,
    /** One building where each flat has its own owner; owners live there or rent out. */
    RESIDENTIAL,
    HOSTEL,
    /** Many towers, run by a committee or manager. */
    SOCIETY,
    MESS,
    INDIVIDUAL;

    /** The product the apps run this property from: owner-run buildings are residential, the rest let rooms or flats. */
    public String appMode() {
        return this == RESIDENTIAL || this == SOCIETY ? "RESIDENTIAL" : "RENTAL";
    }
}
