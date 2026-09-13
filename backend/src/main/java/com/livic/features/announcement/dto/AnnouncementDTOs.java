package com.livic.features.announcement.dto;

import com.livic.features.announcement.domain.AnnouncementCategory;
import com.livic.features.announcement.domain.AnnouncementSeverity;
import com.livic.features.announcement.domain.AnnouncementTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

public class AnnouncementDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateAnnouncementRequest {
        @NotNull(message = "Property ID is required") private UUID propertyId;

        @NotBlank(message = "Title is required")
        private String title;

        @NotBlank(message = "Content is required")
        private String content;

        @NotNull(message = "Category is required") private AnnouncementCategory category;

        @NotNull(message = "Severity is required") private AnnouncementSeverity severity;

        @NotNull(message = "Target type is required") private AnnouncementTargetType targetType;

        private Integer targetFloorNumber;

        private UUID targetUnitId;

        private String metadata;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnnouncementResponse {
        private UUID id;
        private UUID propertyId;
        private UUID creatorId;
        private String creatorName;
        private String title;
        private String content;
        private AnnouncementCategory category;
        private AnnouncementSeverity severity;
        private AnnouncementTargetType targetType;
        private Integer targetFloorNumber;
        private UUID targetUnitId;
        private String metadata;
        private LocalDateTime createdAt;
        private boolean read;
        
        // Detailed read statistics (optional/populated for staff/landlord views)
        private Long readCount;
        private Long totalRecipientsCount;
    }
}
