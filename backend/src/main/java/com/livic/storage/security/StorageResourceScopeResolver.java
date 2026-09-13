package com.livic.storage.security;

import com.livic.auth.spi.ResourceScope;
import com.livic.auth.spi.ResourceScopeResolver;
import com.livic.common.enums.ResourceType;
import com.livic.storage.facade.StorageFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class StorageResourceScopeResolver implements ResourceScopeResolver {

    private final StorageFacade storageFacade;

    @Override
    public Set<ResourceType> supportedTypes() {
        return Set.of(ResourceType.MEDIA_ASSET);
    }

    @Override
    public Optional<ResourceScope> resolve(ResourceType type, UUID resourceId) {
        // Media inherits access from the resource it is attached to; the uploader is recorded as owner.
        // An asset without an owner module yields a null parent, which only its uploader can access.
        return storageFacade.getAssetById(resourceId)
                .map(asset -> new ResourceScope.Delegated(
                        asset.ownerModule() != null ? ResourceType.forOwnerModule(asset.ownerModule()) : null,
                        asset.referenceId(),
                        asset.uploadedByUserId()));
    }
}
