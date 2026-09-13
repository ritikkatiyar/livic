package com.livic.services.billing.domain;

import com.livic.platform.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "plan_feature_limit_tbl", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"plan_id", "feature_key"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanFeatureLimitTbl extends BaseEntity {

    @Column(name = "plan_id", nullable = false, length = 36)
    private String planId;

    @Column(name = "feature_key", nullable = false, length = 100)
    private String featureKey;

    @Column(name = "limit_value", nullable = false)
    private Integer limitValue;
}
