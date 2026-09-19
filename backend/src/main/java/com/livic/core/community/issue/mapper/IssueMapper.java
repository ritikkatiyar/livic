package com.livic.core.community.issue.mapper;

import com.livic.core.community.issue.domain.IssueTbl;
import com.livic.core.community.issue.domain.IssueTimelineTbl;
import com.livic.core.community.issue.dto.IssueDTOs.CreateIssueRequest;
import com.livic.core.community.issue.dto.IssueDTOs.IssueResponse;
import com.livic.core.community.issue.dto.IssueDTOs.IssueTimelineResponse;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class IssueMapper {

    private IssueMapper() {
    }

    public static IssueTbl toEntity(CreateIssueRequest request, UUID reportedByUserId, UUID tenantId) {
        if (request == null) {
            return null;
        }
        return IssueTbl.builder()
                .propertyId(request.propertyId())
                .unitId(request.unitId())
                .leaseId(request.leaseId())
                .tenantId(tenantId)
                .reportedByUserId(reportedByUserId)
                .title(request.title())
                .description(request.description())
                .category(request.category())
                .priority(request.priority())
                .scope(request.scope())
                .assignedContactName(request.assignedContactName())
                .assignedContactPhone(request.assignedContactPhone())
                .build();
    }

    public static IssueResponse toResponse(IssueTbl entity, List<IssueTimelineTbl> timeline, Map<UUID, String> authorNamesMap) {
        if (entity == null) {
            return null;
        }

        List<IssueTimelineResponse> timelineResponses = List.of();
        if (timeline != null) {
            timelineResponses = timeline.stream()
                    .map(t -> {
                        String name = authorNamesMap.getOrDefault(t.getAuthorUserId(), "System");
                        return new IssueTimelineResponse(
                                t.getId(),
                                t.getAuthorUserId(),
                                name,
                                t.getEntryType(),
                                t.getContent(),
                                t.getCreatedAt()
                        );
                    })
                    .toList();
        }

        String ticketNumber = "ISS-" + entity.getId().toString().substring(0, 8).toUpperCase();

        return new IssueResponse(
                entity.getId(),
                entity.getPropertyId(),
                entity.getUnitId(),
                entity.getLeaseId(),
                entity.getTenantId(),
                entity.getReportedByUserId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getCategory(),
                entity.getPriority(),
                entity.getStatus(),
                entity.getScope(),
                entity.getEscalationStatus(),
                entity.getEscalationLevel(),
                entity.getAssignedContactName(),
                entity.getAssignedContactPhone(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                ticketNumber,
                timelineResponses
        );
    }
}
