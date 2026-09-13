package com.livic.services.finance.repository;

import com.livic.services.finance.domain.RentCycleStatus;
import com.livic.services.finance.domain.RentCycleTbl;
import com.livic.services.finance.dto.DefaulterRecordDTO;
import com.livic.services.finance.dto.RevenueMetricsDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RentCycleRepository extends JpaRepository<RentCycleTbl, UUID>, JpaSpecificationExecutor<RentCycleTbl> {
    Optional<RentCycleTbl> findByLease_IdAndBillingMonth(UUID leaseId, String billingMonth);

    List<RentCycleTbl> findByLease_Id(UUID leaseId);

    List<RentCycleTbl> findByBillingMonth(String billingMonth);

    List<RentCycleTbl> findByLease_IdInAndBillingMonth(Collection<UUID> leaseIds, String billingMonth);

    @Query("SELECT new com.livic.services.finance.dto.RevenueMetricsDTO(" +
           "COALESCE(SUM(r.totalAmount), 0), " +
           "COALESCE(SUM(CASE WHEN r.status = :statusPaid THEN r.totalAmount ELSE 0 END), 0)) " +
           "FROM RentCycleTbl r " +
           "WHERE r.lease.id IN :leaseIds AND r.billingMonth = :billingMonth")
    RevenueMetricsDTO calculateRevenueMetrics(
            @Param("leaseIds") Collection<UUID> leaseIds,
            @Param("billingMonth") String billingMonth,
            @Param("statusPaid") RentCycleStatus statusPaid
    );

    @Query("SELECT " +
           "COALESCE(SUM(r.totalAmount), 0), " +
           "COALESCE(SUM(CASE WHEN r.status = :statusPending THEN 1 ELSE 0 END), 0), " +
           "COALESCE(SUM(CASE WHEN r.status IN (:statusPublished, :statusPaid, :statusOverdue, :statusPartiallyPaid) THEN 1 ELSE 0 END), 0) " +
           "FROM RentCycleTbl r " +
           "WHERE r.lease.id IN :leaseIds AND r.billingMonth = :billingMonth")
    List<Object[]> getRentRollMetrics(
            @Param("leaseIds") Collection<UUID> leaseIds,
            @Param("billingMonth") String billingMonth,
            @Param("statusPending") RentCycleStatus statusPending,
            @Param("statusPublished") RentCycleStatus statusPublished,
            @Param("statusPaid") RentCycleStatus statusPaid,
            @Param("statusOverdue") RentCycleStatus statusOverdue,
            @Param("statusPartiallyPaid") RentCycleStatus statusPartiallyPaid
    );

    @Query(value = "SELECT r FROM RentCycleTbl r " +
           "WHERE r.lease.id IN :leaseIds AND " +
           "(r.status = :statusOverdue OR (r.status = :statusPending AND r.dueDate < :currentDate)) " +
           "ORDER BY r.dueDate ASC",
           countQuery = "SELECT COUNT(r) FROM RentCycleTbl r " +
           "WHERE r.lease.id IN :leaseIds AND " +
           "(r.status = :statusOverdue OR (r.status = :statusPending AND r.dueDate < :currentDate))")
    Page<RentCycleTbl> findDefaulterCycles(
            @Param("leaseIds") Collection<UUID> leaseIds,
            @Param("statusOverdue") RentCycleStatus statusOverdue,
            @Param("statusPending") RentCycleStatus statusPending,
            @Param("currentDate") LocalDate currentDate,
            Pageable pageable
    );
}
