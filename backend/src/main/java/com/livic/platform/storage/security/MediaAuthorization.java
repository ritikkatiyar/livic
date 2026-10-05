package com.livic.platform.storage.security;

import com.livic.platform.auth.service.interfaces.AuthorizationService;
import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.storage.service.interfaces.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.UUID;

/**
 * Who may see or change files. A file follows the resource it is attached to: reading it takes one of
 * that resource type's view permissions, changing it one of its edit permissions. Storage knows no
 * resource types itself; the owning modules declare them.
 */
@Component("mediaAuthorization")
@RequiredArgsConstructor
public class MediaAuthorization {

    private final AuthorizationService authorizationService;
    private final StorageService storageService;

    public boolean canAccess(String ownerModule, UUID referenceId, String action) {
        if (referenceId == null) {
            return false;
        }
        return authorizationService.findResourceType(ownerModule)
                .map(type -> {
                    Set<String> codes = isWrite(action) ? type.editCodes() : type.viewCodes();
                    return !codes.isEmpty()
                            && authorizationService.hasAnyPermission(type, referenceId, codes.toArray(String[]::new));
                })
                .orElse(false);
    }

    /** Whoever uploaded a file may always manage it; anyone else needs access to what it is attached to. */
    public boolean canAccessAsset(UUID mediaAssetId, String action) {
        if (mediaAssetId == null) {
            return false;
        }
        return storageService.getAssetById(mediaAssetId)
                .map(asset -> isCurrentUser(asset.uploadedByUserId())
                        || canAccess(asset.ownerModule(), asset.referenceId(), action))
                .orElse(false);
    }

    private static boolean isWrite(String action) {
        return "WRITE".equalsIgnoreCase(action) || "DELETE".equalsIgnoreCase(action) || "EDIT".equalsIgnoreCase(action);
    }

    private static boolean isCurrentUser(UUID userId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return userId != null && authentication != null
                && authentication.getPrincipal() instanceof UserDetailsImpl user
                && userId.equals(user.getUuid());
    }
}
