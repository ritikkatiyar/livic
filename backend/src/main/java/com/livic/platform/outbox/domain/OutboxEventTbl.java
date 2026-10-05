package com.livic.platform.outbox.domain;

import com.livic.platform.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** One event waiting for one consumer. Written in the publisher's transaction, so it exists only if that commits. */
@Entity
@Table(name = "outbox_event_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboxEventTbl extends BaseEntity {

    @Column(name = "event_type", nullable = false, length = 200)
    private String eventType;

    @Column(name = "consumer", nullable = false, length = 100)
    private String consumer;

    @Column(name = "payload", nullable = false, columnDefinition = "json")
    private String payload;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OutboxStatus status;

    @Column(name = "attempts", nullable = false)
    private int attempts;

    @Column(name = "next_attempt_at", nullable = false)
    private LocalDateTime nextAttemptAt;

    @Column(name = "last_error", length = 1000)
    private String lastError;
}
