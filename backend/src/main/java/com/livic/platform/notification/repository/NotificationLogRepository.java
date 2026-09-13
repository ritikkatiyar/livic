package com.livic.platform.notification.repository;

import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.domain.NotificationLogTbl;
import com.livic.platform.notification.domain.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLogTbl, UUID> {
    List<NotificationLogTbl> findByRecipientId(UUID recipientId);
    List<NotificationLogTbl> findByStatus(NotificationStatus status);
    List<NotificationLogTbl> findByRecipientIdAndChannel(UUID recipientId, NotificationChannel channel);
}
