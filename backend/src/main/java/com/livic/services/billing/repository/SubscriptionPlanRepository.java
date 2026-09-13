package com.livic.services.billing.repository;

import com.livic.services.billing.domain.SubscriptionPlanTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlanTbl, UUID> {

    Optional<SubscriptionPlanTbl> findByPlanKey(String planKey);

    List<SubscriptionPlanTbl> findByIsActiveTrue();

    @Query("SELECT p FROM SubscriptionPlanTbl p WHERE p.isActive = true ORDER BY p.priceMonthly ASC")
    List<SubscriptionPlanTbl> findAllActivePlans();
}
