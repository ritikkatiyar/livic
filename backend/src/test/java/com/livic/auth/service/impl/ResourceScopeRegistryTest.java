package com.livic.auth.service.impl;

import com.livic.auth.spi.ResourceScope;
import com.livic.auth.spi.ResourceScopeResolver;
import com.livic.common.enums.ResourceType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.BiFunction;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ResourceScopeRegistryTest {

    private static Set<ResourceType> allExceptProperty() {
        Set<ResourceType> types = EnumSet.allOf(ResourceType.class);
        types.remove(ResourceType.PROPERTY);
        return types;
    }

    private static ResourceScopeResolver resolver(Set<ResourceType> types,
                                                  BiFunction<ResourceType, UUID, Optional<ResourceScope>> fn) {
        return new ResourceScopeResolver() {
            @Override
            public Set<ResourceType> supportedTypes() {
                return types;
            }

            @Override
            public Optional<ResourceScope> resolve(ResourceType type, UUID resourceId) {
                return fn.apply(type, resourceId);
            }
        };
    }

    @Test
    @DisplayName("Startup fails when a resource type has no resolver")
    void failsWhenTypeMissing() {
        Set<ResourceType> types = allExceptProperty();
        types.remove(ResourceType.MEDIA_ASSET);

        assertThatThrownBy(() -> new ResourceScopeRegistry(List.of(resolver(types, (t, id) -> Optional.empty()))))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("MEDIA_ASSET");
    }

    @Test
    @DisplayName("Startup fails when two resolvers claim the same resource type")
    void failsOnDuplicateResolver() {
        assertThatThrownBy(() -> new ResourceScopeRegistry(List.of(
                resolver(allExceptProperty(), (t, id) -> Optional.empty()),
                resolver(Set.of(ResourceType.LEASE), (t, id) -> Optional.empty()))))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Duplicate")
                .hasMessageContaining("LEASE");
    }

    @Test
    @DisplayName("Startup fails when a module resolver claims PROPERTY")
    void failsWhenPropertyClaimed() {
        assertThatThrownBy(() -> new ResourceScopeRegistry(List.of(
                resolver(EnumSet.allOf(ResourceType.class), (t, id) -> Optional.empty()))))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("PROPERTY");
    }

    @Test
    @DisplayName("PROPERTY resolves to its own id without any module resolver")
    void propertyResolvesToItself() {
        ResourceScopeRegistry registry = new ResourceScopeRegistry(List.of(
                resolver(allExceptProperty(), (t, id) -> Optional.empty())));
        UUID propertyId = UUID.randomUUID();

        assertThat(registry.resolvePropertyId(ResourceType.PROPERTY, propertyId)).contains(propertyId);
    }

    @Test
    @DisplayName("Delegated scopes are followed to the owning property")
    void delegationChainResolvesToProperty() {
        UUID propertyId = UUID.randomUUID();
        UUID leaseId = UUID.randomUUID();
        UUID assignmentId = UUID.randomUUID();
        UUID mediaId = UUID.randomUUID();
        Map<UUID, ResourceScope> scopes = Map.of(
                mediaId, new ResourceScope.Delegated(ResourceType.INVENTORY_ASSIGNMENT, assignmentId, null),
                assignmentId, new ResourceScope.Delegated(ResourceType.LEASE, leaseId, null),
                leaseId, new ResourceScope.Property(propertyId, null));
        ResourceScopeRegistry registry = new ResourceScopeRegistry(List.of(
                resolver(allExceptProperty(), (t, id) -> Optional.ofNullable(scopes.get(id)))));

        assertThat(registry.resolvePropertyId(ResourceType.MEDIA_ASSET, mediaId)).contains(propertyId);
    }

    @Test
    @DisplayName("Delegation deeper than the max depth resolves to nothing")
    void delegationBeyondMaxDepthIsRejected() {
        // Every resource delegates to another lease forever
        ResourceScopeRegistry registry = new ResourceScopeRegistry(List.of(
                resolver(allExceptProperty(), (t, id) ->
                        Optional.of(new ResourceScope.Delegated(ResourceType.LEASE, UUID.randomUUID(), null)))));

        assertThat(registry.resolvePropertyId(ResourceType.LEASE, UUID.randomUUID())).isEmpty();
    }

    @Test
    @DisplayName("A delegated scope with an unknown parent resolves to nothing")
    void delegatedWithoutParentResolvesToNothing() {
        ResourceScopeRegistry registry = new ResourceScopeRegistry(List.of(
                resolver(allExceptProperty(), (t, id) ->
                        Optional.of(new ResourceScope.Delegated(null, null, UUID.randomUUID())))));

        assertThat(registry.resolvePropertyId(ResourceType.MEDIA_ASSET, UUID.randomUUID())).isEmpty();
    }
}
