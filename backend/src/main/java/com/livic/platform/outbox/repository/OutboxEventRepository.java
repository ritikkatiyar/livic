package com.livic.platform.outbox.repository;

import com.livic.platform.outbox.domain.OutboxEventTbl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEventTbl, UUID> {

    /**
     * Claims a pending row for delivery. A row another instance or thread is delivering is skipped,
     * not waited for, so each row is handled once.
     */
    @Query(value = "SELECT * FROM outbox_event_tbl WHERE id = :id AND status = 'PENDING' FOR UPDATE SKIP LOCKED",
            nativeQuery = true)
    Optional<OutboxEventTbl> claim(@Param("id") String id);

    @Query("SELECT e.id FROM OutboxEventTbl e WHERE e.status = com.livic.platform.outbox.domain.OutboxStatus.PENDING"
            + " AND e.nextAttemptAt <= :now ORDER BY e.nextAttemptAt")
    List<UUID> findDueIds(@Param("now") LocalDateTime now, Pageable pageable);

    @Modifying
    @Query("DELETE FROM OutboxEventTbl e WHERE e.status = com.livic.platform.outbox.domain.OutboxStatus.DONE"
            + " AND e.updatedAt < :before")
    int deleteDoneBefore(@Param("before") LocalDateTime before);
}
