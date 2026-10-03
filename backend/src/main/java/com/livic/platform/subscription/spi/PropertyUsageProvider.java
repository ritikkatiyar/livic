package com.livic.platform.subscription.spi;

import java.util.UUID;

/**
 * How much of a plan a user is already using. Declared here and implemented by the module that
 * owns properties, so subscription enforcement never reaches into core.
 */
public interface PropertyUsageProvider {

    /** Properties the user owns; managing someone else's property does not use their plan. */
    long countPropertiesForUser(UUID userId);

    /** Units across the properties the user owns. */
    long countUnitsForUser(UUID userId);
}
