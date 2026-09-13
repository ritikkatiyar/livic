package com.livic.features.inventory;

import com.livic.features.inventory.dto.AssignmentItemResponse;
import com.livic.features.inventory.dto.CreateAssignmentItemPayload;
import com.livic.features.inventory.dto.CreateAssignmentRequest;
import com.livic.features.inventory.dto.ReturnVerificationRequest;
import com.livic.features.inventory.dto.VerificationItemResponse;
import com.livic.platform.common.exception.BusinessException;
import com.livic.services.finance.facade.FinanceFacade;
import com.livic.features.inventory.domain.InventoryItemTbl;
import com.livic.features.inventory.domain.LeaseInventoryAssignmentTbl;
import com.livic.features.inventory.domain.enums.DeductionApprovalStatus;
import com.livic.features.inventory.domain.enums.InventoryCategory;
import com.livic.features.inventory.domain.enums.InventoryCondition;
import com.livic.features.inventory.domain.enums.InventoryScope;
import com.livic.features.inventory.domain.enums.InventoryStatus;
import com.livic.features.inventory.repository.InventoryItemRepository;
import com.livic.features.inventory.repository.LeaseInventoryAssignmentRepository;
import com.livic.features.inventory.service.impl.LeaseInventoryAssignmentServiceImpl;
import com.livic.platform.common.enums.OwnerModule;
import com.livic.platform.storage.facade.StorageFacade;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeaseInventoryAssignmentServiceTest {

    @Mock
    private LeaseInventoryAssignmentRepository assignmentRepository;

    @Mock
    private InventoryItemRepository inventoryItemRepository;

    @Mock
    private StorageFacade storageFacade;

    @Mock
    private FinanceFacade financeFacade;

    @InjectMocks
    private LeaseInventoryAssignmentServiceImpl assignmentService;

    private UUID leaseId;
    private UUID itemId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        leaseId = UUID.randomUUID();
        itemId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    @Test
    @DisplayName("createAssignments succeeds when items have no active assignments")
    void testCreateAssignmentsSuccess() {
        InventoryItemTbl item = InventoryItemTbl.builder()
                .id(itemId)
                .propertyId(UUID.randomUUID())
                .name("Microwave")
                .category(InventoryCategory.APPLIANCES)
                .scope(InventoryScope.UNIT_PRIVATE)
                .currentCondition(InventoryCondition.GOOD)
                .status(InventoryStatus.AVAILABLE)
                .replacementValue(BigDecimal.valueOf(12000))
                .build();

        when(inventoryItemRepository.findAllByIdIn(Set.of(itemId))).thenReturn(List.of(item));
        when(assignmentRepository.findActiveAssignmentsByItemIds(Set.of(itemId))).thenReturn(List.of());

        CreateAssignmentRequest request = new CreateAssignmentRequest(
                List.of(new CreateAssignmentItemPayload(
                        itemId,
                        InventoryCondition.EXCELLENT,
                        "Assigned on move-in",
                        null
                ))
        );

        LeaseInventoryAssignmentTbl assignment = LeaseInventoryAssignmentTbl.builder()
                .id(UUID.randomUUID())
                .leaseId(leaseId)
                .itemId(itemId)
                .conditionAtAssignment(InventoryCondition.EXCELLENT)
                .assignedAt(Instant.now())
                .deductionApprovalStatus(DeductionApprovalStatus.NONE)
                .build();

        when(assignmentRepository.saveAll(any())).thenReturn(List.of(assignment));
        when(assignmentRepository.findAllByLeaseId(eq(leaseId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(assignment)));

        List<AssignmentItemResponse> result = assignmentService.createAssignments(leaseId, request, userId);

        assertThat(result).isNotNull();
        assertThat(item.getStatus()).isEqualTo(InventoryStatus.ASSIGNED);
        assertThat(item.getCurrentCondition()).isEqualTo(InventoryCondition.EXCELLENT);
    }

    @Test
    @DisplayName("createAssignments throws Conflict when item is already actively assigned")
    void testCreateAssignmentsRejectsDuplicateActive() {
        LeaseInventoryAssignmentTbl activeAssignment = LeaseInventoryAssignmentTbl.builder()
                .id(UUID.randomUUID())
                .leaseId(UUID.randomUUID())
                .itemId(itemId)
                .assignedAt(Instant.now().minusSeconds(86400))
                .build();

        when(assignmentRepository.findActiveAssignmentsByItemIds(Set.of(itemId))).thenReturn(List.of(activeAssignment));

        CreateAssignmentRequest request = new CreateAssignmentRequest(
                List.of(new CreateAssignmentItemPayload(
                        itemId,
                        InventoryCondition.EXCELLENT,
                        "Assigned on move-in",
                        null
                ))
        );

        assertThatThrownBy(() -> assignmentService.createAssignments(leaseId, request, userId))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.CONFLICT)
                .hasMessageContaining("already actively assigned");
    }

    @Test
    @DisplayName("verifyReturn updates condition, damages, and deduction status")
    void testVerifyReturn() {
        UUID assignmentId = UUID.randomUUID();
        LeaseInventoryAssignmentTbl assignment = LeaseInventoryAssignmentTbl.builder()
                .id(assignmentId)
                .leaseId(leaseId)
                .itemId(itemId)
                .conditionAtAssignment(InventoryCondition.EXCELLENT)
                .assignedAt(Instant.now().minusSeconds(86400))
                .deductionApprovalStatus(DeductionApprovalStatus.NONE)
                .build();

        InventoryItemTbl item = InventoryItemTbl.builder()
                .id(itemId)
                .propertyId(UUID.randomUUID())
                .name("Dining Table")
                .category(InventoryCategory.FURNITURE)
                .scope(InventoryScope.UNIT_PRIVATE)
                .currentCondition(InventoryCondition.EXCELLENT)
                .status(InventoryStatus.ASSIGNED)
                .replacementValue(BigDecimal.valueOf(25000))
                .build();

        when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.of(assignment));
        when(inventoryItemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(assignmentRepository.save(any(LeaseInventoryAssignmentTbl.class))).thenAnswer(inv -> inv.getArgument(0));

        ReturnVerificationRequest request = new ReturnVerificationRequest(
                InventoryCondition.DAMAGED,
                "Deep surface scratch",
                BigDecimal.valueOf(4500),
                DeductionApprovalStatus.PENDING_OWNER_APPROVAL,
                null
        );

        VerificationItemResponse response = assignmentService.verifyReturn(assignmentId, request, userId);

        assertThat(response).isNotNull();
        assertThat(response.returnCondition()).isEqualTo("Damaged");
        assertThat(response.damageDescription()).isEqualTo("Deep surface scratch");
        assertThat(response.deduction()).isEqualByComparingTo(BigDecimal.valueOf(4500));
        assertThat(response.status()).isEqualTo("Damaged");
        assertThat(item.getStatus()).isEqualTo(InventoryStatus.SERVICE_DUE);
    }
}
