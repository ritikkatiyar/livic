package com.livic.platform.payment.domain;

import com.livic.platform.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_transaction_tbl")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTransactionTbl extends BaseEntity {

    /** Null when the payer has no account yet, e.g. a marketplace prospect paying a booking token. */
    @Column(name = "payer_user_id")
    private UUID payerUserId;

    @Column(name = "payment_method", nullable = false, length = 32)
    private String paymentMethod; // ONLINE, CASH, BANK_TRANSFER

    @Column(name = "reference_type", nullable = false, length = 32)
    private String referenceType; // BILL, SUBSCRIPTION, WALLET_TOPUP, UNIT_BOOKING

    @Column(name = "reference_id", nullable = false)
    private UUID referenceId;

    @Column(name = "gateway_name", length = 50)
    private String gatewayName;

    @Column(name = "gateway_transaction_id", unique = true)
    private String gatewayTransactionId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 32)
    private String status; // INITIATED, PENDING_CONFIRMATION, SUCCESS, FAILED, REJECTED

    @Column(name = "webhook_payload", columnDefinition = "json")
    private String webhookPayload;

    @Column(name = "confirmed_by")
    private UUID confirmedBy;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "note")
    private String note;
}
