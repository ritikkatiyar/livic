package com.livic.platform.auth.spi;

import java.util.Arrays;
import java.util.Collection;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Where an authorizable resource lives, as reported by its owning module.
 */
public sealed interface ResourceScope {

    /**
     * Resource sits directly under a property. {@code holderUserIds} are the users it belongs to (the
     * tenant of a lease, the payer of a bill, the residents of a property): they hold its self-service
     * ({@code _OWN}) permissions without anyone granting them.
     */
    record Property(UUID propertyId, Set<UUID> holderUserIds) implements ResourceScope {

        public Property {
            holderUserIds = holderUserIds == null ? Set.of()
                    : holderUserIds.stream().filter(Objects::nonNull).collect(Collectors.toUnmodifiableSet());
        }

        /** A resource no particular user holds. */
        public static Property of(UUID propertyId) {
            return new Property(propertyId, Set.of());
        }

        /** Missing users are skipped, so a resource whose holder is unknown is simply held by nobody. */
        public static Property heldBy(UUID propertyId, UUID... holderUserIds) {
            return new Property(propertyId, Arrays.stream(holderUserIds).filter(Objects::nonNull).collect(Collectors.toSet()));
        }

        public static Property heldBy(UUID propertyId, Collection<UUID> holderUserIds) {
            return new Property(propertyId, Set.copyOf(holderUserIds.stream().filter(Objects::nonNull).toList()));
        }
    }

    /**
     * Resource inherits access from a parent resource (e.g. inventory assignment → lease).
     * {@code parentType}/{@code parentId} may be null when the parent is unknown; such a resource
     * resolves to no property.
     */
    record Delegated(ResourceType parentType, UUID parentId) implements ResourceScope {
    }
}
