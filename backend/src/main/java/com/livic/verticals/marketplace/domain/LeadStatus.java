package com.livic.verticals.marketplace.domain;

public enum LeadStatus {
    /** Just created. For tour requests this means pending landlord approval. */
    NEW,
    CONFIRMED,
    CONVERTED,
    CANCELLED,
    REFUNDED,
    /** Tour request approved by the landlord. */
    APPROVED,
    /** Tour request rejected by the landlord. */
    REJECTED,
    /** Approved tour whose visit time has passed. */
    COMPLETED,
    /** Pending tour whose visit time passed without a decision. */
    EXPIRED
}
