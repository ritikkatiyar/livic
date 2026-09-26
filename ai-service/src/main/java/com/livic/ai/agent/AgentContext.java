package com.livic.ai.agent;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Who is asking, built from the verified JWT and the backend's /me/context. Livic has no org-level
 * tenant: access is per property, so the caller's properties and their permission codes stand in for
 * the design doc's tenantId. The model never supplies any of this.
 */
public record AgentContext(
        UUID userId,
        String userToken,
        String requestId,
        Map<UUID, PropertyAccess> properties
) {

    public record PropertyAccess(String name, Set<String> permissionCodes) {
    }

    /** A null permission means the tool needs none. */
    public boolean hasPermissionOnAnyProperty(String permissionCode) {
        return permissionCode == null || properties.values().stream()
                .anyMatch(access -> access.permissionCodes().contains(permissionCode));
    }

    @Override
    public String toString() {
        return "AgentContext[userId=%s, requestId=%s, properties=%s]".formatted(userId, requestId, properties.keySet());
    }
}
