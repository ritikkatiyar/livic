package com.livic.common.subscription;

public enum FeatureKey {
    // ── Hard Cap (numeric limits) ──
    MAX_PROPERTIES,            // A1: Max properties per account
    MAX_UNITS,                 // A3: Max total units across all properties
    MAX_TEAM_MEMBERS,          // C1: Max team members per property

    // ── Metered (per-period usage) ──
    AI_CREDITS_MONTHLY,        // E1/E3/E4: Monthly AI credit allocation

    // ── Boolean Toggles (on = included, off = disabled) ──
    COMMAND_CENTER_3D,         // A5: 3D building model view
    CUSTOM_CHARGE_TYPES,       // B4: Custom charge type creation
    BATCH_RENT_GENERATION,     // B6: Property-wide batch billing
    BILLING_WORKSHEET,         // B10: Advanced billing worksheet
    FINANCIAL_LEDGER,          // B11: Full financial ledger
    PREMIUM_EXPENSE_SPLIT,     // B13: Custom ratio splits
    INVOICE_PDF,               // B18: Downloadable PDF invoices
    CUSTOM_ROLES,              // C4: Custom role creation
    FINE_GRAINED_PERMISSIONS,  // C5: Individual permission editing
    TARGETED_ANNOUNCEMENTS,    // D4: Granular announcement targeting
    ADVANCED_ANALYTICS,        // G1: Full landlord analytics dashboard
    ADVANCED_REPORTS           // G3: Exportable reports
}
