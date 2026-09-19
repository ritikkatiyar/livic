package com.livic.verticals.rental.inventory.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AssignmentItemResponse(
        UUID id,
        UUID assignmentId,
        UUID leaseId,
        UUID propertyId,
        UUID unitId,
        String name,
        String category,
        String location,
        String serial,
        String condition,
        String status,
        String nextService,
        BigDecimal value,
        boolean shared,
        String icon,
        String image,
        String notes,
        String assignmentStatus,
        String assignmentCondition,
        int photoCount,
        Instant assignedAt
) {}
