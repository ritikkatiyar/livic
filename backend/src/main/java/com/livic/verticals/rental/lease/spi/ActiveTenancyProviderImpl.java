package com.livic.verticals.rental.lease.spi;

import com.livic.core.finance.spi.ActiveTenancyProvider;
import com.livic.verticals.rental.lease.facade.LeaseFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

/** Answers core's tenancy port from the lease, without exposing the lease itself. */
@Service
@RequiredArgsConstructor
public class ActiveTenancyProviderImpl implements ActiveTenancyProvider {

    private final LeaseFacade leaseFacade;

    @Override
    public Optional<ActiveTenancy> findActiveTenancy(UUID userId) {
        return leaseFacade.getActiveLeaseForUser(userId)
                .map(lease -> new ActiveTenancy(
                        lease.id(),
                        lease.propertyId(),
                        lease.propertyName(),
                        lease.unitId(),
                        lease.unitNumber(),
                        lease.rentAmount(),
                        lease.status()));
    }
}
