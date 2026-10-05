package com.livic.core.finance.security;

import com.livic.platform.auth.spi.ResourceType;

import java.util.Set;

/** The resources the finance module authorizes. A bill's payer holds BILL_VIEW_OWN on it. */
public final class FinanceResources {

    public static final ResourceType BILL = new ResourceType("BILL",
            Set.of(FinancePermissions.BILL_VIEW, "BILL_VIEW_OWN"), Set.of(FinancePermissions.BILL_MANAGE));
    public static final ResourceType CHARGE_CONFIG = new ResourceType("CHARGE_CONFIG",
            Set.of(FinancePermissions.CHARGE_CONFIG_VIEW), Set.of(FinancePermissions.CHARGE_CONFIG_MANAGE));

    private FinanceResources() {
    }
}
