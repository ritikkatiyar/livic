package com.livic.platform.auth.service.impl;

import com.livic.platform.auth.spi.ResourceScope;
import com.livic.platform.auth.spi.ResourceScopeResolver;
import com.livic.platform.auth.spi.ResourceType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.BiFunction;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** The registry knows resource types only as the modules declare them, and follows delegation to a property. */
class ResourceScopeRegistryTest {

    private static final ResourceType HOUSE = ResourceType.named("HOUSE");
    private static final ResourceType CONTRACT = new ResourceType("CONTRACT", Set.of("CONTRACT_VIEW"), Set.of("CONTRACT_EDIT"));
    private static final ResourceType ATTACHMENT = ResourceType.named("ATTACHMENT");

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
    @DisplayName("Startup fails when two resolvers claim the same resource type")
    void failsOnDuplicateResolver() {
        assertThatThrownBy(() -> new ResourceScopeRegistry(List.of(
                resolver(Set.of(HOUSE, CONTRACT), (t, id) -> Optional.empty()),
                resolver(Set.of(CONTRACT), (t, id) -> Optional.empty()))))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Duplicate")
                .hasMessageContaining("CONTRACT");
    }

    @Test
    @DisplayName("A type stored as text is found by its name, with the codes its module declared")
    void typesAreFoundByName() {
        ResourceScopeRegistry registry = new ResourceScopeRegistry(List.of(
                resolver(Set.of(HOUSE, CONTRACT), (t, id) -> Optional.empty())));

        assertThat(registry.findType("CONTRACT")).hasValueSatisfying(type -> {
            assertThat(type.viewCodes()).containsExactly("CONTRACT_VIEW");
            assertThat(type.editCodes()).containsExactly("CONTRACT_EDIT");
        });
        assertThat(registry.findType("NOT_DECLARED")).isEmpty();
        assertThat(registry.findType(null)).isEmpty();
    }

    @Test
    @DisplayName("A type no module declares resolves to nothing")
    void undeclaredTypeResolvesToNothing() {
        ResourceScopeRegistry registry = new ResourceScopeRegistry(List.of(
                resolver(Set.of(HOUSE), (t, id) -> Optional.of(new ResourceScope.Property(id, null)))));

        assertThat(registry.resolvePropertyId(CONTRACT, UUID.randomUUID())).isEmpty();
    }

    @Test
    @DisplayName("A resolver that is its own scope resolves to its own id")
    void propertyLikeTypeResolvesToItself() {
        ResourceScopeRegistry registry = new ResourceScopeRegistry(List.of(
                resolver(Set.of(HOUSE), (t, id) -> Optional.of(new ResourceScope.Property(id, null)))));
        UUID houseId = UUID.randomUUID();

        assertThat(registry.resolvePropertyId(HOUSE, houseId)).contains(houseId);
    }

    @Test
    @DisplayName("Delegated scopes are followed to the owning property")
    void delegationChainResolvesToProperty() {
        UUID propertyId = UUID.randomUUID();
        UUID contractId = UUID.randomUUID();
        UUID attachmentId = UUID.randomUUID();
        Map<UUID, ResourceScope> scopes = Map.of(
                attachmentId, new ResourceScope.Delegated(CONTRACT, contractId),
                contractId, new ResourceScope.Property(propertyId, null));
        ResourceScopeRegistry registry = new ResourceScopeRegistry(List.of(
                resolver(Set.of(CONTRACT, ATTACHMENT), (t, id) -> Optional.ofNullable(scopes.get(id)))));

        assertThat(registry.resolvePropertyId(ATTACHMENT, attachmentId)).contains(propertyId);
    }

    @Test
    @DisplayName("Delegation deeper than the max depth resolves to nothing")
    void delegationBeyondMaxDepthIsRejected() {
        // Every contract delegates to another contract forever
        ResourceScopeRegistry registry = new ResourceScopeRegistry(List.of(
                resolver(Set.of(CONTRACT), (t, id) ->
                        Optional.of(new ResourceScope.Delegated(CONTRACT, UUID.randomUUID())))));

        assertThat(registry.resolvePropertyId(CONTRACT, UUID.randomUUID())).isEmpty();
    }

    @Test
    @DisplayName("A delegated scope with an unknown parent resolves to nothing")
    void delegatedWithoutParentResolvesToNothing() {
        ResourceScopeRegistry registry = new ResourceScopeRegistry(List.of(
                resolver(Set.of(ATTACHMENT), (t, id) ->
                        Optional.of(new ResourceScope.Delegated(null, null)))));

        assertThat(registry.resolvePropertyId(ATTACHMENT, UUID.randomUUID())).isEmpty();
    }
}
