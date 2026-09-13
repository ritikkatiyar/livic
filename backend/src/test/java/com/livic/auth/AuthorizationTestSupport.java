package com.livic.auth;

import com.livic.auth.service.impl.AuthorizationServiceImpl;
import com.livic.auth.service.impl.ResourceScopeRegistry;
import com.livic.auth.service.interfaces.MembershipCrudService;
import com.livic.finance.facade.FinanceFacade;
import com.livic.finance.security.FinanceResourceScopeResolver;
import com.livic.inventory.facade.InventoryFacade;
import com.livic.inventory.security.InventoryResourceScopeResolver;
import com.livic.property.facade.UnitFacade;
import com.livic.property.security.PropertyResourceScopeResolver;
import com.livic.storage.facade.StorageFacade;
import com.livic.storage.security.StorageResourceScopeResolver;

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
