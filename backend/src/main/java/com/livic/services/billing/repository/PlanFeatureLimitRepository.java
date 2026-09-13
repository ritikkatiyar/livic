package com.livic.services.billing.repository;

import com.livic.services.billing.domain.PlanFeatureLimitTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlanFeatureLimitRepository extends JpaRepository<PlanFeatureLimitTbl, UUID> {

    List<PlanFeatureLimitTbl> findByPlanId(String planId);

    List<PlanFeatureLimitTbl> findByPlanIdIn(List<String> planIds);

    Optional<PlanFeatureLimitTbl> findByPlanIdAndFeatureKey(String planId, String featureKey);

    @Query("SELECT pfl FROM PlanFeatureLimitTbl pfl WHERE pfl.planId = :planId AND pfl.featureKey = :featureKey")
    Optional<PlanFeatureLimitTbl> getFeatureLimit(@Param("planId") String planId, @Param("featureKey") String featureKey);
}
