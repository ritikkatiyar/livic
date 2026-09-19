package com.livic.core.community.announcement.repository;

import com.livic.core.community.announcement.domain.AnnouncementReceiptTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnnouncementReceiptRepository extends JpaRepository<AnnouncementReceiptTbl, UUID> {

    Optional<AnnouncementReceiptTbl> findByAnnouncementIdAndUserId(UUID announcementId, UUID userId);

    boolean existsByAnnouncementIdAndUserId(UUID announcementId, UUID userId);

    List<AnnouncementReceiptTbl> findByUserIdAndAnnouncementIdIn(UUID userId, Collection<UUID> announcementIds);

    long countByAnnouncementId(UUID announcementId);

    @Query("SELECT r.announcement.id, COUNT(r) FROM AnnouncementReceiptTbl r WHERE r.announcement.id IN :announcementIds GROUP BY r.announcement.id")
    List<Object[]> countReceiptsByAnnouncementIdIn(@Param("announcementIds") Collection<UUID> announcementIds);
}
