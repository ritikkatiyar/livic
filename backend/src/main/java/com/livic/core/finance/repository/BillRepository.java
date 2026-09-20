package com.livic.core.finance.repository;

import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.domain.BillTbl;
import com.livic.core.finance.domain.BillType;
import com.livic.core.finance.dto.DefaulterRecordDTO;
import com.livic.core.finance.dto.RevenueMetricsDTO;
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

/**
 * Bills are found through their payer, never through a lease. An owner's maintenance bill has
 * no lease at all, and the rental vertical reaches its own bills by resolving lease to member
 * first.
 */
@Repository
public interface BillRepository extends JpaRepository<BillTbl, UUID>, JpaSpecificationExecutor<BillTbl> {

    Optional<BillTbl> findByMemberIdAndBillingMonthAndBillType(UUID memberId, String billingMonth, BillType billType);

    List<BillTbl> findByMemberId(UUID memberId);

    List<BillTbl> findByBillingMonth(String billingMonth);

    List<BillTbl> findByMemberIdInAndBillingMonth(Collection<UUID> memberIds, String billingMonth);

    List<BillTbl> findByPropertyIdAndBillingMonth(UUID propertyId, String billingMonth);

    @Query("SELECT new com.livic.core.finance.dto.RevenueMetricsDTO(" +
           "COALESCE(SUM(b.totalAmount), 0), " +
           "COALESCE(SUM(CASE WHEN b.status = :statusPaid THEN b.totalAmount ELSE 0 END), 0)) " +
           "FROM BillTbl b " +
           "WHERE b.propertyId IN :propertyIds AND b.billingMonth = :billingMonth")
    RevenueMetricsDTO calculateRevenueMetrics(
            @Param("propertyIds") Collection<UUID> propertyIds,
            @Param("billingMonth") String billingMonth,
            @Param("statusPaid") BillStatus statusPaid
    );

    @Query("SELECT " +
           "COALESCE(SUM(b.totalAmount), 0), " +
           "COALESCE(SUM(CASE WHEN b.status = :statusPending THEN 1 ELSE 0 END), 0), " +
           "COALESCE(SUM(CASE WHEN b.status IN (:statusPublished, :statusPaid, :statusOverdue, :statusPartiallyPaid) THEN 1 ELSE 0 END), 0) " +
           "FROM BillTbl b " +
           "WHERE b.propertyId IN :propertyIds AND b.billingMonth = :billingMonth")
    List<Object[]> getRentRollMetrics(
            @Param("propertyIds") Collection<UUID> propertyIds,
            @Param("billingMonth") String billingMonth,
            @Param("statusPending") BillStatus statusPending,
            @Param("statusPublished") BillStatus statusPublished,
            @Param("statusPaid") BillStatus statusPaid,
            @Param("statusOverdue") BillStatus statusOverdue,
            @Param("statusPartiallyPaid") BillStatus statusPartiallyPaid
    );

    @Query(value = "SELECT b FROM BillTbl b " +
           "WHERE b.propertyId IN :propertyIds AND " +
           "(b.status = :statusOverdue OR (b.status = :statusPending AND b.dueDate < :currentDate)) " +
           "ORDER BY b.dueDate ASC",
           countQuery = "SELECT COUNT(b) FROM BillTbl b " +
           "WHERE b.propertyId IN :propertyIds AND " +
           "(b.status = :statusOverdue OR (b.status = :statusPending AND b.dueDate < :currentDate))")
    Page<BillTbl> findDefaulterBills(
            @Param("propertyIds") Collection<UUID> propertyIds,
            @Param("statusOverdue") BillStatus statusOverdue,
            @Param("statusPending") BillStatus statusPending,
            @Param("currentDate") LocalDate currentDate,
            Pageable pageable
    );
}
