package com.livic.core.property.security;

import com.livic.platform.auth.spi.ResourceType;

import java.util.Set;

import static com.livic.core.property.security.PropertyPermissions.PROPERTY_EDIT;
import static com.livic.core.property.security.PropertyPermissions.PROPERTY_VIEW;

/**
 * The resources the property module authorizes. A property's residents hold PROPERTY_VIEW_OWN on it;
 * a unit is reached through its property.
 */
public final class PropertyResources {

    public static final ResourceType PROPERTY = new ResourceType("PROPERTY",
            Set.of(PROPERTY_VIEW, "PROPERTY_VIEW_OWN"), Set.of(PROPERTY_EDIT));
    public static final ResourceType UNIT = new ResourceType("UNIT", Set.of(PROPERTY_VIEW), Set.of(PROPERTY_EDIT));

    private PropertyResources() {
    }
}
