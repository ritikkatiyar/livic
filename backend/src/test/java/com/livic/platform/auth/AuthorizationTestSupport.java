package com.livic.platform.auth;

import com.livic.platform.auth.repository.MembershipRepository;
import com.livic.platform.auth.service.impl.AuthorizationServiceImpl;
import com.livic.platform.auth.service.impl.ResourceScopeRegistry;
import com.livic.core.finance.facade.FinanceFacade;
import com.livic.core.finance.security.FinanceResourceScopeResolver;
import com.livic.verticals.rental.lease.facade.LeaseFacade;
import com.livic.verticals.rental.lease.security.LeaseResourceScopeResolver;
import com.livic.verticals.rental.inventory.facade.InventoryFacade;
import com.livic.verticals.rental.inventory.security.InventoryResourceScopeResolver;
import com.livic.core.property.facade.UnitFacade;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.core.property.security.PropertyResourceScopeResolver;

import java.util.List;

import static org.mockito.Mockito.mock;

/**
 * Builds an {@link AuthorizationServiceImpl} wired with the real module resolvers over the given facades.
 * Pass {@code null} for facades a test does not stub; an unstubbed mock is used instead.
 */
public final class AuthorizationTestSupport {

    private AuthorizationTestSupport() {
    }

    public static AuthorizationServiceImpl authorizationService(MembershipRepository membershipRepository,
                                                                UnitFacade unitFacade,
                                                                UnitMemberFacade unitMemberFacade,
                                                                FinanceFacade financeFacade,
                                                                LeaseFacade leaseFacade,
                                                                InventoryFacade inventoryFacade) {
        return new AuthorizationServiceImpl(membershipRepository, resourceScopeRegistry(
                unitFacade, unitMemberFacade, financeFacade, leaseFacade, inventoryFacade));
    }

    public static ResourceScopeRegistry resourceScopeRegistry(UnitFacade unitFacade,
                                                              UnitMemberFacade unitMemberFacade,
                                                              FinanceFacade financeFacade,
                                                              LeaseFacade leaseFacade,
                                                              InventoryFacade inventoryFacade) {
        return new ResourceScopeRegistry(List.of(
                new PropertyResourceScopeResolver(orMock(unitFacade, UnitFacade.class), orMock(unitMemberFacade, UnitMemberFacade.class)),
                new FinanceResourceScopeResolver(orMock(financeFacade, FinanceFacade.class)),
                new LeaseResourceScopeResolver(orMock(leaseFacade, LeaseFacade.class)),
                new InventoryResourceScopeResolver(orMock(inventoryFacade, InventoryFacade.class))));
    }

    private static <T> T orMock(T instance, Class<T> type) {
        return instance != null ? instance : mock(type);
    }
}
