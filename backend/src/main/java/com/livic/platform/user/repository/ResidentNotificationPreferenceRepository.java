package com.livic.platform.user.repository;

import com.livic.platform.user.domain.ResidentNotificationPreferenceTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResidentNotificationPreferenceRepository extends JpaRepository<ResidentNotificationPreferenceTbl, UUID> {
    Optional<ResidentNotificationPreferenceTbl> findByUserId(UUID userId);
}
