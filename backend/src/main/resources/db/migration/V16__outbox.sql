-- Events waiting for their consumers, one row per consumer. A row is written in the publisher's
-- transaction, so it exists only if that commits, and is delivered after it (see OutboxDelivery).
CREATE TABLE outbox_event_tbl (
    id VARCHAR(36) NOT NULL,
    event_type VARCHAR(200) NOT NULL,
    consumer VARCHAR(100) NOT NULL,
    payload JSON NOT NULL,
    status VARCHAR(20) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    next_attempt_at DATETIME(6) NOT NULL,
    last_error VARCHAR(1000) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_outbox_due (status, next_attempt_at)
);
