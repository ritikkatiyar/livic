package com.livic.services.finance.domain;

import com.livic.platform.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "unit_booking_tbl")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnitBookingTbl extends BaseEntity {

    @Column(name = "unit_id", nullable = false)
    private UUID unitId;

    @Column(name = "prospective_tenant_user_id")
    private UUID prospectiveTenantUserId;

    @Column(name = "prospective_tenant_name", nullable = false)
    private String prospectiveTenantName;

    @Column(name = "prospective_tenant_phone", nullable = false, length = 32)
    private String prospectiveTenantPhone;

    @Column(name = "prospective_tenant_email")
    private String prospectiveTenantEmail;

    @Column(name = "token_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal tokenAmount;

    @Column(name = "expected_move_in_date", nullable = false)
    private LocalDate expectedMoveInDate;

    @Column(nullable = false, length = 32)
    private String status; // BOOKED, CONVERTED, FORFEITED, REFUNDED

    @Column(name = "payment_transaction_id")
    private UUID paymentTransactionId;

    @Column(name = "converted_lease_id")
    private UUID convertedLeaseId;
}
