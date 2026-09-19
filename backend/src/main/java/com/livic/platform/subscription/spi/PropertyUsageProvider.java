package com.livic.platform.subscription.spi;

import java.util.UUID;

/**
 * How much of a plan a user is already using. Declared here and implemented by the module that
 * owns properties, so subscription enforcement never reaches into core.
 */
public interface PropertyUsageProvider {

    /** Properties the user is an active member of. */
    long countPropertiesForUser(UUID userId);

    /** Units across those properties. */
    long countUnitsForUser(UUID userId);
}
