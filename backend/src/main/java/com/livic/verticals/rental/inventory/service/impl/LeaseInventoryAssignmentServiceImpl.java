package com.livic.verticals.rental.inventory.service.impl;

import com.livic.verticals.rental.inventory.dto.ApproveDeductionsRequest;
import com.livic.verticals.rental.inventory.dto.AssignmentItemResponse;
import com.livic.verticals.rental.inventory.dto.CreateAssignmentItemPayload;
import com.livic.verticals.rental.inventory.dto.CreateAssignmentRequest;
import com.livic.verticals.rental.inventory.dto.MoveOutChecklistRequest;
import com.livic.verticals.rental.inventory.dto.ReturnVerificationRequest;
import com.livic.verticals.rental.inventory.dto.VerificationItemResponse;
import com.livic.platform.common.exception.BusinessException;
import com.livic.core.finance.facade.FinanceFacade;
import com.livic.verticals.rental.inventory.domain.InventoryItemTbl;
import com.livic.verticals.rental.inventory.domain.LeaseInventoryAssignmentTbl;
import com.livic.verticals.rental.inventory.domain.enums.DeductionApprovalStatus;
import com.livic.verticals.rental.inventory.domain.enums.InventoryCondition;
import com.livic.verticals.rental.inventory.domain.enums.InventoryStatus;
import com.livic.verticals.rental.inventory.mapper.InventoryMapper;
import com.livic.verticals.rental.inventory.repository.InventoryItemRepository;
import com.livic.verticals.rental.inventory.repository.LeaseInventoryAssignmentRepository;
import com.livic.verticals.rental.inventory.service.interfaces.LeaseInventoryAssignmentService;
import com.livic.platform.storage.dto.MediaDTOs;
import com.livic.platform.common.enums.OwnerModule;
import com.livic.platform.storage.facade.StorageFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaseInventoryAssignmentServiceImpl implements LeaseInventoryAssignmentService {

    private final LeaseInventoryAssignmentRepository assignmentRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final StorageFacade storageFacade;
    private final FinanceFacade financeFacade;

    @Override
    @Transactional
    public List<AssignmentItemResponse> createAssignments(
            UUID leaseId, 
            CreateAssignmentRequest request, 
            UUID userId) {
        
        if (request.items() == null || request.items().isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "No items provided for lease assignment");
        }

        Set<UUID> itemIds = request.items().stream()
                .map(CreateAssignmentItemPayload::itemId)
                .collect(Collectors.toSet());

        List<InventoryItemTbl> items = inventoryItemRepository.findAllByIdIn(itemIds);
        Map<UUID, InventoryItemTbl> itemMap = items.stream()
                .collect(Collectors.toMap(InventoryItemTbl::getId, Function.identity()));

        List<LeaseInventoryAssignmentTbl> existingActive = assignmentRepository.findActiveAssignmentsByItemIds(itemIds);
        if (!existingActive.isEmpty()) {
            String occupiedIds = existingActive.stream()
                    .map(a -> a.getItemId().toString())
                    .collect(Collectors.joining(", "));
            throw new BusinessException(HttpStatus.CONFLICT, "Item(s) already actively assigned to a lease: " + occupiedIds);
        }

        List<LeaseInventoryAssignmentTbl> newAssignments = new ArrayList<>();
        List<InventoryItemTbl> itemsToUpdate = new ArrayList<>();

        for (CreateAssignmentItemPayload payload : request.items()) {
            InventoryItemTbl item = itemMap.get(payload.itemId());
            if (item == null) {
                throw new BusinessException(HttpStatus.NOT_FOUND, "Inventory item not found: " + payload.itemId());
            }

            LeaseInventoryAssignmentTbl assignment = LeaseInventoryAssignmentTbl.builder()
                    .id(UUID.randomUUID())
                    .leaseId(leaseId)
                    .itemId(item.getId())
                    .conditionAtAssignment(payload.conditionAtAssignment() != null ? payload.conditionAtAssignment() : item.getCurrentCondition())
                    .assignedAt(Instant.now())
                    .assignmentNotes(payload.assignmentNotes())
                    .deductionApprovalStatus(DeductionApprovalStatus.NONE)
                    .build();

            newAssignments.add(assignment);

            item.setStatus(InventoryStatus.ASSIGNED);
            if (payload.conditionAtAssignment() != null) {
                item.setCurrentCondition(payload.conditionAtAssignment());
            }
            itemsToUpdate.add(item);
        }

        List<LeaseInventoryAssignmentTbl> savedAssignments = assignmentRepository.saveAll(newAssignments);
        inventoryItemRepository.saveAll(itemsToUpdate);

        log.info("[INVENTORY] Created {} assignments for leaseId={}, user={}", savedAssignments.size(), leaseId, userId);

        return getAssignmentsForLease(leaseId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssignmentItemResponse> getAssignmentsForLease(UUID leaseId) {
        return getAssignmentsForLease(leaseId, Pageable.unpaged()).getContent();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AssignmentItemResponse> getAssignmentsForLease(UUID leaseId, Pageable pageable) {
        Page<LeaseInventoryAssignmentTbl> page = assignmentRepository.findAllByLeaseId(leaseId, pageable);
        if (page == null || page.isEmpty()) {
            return Page.empty(pageable);
        }

        Set<UUID> itemIds = page.getContent().stream().map(LeaseInventoryAssignmentTbl::getItemId).collect(Collectors.toSet());
        List<InventoryItemTbl> items = inventoryItemRepository.findAllByIdIn(itemIds);
        Map<UUID, InventoryItemTbl> itemMap = items.stream().collect(Collectors.toMap(InventoryItemTbl::getId, Function.identity()));

        Set<UUID> assignmentIds = page.getContent().stream().map(LeaseInventoryAssignmentTbl::getId).collect(Collectors.toSet());
        Map<UUID, List<MediaDTOs.MediaAssetDTO>> mediaMap = storageFacade.getAssetsForReferences(OwnerModule.INVENTORY, assignmentIds);

        List<AssignmentItemResponse> dtoList = page.getContent().stream()
                .map(a -> {
                    InventoryItemTbl item = itemMap.get(a.getItemId());
                    if (item == null) return null;
                    List<MediaDTOs.MediaAssetDTO> media = mediaMap.get(a.getId());
                    int photoCount = media != null ? media.size() : 0;
                    String img = (media != null && !media.isEmpty()) ? media.get(0).url() : null;
                    return InventoryMapper.toAssignmentResponse(item, a, null, img, photoCount);
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        return new PageImpl<>(dtoList, pageable, page.getTotalElements());
    }

    @Override
    @Transactional
    public List<VerificationItemResponse> generateMoveOutChecklist(UUID leaseId, MoveOutChecklistRequest request, UUID userId) {
        List<LeaseInventoryAssignmentTbl> activeAssignments = assignmentRepository.findActiveAssignmentsByLeaseId(leaseId);
        log.info("[INVENTORY] Generating move-out checklist for leaseId={}, activeItemsCount={}, user={}",
                leaseId, activeAssignments.size(), userId);
        return getVerificationChecklistForLease(leaseId);
    }

    @Override
    @Transactional
    public VerificationItemResponse verifyReturn(UUID assignmentId, ReturnVerificationRequest request, UUID userId) {
        LeaseInventoryAssignmentTbl assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Assignment not found with ID: " + assignmentId));

        assignment.setConditionAtReturn(request.conditionAtReturn());
        assignment.setReturnedAt(Instant.now());
        assignment.setReturnNotes(request.returnNotes());
        assignment.setDamageDeductionAmount(request.damageDeductionAmount() != null ? request.damageDeductionAmount() : BigDecimal.ZERO);
        assignment.setDeductionApprovalStatus(
                request.deductionApprovalStatus() != null ? request.deductionApprovalStatus() : DeductionApprovalStatus.PENDING_OWNER_APPROVAL
        );
        assignment.setVerifiedBy(userId);

        LeaseInventoryAssignmentTbl savedAssignment = assignmentRepository.save(assignment);

        InventoryItemTbl item = inventoryItemRepository.findById(assignment.getItemId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Item not found with ID: " + assignment.getItemId()));

        if (request.conditionAtReturn() == InventoryCondition.DAMAGED) {
            item.setStatus(InventoryStatus.SERVICE_DUE);
            item.setCurrentCondition(InventoryCondition.DAMAGED);
        } else {
            item.setStatus(InventoryStatus.AVAILABLE);
            item.setCurrentCondition(request.conditionAtReturn());
        }
        inventoryItemRepository.save(item);

        log.info("[INVENTORY] Verified return for assignmentId={}, itemId={}, condition={}, deduction={}, user={}",
                assignmentId, item.getId(), request.conditionAtReturn(), request.damageDeductionAmount(), userId);

        List<MediaDTOs.MediaAssetDTO> photos = storageFacade.getAssets(OwnerModule.INVENTORY, assignmentId);
        String moveInPhoto = photos.stream()
                .filter(p -> "move-in".equalsIgnoreCase(p.caption()))
                .map(MediaDTOs.MediaAssetDTO::url)
                .findFirst()
                .orElse((photos != null && !photos.isEmpty()) ? photos.get(0).url() : "");

        String returnPhoto = photos.stream()
                .filter(p -> "move-out".equalsIgnoreCase(p.caption()) || "return".equalsIgnoreCase(p.caption()) || "damage".equalsIgnoreCase(p.caption()))
                .map(MediaDTOs.MediaAssetDTO::url)
                .findFirst()
                .orElse("");

        return InventoryMapper.toVerificationResponse(savedAssignment, item, null, moveInPhoto, returnPhoto);
    }

    @Override
    @Transactional
    public List<VerificationItemResponse> approveDeductions(UUID leaseId, ApproveDeductionsRequest request, UUID userId) {
        List<LeaseInventoryAssignmentTbl> assignments = assignmentRepository.findAllByLeaseId(leaseId);
        if (assignments.isEmpty()) {
            return List.of();
        }

        List<LeaseInventoryAssignmentTbl> toUpdate = new ArrayList<>();
        Set<UUID> targetIds = (request.assignmentIds() != null) ? Set.copyOf(request.assignmentIds()) : Set.of();

        for (LeaseInventoryAssignmentTbl a : assignments) {
            if (request.approveAll() || targetIds.contains(a.getId())) {
                if (a.getDeductionApprovalStatus() == DeductionApprovalStatus.PENDING_OWNER_APPROVAL) {
                    a.setDeductionApprovalStatus(DeductionApprovalStatus.APPROVED);
                    toUpdate.add(a);
                }
            }
        }

        if (!toUpdate.isEmpty()) {
            assignmentRepository.saveAll(toUpdate);
            log.info("[INVENTORY] Approved deductions for {} assignments on leaseId={}, user={}", toUpdate.size(), leaseId, userId);
        }

        return getVerificationChecklistForLease(leaseId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VerificationItemResponse> getVerificationChecklistForLease(UUID leaseId) {
        return getVerificationChecklistForLease(leaseId, Pageable.unpaged()).getContent();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VerificationItemResponse> getVerificationChecklistForLease(UUID leaseId, Pageable pageable) {
        Page<LeaseInventoryAssignmentTbl> page = assignmentRepository.findAllByLeaseId(leaseId, pageable);
        if (page == null || page.isEmpty()) {
            return Page.empty(pageable);
        }

        Set<UUID> itemIds = page.getContent().stream().map(LeaseInventoryAssignmentTbl::getItemId).collect(Collectors.toSet());
        List<InventoryItemTbl> items = inventoryItemRepository.findAllByIdIn(itemIds);
        Map<UUID, InventoryItemTbl> itemMap = items.stream().collect(Collectors.toMap(InventoryItemTbl::getId, Function.identity()));

        Set<UUID> assignmentIds = page.getContent().stream().map(LeaseInventoryAssignmentTbl::getId).collect(Collectors.toSet());
        Map<UUID, List<MediaDTOs.MediaAssetDTO>> mediaMap = storageFacade.getAssetsForReferences(OwnerModule.INVENTORY, assignmentIds);

        List<VerificationItemResponse> dtoList = page.getContent().stream()
                .map(a -> {
                    InventoryItemTbl item = itemMap.get(a.getItemId());
                    if (item == null) return null;
                    List<MediaDTOs.MediaAssetDTO> photos = mediaMap.get(a.getId());
                    String moveInPhoto = (photos != null) ? photos.stream()
                            .filter(p -> "move-in".equalsIgnoreCase(p.caption()))
                            .map(MediaDTOs.MediaAssetDTO::url)
                            .findFirst()
                            .orElse((!photos.isEmpty()) ? photos.get(0).url() : "") : "";

                    String returnPhoto = (photos != null) ? photos.stream()
                            .filter(p -> "move-out".equalsIgnoreCase(p.caption()) || "return".equalsIgnoreCase(p.caption()) || "damage".equalsIgnoreCase(p.caption()))
                            .map(MediaDTOs.MediaAssetDTO::url)
                            .findFirst()
                            .orElse("") : "";

                    return InventoryMapper.toVerificationResponse(a, item, null, moveInPhoto, returnPhoto);
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        return new PageImpl<>(dtoList, pageable, page.getTotalElements());
    }
}
