package com.livic.billing.dto;

import com.livic.common.subscription.FeatureKey;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSubscriptionContext implements Serializable {
    private static final long serialVersionUID = 1L;

    private UUID userId;
    private String planId;
    private String planKey;
    private Map<FeatureKey, Integer> featureLimits;

    public int getLimit(FeatureKey key) {
        if (featureLimits == null || !featureLimits.containsKey(key)) {
            return 0; // Default to disabled if key missing
        }
        return featureLimits.get(key);
    }

    public boolean isFeatureEnabled(FeatureKey key) {
        return getLimit(key) > 0 || getLimit(key) == -1;
    }
}
