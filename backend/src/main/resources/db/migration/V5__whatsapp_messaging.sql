-- WhatsApp messaging: prospect opt-in and per-property channel choice for tour messages

-- Meta requires opt-in before a business sends WhatsApp messages
ALTER TABLE marketplace_lead_tbl
    ADD COLUMN whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN whatsapp_opt_in_at DATETIME(6) NULL;

-- Which channels a property uses for each tour message; no row means every channel is on
CREATE TABLE tour_message_settings_tbl (
    id VARCHAR(36) NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    decision_sms BOOLEAN NOT NULL,
    decision_whatsapp BOOLEAN NOT NULL,
    reminder_sms BOOLEAN NOT NULL,
    reminder_whatsapp BOOLEAN NOT NULL,
    updated_by_user_id VARCHAR(36) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_tour_message_settings_property (property_id),
    CONSTRAINT fk_tour_message_settings_property FOREIGN KEY (property_id) REFERENCES property_tbl (id) ON DELETE CASCADE
);
