package com.livic.platform.auth;

import com.livic.platform.auth.service.impl.AuthorizationServiceImpl;
import com.livic.platform.auth.service.impl.ResourceScopeRegistry;
import com.livic.platform.auth.service.interfaces.MembershipCrudService;
import com.livic.core.finance.facade.FinanceFacade;
import com.livic.core.finance.security.FinanceResourceScopeResolver;
import com.livic.verticals.rental.inventory.facade.InventoryFacade;
import com.livic.verticals.rental.inventory.security.InventoryResourceScopeResolver;
import com.livic.core.property.facade.UnitFacade;
import com.livic.core.property.security.PropertyResourceScopeResolver;
import com.livic.platform.storage.facade.StorageFacade;
import com.livic.platform.storage.security.StorageResourceScopeResolver;

import java.util.List;

import static org.mockito.Mockito.mock;

/**
 * Builds an {@link AuthorizationServiceImpl} wired with the real module resolvers over the given facades.
 * Pass {@code null} for facades a test does not stub; an unstubbed mock is used instead.
 */
public final class AuthorizationTestSupport {

    private AuthorizationTestSupport() {
    }

    public static AuthorizationServiceImpl authorizationService(MembershipCrudService membershipCrudService,
                                                                UnitFacade unitFacade,
                                                                FinanceFacade financeFacade,
                                                                InventoryFacade inventoryFacade,
                                                                StorageFacade storageFacade) {
        return new AuthorizationServiceImpl(membershipCrudService, resourceScopeRegistry(
                unitFacade, financeFacade, inventoryFacade, storageFacade));
    }

    public static ResourceScopeRegistry resourceScopeRegistry(UnitFacade unitFacade,
                                                              FinanceFacade financeFacade,
                                                              InventoryFacade inventoryFacade,
                                                              StorageFacade storageFacade) {
        return new ResourceScopeRegistry(List.of(
                new PropertyResourceScopeResolver(orMock(unitFacade, UnitFacade.class)),
                new FinanceResourceScopeResolver(orMock(financeFacade, FinanceFacade.class)),
                new InventoryResourceScopeResolver(orMock(inventoryFacade, InventoryFacade.class)),
                new StorageResourceScopeResolver(orMock(storageFacade, StorageFacade.class))));
    }

    private static <T> T orMock(T instance, Class<T> type) {
        return instance != null ? instance : mock(type);
    }
}
