-- Flyway Migration V19: Create Marketplace Schema for public rental listings, leads, OTP verification & QR links
-- Property amenities live in property_amenities_tbl (V10); unit amenities are stored as JSON on unit_tbl.

ALTER TABLE property_tbl
    ADD COLUMN property_type VARCHAR(32) NOT NULL DEFAULT 'RENTAL',
    ADD COLUMN is_publicly_listed TINYINT(1) NOT NULL DEFAULT 1,
    ADD COLUMN description TEXT DEFAULT NULL,
    ADD COLUMN qr_slug VARCHAR(64) UNIQUE DEFAULT NULL;

ALTER TABLE unit_tbl
    ADD COLUMN base_price DECIMAL(12,2) DEFAULT NULL,
    ADD COLUMN is_bookable TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN description TEXT DEFAULT NULL,
    ADD COLUMN amenities JSON DEFAULT NULL;

CREATE TABLE marketplace_lead_tbl (
    id VARCHAR(36) NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    unit_id VARCHAR(36) NOT NULL,
    lead_type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'NEW',
    prospect_name VARCHAR(255) NOT NULL,
    prospect_phone VARCHAR(20) NOT NULL,
    prospect_email VARCHAR(255) DEFAULT NULL,
    preferred_slot DATETIME(6) DEFAULT NULL,
    expected_move_in_date DATE DEFAULT NULL,
    token_amount DECIMAL(12,2) DEFAULT NULL,
    payment_transaction_id VARCHAR(36) DEFAULT NULL,
    converted_unit_booking_id VARCHAR(36) DEFAULT NULL,
    source VARCHAR(32) DEFAULT 'MARKETPLACE',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_marketplace_lead_property (property_id),
    KEY idx_marketplace_lead_unit (unit_id),
    KEY idx_marketplace_lead_phone (prospect_phone),
    KEY idx_marketplace_lead_status (status),
    CONSTRAINT fk_marketplace_lead_property FOREIGN KEY (property_id) REFERENCES property_tbl (id) ON DELETE CASCADE,
    CONSTRAINT fk_marketplace_lead_unit FOREIGN KEY (unit_id) REFERENCES unit_tbl (id) ON DELETE CASCADE,
    CONSTRAINT fk_marketplace_lead_payment FOREIGN KEY (payment_transaction_id) REFERENCES payment_transaction_tbl (id) ON DELETE SET NULL,
    CONSTRAINT fk_marketplace_lead_unit_booking FOREIGN KEY (converted_unit_booking_id) REFERENCES unit_booking_tbl (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE otp_verification_tbl (
    id VARCHAR(36) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    otp_code_hash VARCHAR(255) NOT NULL,
    session_token VARCHAR(255) DEFAULT NULL,
    attempts INT NOT NULL DEFAULT 0,
    expires_at DATETIME(6) NOT NULL,
    verified_at DATETIME(6) DEFAULT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_otp_session_token (session_token),
    KEY idx_otp_phone (phone),
    KEY idx_otp_session_token (session_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
