package com.livic.platform.auth.spi;

import java.util.Objects;
import java.util.Set;

/**
 * A kind of resource that can be authorized. Each module declares its own (the {@code *Resources}
 * classes) and says where one lives through its {@link ResourceScopeResolver}, so auth knows no
 * business resources by name. {@code viewCodes} and {@code editCodes} are the permissions that let a
 * user see or change the resource; files attached to it follow them. Two types are equal when their
 * names are.
 */
public record ResourceType(String name, Set<String> viewCodes, Set<String> editCodes) {

    public ResourceType {
        Objects.requireNonNull(name, "name");
        viewCodes = Set.copyOf(viewCodes);
        editCodes = Set.copyOf(editCodes);
    }

    /** A type checked only through the codes its endpoints name, with nothing attached to it. */
    public static ResourceType named(String name) {
        return new ResourceType(name, Set.of(), Set.of());
    }

    @Override
    public boolean equals(Object other) {
        return other instanceof ResourceType type && type.name.equals(name);
    }

    @Override
    public int hashCode() {
        return name.hashCode();
    }

    @Override
    public String toString() {
        return name;
    }
}
