package com.livic.core.finance.spi;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

/**
 * The rent a person is currently on the hook for, declared by core and implemented by the
 * rental vertical.
 *
 * <p>Core must not read a lease: an owner has none, and leases belong to rental. But
 * {@code /me/context} still reports the tenant's rent to the resident app, so core asks for a
 * flat summary through this port rather than reaching for {@code LeaseTbl}. Returns empty for
 * anyone who is not a tenant.
 */
public interface ActiveTenancyProvider {

    Optional<ActiveTenancy> findActiveTenancy(UUID userId);

    record ActiveTenancy(
            UUID leaseId,
            UUID propertyId,
            String propertyName,
            UUID unitId,
            String unitNumber,
            BigDecimal rentAmount,
            String status
    ) {
    }
}
