package com.livic.verticals.rental.lease.security;

import com.livic.platform.auth.spi.ResourceType;

import java.util.Set;

/** The resources the lease module authorizes. A lease's tenant holds LEASE_VIEW_OWN on it. */
public final class LeaseResources {

    public static final ResourceType LEASE = new ResourceType("LEASE",
            Set.of(LeasePermissions.LEASE_VIEW, "LEASE_VIEW_OWN"), Set.of(LeasePermissions.LEASE_UPDATE));

    private LeaseResources() {
    }
}
