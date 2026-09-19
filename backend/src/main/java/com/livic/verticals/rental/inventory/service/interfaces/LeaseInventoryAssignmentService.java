package com.livic.verticals.rental.inventory.service.interfaces;

import com.livic.verticals.rental.inventory.dto.ApproveDeductionsRequest;
import com.livic.verticals.rental.inventory.dto.AssignmentItemResponse;
import com.livic.verticals.rental.inventory.dto.CreateAssignmentRequest;
import com.livic.verticals.rental.inventory.dto.MoveOutChecklistRequest;
import com.livic.verticals.rental.inventory.dto.ReturnVerificationRequest;
import com.livic.verticals.rental.inventory.dto.VerificationItemResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface LeaseInventoryAssignmentService {

    List<AssignmentItemResponse> createAssignments(UUID leaseId, CreateAssignmentRequest request, UUID userId);

    List<AssignmentItemResponse> getAssignmentsForLease(UUID leaseId);

    Page<AssignmentItemResponse> getAssignmentsForLease(UUID leaseId, Pageable pageable);

    List<VerificationItemResponse> generateMoveOutChecklist(UUID leaseId, MoveOutChecklistRequest request, UUID userId);

    VerificationItemResponse verifyReturn(UUID assignmentId, ReturnVerificationRequest request, UUID userId);

    List<VerificationItemResponse> approveDeductions(UUID leaseId, ApproveDeductionsRequest request, UUID userId);

    List<VerificationItemResponse> getVerificationChecklistForLease(UUID leaseId);

    Page<VerificationItemResponse> getVerificationChecklistForLease(UUID leaseId, Pageable pageable);
}
