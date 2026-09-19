package com.livic.core.finance.domain;

import com.livic.platform.common.domain.BaseEntity;
import com.livic.platform.common.domain.LeaseStatus;
import com.livic.platform.common.domain.LeaseSplitStrategy;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "lease_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaseTbl extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "unit_id", nullable = false)
    private UUID unitId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaseStatus status;

    @Column(name = "move_in_date", nullable = false)
    private LocalDate moveInDate;

    @Column(name = "move_out_date")
    private LocalDate moveOutDate;

    @Column(name = "monthly_rent_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal monthlyRentAmount;

    @Column(name = "security_deposit", nullable = false, precision = 10, scale = 2)
    private BigDecimal securityDeposit;

    @Enumerated(EnumType.STRING)
    @Column(name = "split_strategy", nullable = false, length = 50)
    private LeaseSplitStrategy splitStrategy;
}
