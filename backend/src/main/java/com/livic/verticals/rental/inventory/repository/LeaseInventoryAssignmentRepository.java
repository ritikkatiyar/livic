package com.livic.verticals.rental.inventory.repository;

import com.livic.verticals.rental.inventory.domain.LeaseInventoryAssignmentTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaseInventoryAssignmentRepository extends JpaRepository<LeaseInventoryAssignmentTbl, UUID> {

    List<LeaseInventoryAssignmentTbl> findAllByLeaseId(UUID leaseId);

    Page<LeaseInventoryAssignmentTbl> findAllByLeaseId(UUID leaseId, Pageable pageable);

    long countByLeaseId(UUID leaseId);

    List<LeaseInventoryAssignmentTbl> findAllByLeaseIdIn(Collection<UUID> leaseIds);

    Page<LeaseInventoryAssignmentTbl> findAllByItemId(UUID itemId, Pageable pageable);

    @Query("SELECT a FROM LeaseInventoryAssignmentTbl a WHERE a.itemId = :itemId AND a.returnedAt IS NULL")
    Optional<LeaseInventoryAssignmentTbl> findActiveAssignmentByItemId(@Param("itemId") UUID itemId);

    @Query("SELECT a FROM LeaseInventoryAssignmentTbl a WHERE a.itemId IN :itemIds AND a.returnedAt IS NULL")
    List<LeaseInventoryAssignmentTbl> findActiveAssignmentsByItemIds(@Param("itemIds") Collection<UUID> itemIds);

    @Query("SELECT a FROM LeaseInventoryAssignmentTbl a WHERE a.leaseId = :leaseId AND a.returnedAt IS NULL")
    List<LeaseInventoryAssignmentTbl> findActiveAssignmentsByLeaseId(@Param("leaseId") UUID leaseId);

    boolean existsByItemIdAndReturnedAtIsNull(UUID itemId);

    boolean existsByLeaseIdAndItemIdAndReturnedAtIsNull(UUID leaseId, UUID itemId);
}
