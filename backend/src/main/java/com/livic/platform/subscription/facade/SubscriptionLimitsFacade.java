package com.livic.platform.subscription.facade;

import java.util.UUID;

/** Plan limits core checks directly, before it creates something a plan counts. */
public interface SubscriptionLimitsFacade {

    /**
     * Refuses (403) when {@code additionalUnits} more units would take the plan of the property's
     * owner past its unit limit. The owner pays for the units, whoever adds them.
     */
    void checkCanAddUnits(UUID propertyId, int additionalUnits);
}
