package com.livic.features.announcement.controller;

import com.livic.features.announcement.dto.AnnouncementDTOs.CreateAnnouncementRequest;
import com.livic.features.announcement.dto.AnnouncementDTOs.AnnouncementResponse;
import com.livic.features.announcement.service.interfaces.AnnouncementService;
import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/announcement/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @PostMapping
    @PreAuthorize("@authorizationService.hasPermission(#request.propertyId, 'ANNOUNCEMENT_CREATE')")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> createAnnouncement(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody CreateAnnouncementRequest request) {
        UUID creatorId = UUID.fromString(currentUser.getId());
        AnnouncementResponse response = announcementService.createAnnouncement(request, creatorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AnnouncementResponse>>> getAnnouncements(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam(required = false) UUID propertyId,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC, size = 20) Pageable pageable) {

        UUID userId = UUID.fromString(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(announcementService.getAnnouncements(userId, propertyId, pageable)));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PathVariable UUID id) {
        UUID tenantUserId = UUID.fromString(currentUser.getId());
        announcementService.markAsRead(id, tenantUserId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
