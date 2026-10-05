package com.livic.verticals.rental.lease.security;

import com.livic.platform.auth.spi.PermissionCatalogContributor;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/** Permissions on leases and unit bookings. */
@Component
@Order(20)
public class LeasePermissions implements PermissionCatalogContributor {

    public static final String LEASE_VIEW = "LEASE_VIEW";
    public static final String LEASE_CREATE = "LEASE_CREATE";
    public static final String LEASE_UPDATE = "LEASE_UPDATE";

    @Override
    public String module() {
        return "LEASES";
    }

    @Override
    public List<Permission> permissions() {
        return List.of(
                new Permission(LEASE_VIEW, "View Leases", "View all tenant leases on the property"),
                new Permission(LEASE_CREATE, "Create Leases", "Create leases and unit bookings"),
                new Permission(LEASE_UPDATE, "Update Leases", "Update, renew or terminate leases")
        );
    }
}
