-- Flyway Migration V16: Tour request lifecycle (landlord approve/reject, prospect cancel) and one active tour per phone per property

ALTER TABLE marketplace_lead_tbl
    ADD COLUMN decision_note VARCHAR(500) DEFAULT NULL,
    ADD COLUMN decided_by_user_id VARCHAR(36) DEFAULT NULL,
    ADD COLUMN decided_at DATETIME(6) DEFAULT NULL,
    ADD COLUMN cancelled_at DATETIME(6) DEFAULT NULL,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- Non-NULL only while a tour request is active (NEW = pending, APPROVED). The unique index therefore allows any number of
-- closed requests but at most one active request per phone per property, even under concurrent submissions.
-- Past-dated active rows are closed by the application (on create and by a scheduled job) so they stop blocking.
-- VIRTUAL, not STORED: MySQL rejects a stored generated column over property_id because its foreign key cascades on delete.
ALTER TABLE marketplace_lead_tbl
    ADD COLUMN active_tour_key VARCHAR(80) GENERATED ALWAYS AS (
        CASE
            WHEN lead_type = 'TOUR_REQUEST' AND status IN ('NEW', 'APPROVED') THEN CONCAT(property_id, ':', prospect_phone)
            ELSE NULL
        END
    ) VIRTUAL,
    ADD UNIQUE KEY uq_marketplace_lead_active_tour (active_tour_key),
    ADD KEY idx_marketplace_lead_property_tours (property_id, lead_type, status, preferred_slot);
