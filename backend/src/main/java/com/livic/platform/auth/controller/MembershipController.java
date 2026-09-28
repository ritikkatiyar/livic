package com.livic.platform.auth.controller;

import com.livic.platform.auth.service.interfaces.MembershipQueryService;
import com.livic.platform.auth.service.interfaces.MembershipService;
import com.livic.platform.common.response.ApiResponse;
import com.livic.platform.security.UserDetailsImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

import static com.livic.platform.auth.dto.MembershipDTOs.MembershipResponse;
import static com.livic.platform.auth.dto.MembershipDTOs.TransferOwnershipRequest;
import static com.livic.platform.auth.dto.MembershipDTOs.UpdateMembershipRequest;

/**
 * Staff memberships of a property. Memberships belong to auth, so the endpoints live here even
 * though the path is property-scoped.
 */
@RestController
@RequestMapping("/api/v1/properties/{propertyId}/memberships")
@RequiredArgsConstructor
public class MembershipController {

    private final MembershipService membershipService;
    private final MembershipQueryService membershipQueryService;

    @GetMapping
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'STAFF_VIEW')")
    public ResponseEntity<ApiResponse<Page<MembershipResponse>>> listMemberships(
            @PathVariable UUID propertyId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(membershipQueryService.listMemberships(propertyId, pageable)));
    }

    @PutMapping("/{membershipId}")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'MANAGE_STAFF')")
    public ResponseEntity<ApiResponse<MembershipResponse>> updateMembership(
            @PathVariable UUID propertyId,
            @PathVariable UUID membershipId,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody UpdateMembershipRequest request) {
        MembershipResponse response = membershipService.updateMembership(
                propertyId,
                membershipId,
                request.title(),
                request.accessType(),
                request.isActive(),
                request.permissionCodes(),
                UUID.fromString(currentUser.getId())
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{membershipId}/toggle-active")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'MANAGE_STAFF')")
    public ResponseEntity<ApiResponse<Void>> toggleMembershipActive(
            @PathVariable UUID propertyId,
            @PathVariable UUID membershipId,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam boolean active) {
        membershipService.toggleMembershipActive(propertyId, membershipId, active, UUID.fromString(currentUser.getId()));
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/{membershipId}")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'MANAGE_STAFF')")
    public ResponseEntity<ApiResponse<Void>> removeMembership(
            @PathVariable UUID propertyId,
            @PathVariable UUID membershipId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        membershipService.removeMembership(propertyId, membershipId, UUID.fromString(currentUser.getId()));
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/transfer-ownership")
    @PreAuthorize("@authorizationService.hasFullAccess(#propertyId)")
    public ResponseEntity<ApiResponse<Void>> transferOwnership(
            @PathVariable UUID propertyId,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody TransferOwnershipRequest request) {
        UUID currentOwnerId = UUID.fromString(currentUser.getId());
        membershipService.transferOwnership(propertyId, currentOwnerId, request.toUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
