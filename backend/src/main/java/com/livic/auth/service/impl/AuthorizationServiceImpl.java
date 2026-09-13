package com.livic.auth.service.impl;

import com.livic.auth.principal.UserDetailsImpl;
import com.livic.auth.service.interfaces.AuthorizationService;
import com.livic.auth.service.interfaces.MembershipCrudService;
import com.livic.auth.spi.ResourceScope;
import com.livic.common.enums.AccessType;
import com.livic.common.enums.OwnerModule;
import com.livic.common.enums.ResourceType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

@Slf4j
@Service("authorizationService")
@RequiredArgsConstructor
public class AuthorizationServiceImpl implements AuthorizationService {

    private final MembershipCrudService membershipCrudService;
    private final ResourceScopeRegistry resourceScopeRegistry;

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermission(UUID propertyId, String permissionCode) {
        return checkPermission(propertyId, permissionCode);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasAnyPermission(UUID propertyId, String... permissionCodes) {
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) return false;
        if (isUserGloballyAuthorized(currentUser)) return true;

        if (hasFullAccess(propertyId)) {
            return true;
        }

        UUID userId = currentUser.getUuid();
        Set<String> userPermissions = membershipCrudService.findPermissionCodesByUserIdAndPropertyId(userId, propertyId);

        for (String code : permissionCodes) {
            if (userPermissions.contains(code)) {
                log.debug("User {} has permission {} on property {}", userId, code, propertyId);
                return true;
            }
        }

        log.debug("User {} does not have any of {} on property {}", userId, permissionCodes, propertyId);
        return false;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasFullAccess(UUID propertyId) {
        if (propertyId == null) return false;
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) return false;
        if (isUserGloballyAuthorized(currentUser)) return true;

        UUID userId = currentUser.getUuid();
        return membershipCrudService.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, AccessType.FULL_ACCESS);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermission(ResourceType resourceType, UUID resourceId, String permissionCode) {
        if (resourceType == null || resourceId == null) {
            return false;
        }

        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) {
            return false;
        }
        if (isUserGloballyAuthorized(currentUser)) {
            return true;
        }

        UUID userId = currentUser.getUuid();

        try {
            if (resourceType == ResourceType.MEDIA_ASSET) {
                return hasMediaAssetAccess(resourceId, permissionCode);
            }
            return resourceScopeRegistry.resolve(resourceType, resourceId)
                    .map(scope -> switch (scope) {
                        case ResourceScope.Property property -> {
                            if (resourceType == ResourceType.LEASE && "LEASE_VIEW_OWN".equals(permissionCode)
                                    && property.ownerUserId() != null && property.ownerUserId().equals(userId)) {
                                yield true;
                            }
                            yield checkPermission(property.propertyId(), permissionCode);
                        }
                        case ResourceScope.Delegated delegated ->
                                hasPermission(delegated.parentType(), delegated.parentId(), permissionCode);
                    })
                    .orElse(false);
        } catch (Exception e) {
            log.error("Error evaluating permission {} on resource {} ({}): {}", permissionCode, resourceType, resourceId, e.getMessage(), e);
            return false;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasAnyPermission(ResourceType resourceType, UUID resourceId, String... permissionCodes) {
        if (permissionCodes == null) return false;
        for (String permissionCode : permissionCodes) {
            if (hasPermission(resourceType, resourceId, permissionCode)) {
                return true;
            }
        }
        return false;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasFullAccess(ResourceType resourceType, UUID resourceId) {
        if (resourceType == null || resourceId == null) return false;
        return resourceScopeRegistry.resolvePropertyId(resourceType, resourceId)
                .map(this::hasFullAccess)
                .orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasMediaAccess(OwnerModule ownerModule, UUID referenceId, String action) {
        if (ownerModule == null || referenceId == null) {
            return false;
        }
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) return false;
        if (isUserGloballyAuthorized(currentUser)) return true;

        return hasMediaAccessOn(ResourceType.forOwnerModule(ownerModule), referenceId, action);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasMediaAssetAccess(UUID mediaAssetId, String action) {
        if (mediaAssetId == null) return false;
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) return false;
        if (isUserGloballyAuthorized(currentUser)) return true;

        UUID userId = currentUser.getUuid();
        try {
            return resourceScopeRegistry.resolve(ResourceType.MEDIA_ASSET, mediaAssetId).map(scope -> {
                if (!(scope instanceof ResourceScope.Delegated asset)) {
                    return false;
                }
                if (asset.ownerUserId() != null && asset.ownerUserId().equals(userId)) {
                    return true;
                }
                return hasMediaAccessOn(asset.parentType(), asset.parentId(), action);
            }).orElse(false);
        } catch (Exception e) {
            log.error("Error checking permission for mediaAssetId {}: {}", mediaAssetId, e.getMessage(), e);
            return false;
        }
    }

    private boolean hasMediaAccessOn(ResourceType parentType, UUID referenceId, String action) {
        if (parentType == null || referenceId == null) {
            return false;
        }

        boolean isWrite = "WRITE".equalsIgnoreCase(action) || "DELETE".equalsIgnoreCase(action) || "EDIT".equalsIgnoreCase(action);

        return switch (parentType) {
            case PROPERTY -> isWrite ? checkPermission(referenceId, "PROPERTY_EDIT") : checkPermission(referenceId, "PROPERTY_VIEW");
            case LEASE -> isWrite ? hasPermission(ResourceType.LEASE, referenceId, "LEASE_UPDATE")
                    : (hasPermission(ResourceType.LEASE, referenceId, "LEASE_VIEW") || hasPermission(ResourceType.LEASE, referenceId, "LEASE_VIEW_OWN"));
            case INVENTORY_ITEM -> isWrite ? hasPermission(ResourceType.INVENTORY_ITEM, referenceId, "PROPERTY_EDIT") : hasPermission(ResourceType.INVENTORY_ITEM, referenceId, "PROPERTY_VIEW");
            default -> false;
        };
    }

    private boolean isUserGloballyAuthorized(UserDetailsImpl currentUser) {
        return currentUser != null && (currentUser.hasGlobalRole("SUPER_ADMIN") || currentUser.hasGlobalRole("ADMIN"));
    }

    private boolean checkPermission(UUID propertyId, String permissionCode) {
        if (propertyId == null) {
            return false;
        }
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) {
            return false;
        }
        if (isUserGloballyAuthorized(currentUser)) {
            return true;
        }

        UUID userId = currentUser.getUuid();

        // 1. Full Access check: if the user holds any FULL_ACCESS role on this property, all permissions are granted
        if (membershipCrudService.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, AccessType.FULL_ACCESS)) {
            log.debug("User {} has FULL_ACCESS on property {}", userId, propertyId);
            return true;
        }

        // 2. Custom Access check: check explicit permission matrix
        Set<String> permissions = membershipCrudService.findPermissionCodesByUserIdAndPropertyId(userId, propertyId);
        boolean hasPerm = permissions.contains(permissionCode);
        log.debug("User {} permission check for {} on property {}: {}", userId, permissionCode, propertyId, hasPerm);

        return hasPerm;
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        if (authentication.getPrincipal() instanceof UserDetailsImpl) {
            return (UserDetailsImpl) authentication.getPrincipal();
        }
        return null;
    }
}
