package com.livic.features.inventory.dto;

import java.util.List;
import java.util.UUID;

public record ApproveDeductionsRequest(
        List<UUID> assignmentIds,
        boolean approveAll
) {}
