package com.livic.platform.payment.domain;

import com.livic.platform.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_webhook_event_tbl")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentWebhookEventTbl extends BaseEntity {

    @Column(name = "gateway_name", nullable = false, length = 50)
    private String gatewayName;

    @Column(name = "gateway_event_id", unique = true, nullable = false)
    private String gatewayEventId;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "payload", nullable = false, columnDefinition = "json")
    private String payload;

    @Column(name = "processed_at", nullable = false)
    private LocalDateTime processedAt;
}
