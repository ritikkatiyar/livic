package com.livic.platform.subscription.repository;

import com.livic.platform.subscription.domain.SaasSubscriptionTbl;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SaasSubscriptionRepository extends JpaRepository<SaasSubscriptionTbl, UUID> {
    Optional<SaasSubscriptionTbl> findByUserIdAndStatus(UUID userId, String status);

    @EntityGraph(attributePaths = {"plan"})
    Optional<SaasSubscriptionTbl> findFirstByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, String status);

    Optional<SaasSubscriptionTbl> findByUserId(UUID userId);

    @EntityGraph(attributePaths = {"plan"})
    Optional<SaasSubscriptionTbl> findFirstByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<SaasSubscriptionTbl> findByGatewaySubscriptionId(String gatewaySubscriptionId);
}
