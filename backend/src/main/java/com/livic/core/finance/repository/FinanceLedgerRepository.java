package com.livic.core.finance.repository;

import com.livic.core.finance.domain.FinanceLedgerTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;

@Repository
public interface FinanceLedgerRepository extends JpaRepository<FinanceLedgerTbl, UUID>, JpaSpecificationExecutor<FinanceLedgerTbl> {
    
    @Query("SELECT COALESCE(SUM(l.amount), 0) FROM FinanceLedgerTbl l WHERE l.memberId = :memberId AND (l.createdAt < :createdAt OR (l.createdAt = :createdAt AND l.id <= :id))")
    BigDecimal getRunningBalanceForMemberAtEntry(@Param("memberId") UUID memberId, @Param("createdAt") LocalDateTime createdAt, @Param("id") UUID id);

    @Query("SELECT l.id, COALESCE((SELECT SUM(l2.amount) FROM FinanceLedgerTbl l2 WHERE l2.memberId = l.memberId AND (l2.createdAt < l.createdAt OR (l2.createdAt = l.createdAt AND l2.id <= l.id))), 0) FROM FinanceLedgerTbl l WHERE l.id IN :ids")
    List<Object[]> getRunningBalancesForEntries(@Param("ids") java.util.Collection<UUID> ids);

    @Query("SELECT COALESCE(SUM(l.amount), 0) FROM FinanceLedgerTbl l WHERE l.memberId = :memberId")
    BigDecimal sumAmountByMemberId(@Param("memberId") UUID memberId);
}
