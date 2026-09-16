-- Flyway Migration V22: landlord-defined visiting hours for marketplace tour requests.
-- A property without a settings row uses the defaults (every day 09:00-20:00, 60-minute slots, Asia/Kolkata),
-- so existing listings keep accepting visits exactly as before.

CREATE TABLE tour_availability_settings_tbl (
    id VARCHAR(36) NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    slot_minutes INT NOT NULL DEFAULT 60,
    min_notice_minutes INT NOT NULL DEFAULT 60,
    booking_window_days INT NOT NULL DEFAULT 14,
    -- NULL = no limit on visitors (pending + approved requests) per slot
    max_visitors_per_slot INT DEFAULT NULL,
    timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    updated_by_user_id VARCHAR(36) DEFAULT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_tour_availability_settings_property (property_id),
    CONSTRAINT fk_tour_availability_settings_property FOREIGN KEY (property_id) REFERENCES property_tbl (id) ON DELETE CASCADE,
    CONSTRAINT chk_tour_availability_slot_minutes CHECK (slot_minutes IN (30, 60)),
    CONSTRAINT chk_tour_availability_max_visitors CHECK (max_visitors_per_slot IS NULL OR max_visitors_per_slot >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Weekly visiting hours; several windows per day are allowed (e.g. 10:00-13:00 and 16:00-19:00).
-- Only used once the property has a settings row.
CREATE TABLE tour_availability_window_tbl (
    id VARCHAR(36) NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    day_of_week VARCHAR(9) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_tour_availability_window_property (property_id, day_of_week),
    CONSTRAINT fk_tour_availability_window_property FOREIGN KEY (property_id) REFERENCES property_tbl (id) ON DELETE CASCADE,
    CONSTRAINT chk_tour_availability_window_range CHECK (start_time < end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dates (or parts of a date) when no visits are offered, e.g. a festival or the landlord being away.
CREATE TABLE tour_blackout_tbl (
    id VARCHAR(36) NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    blackout_date DATE NOT NULL,
    -- Both NULL = the whole day is blocked
    start_time TIME DEFAULT NULL,
    end_time TIME DEFAULT NULL,
    reason VARCHAR(200) DEFAULT NULL,
    created_by_user_id VARCHAR(36) DEFAULT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_tour_blackout_property_date (property_id, blackout_date),
    CONSTRAINT fk_tour_blackout_property FOREIGN KEY (property_id) REFERENCES property_tbl (id) ON DELETE CASCADE,
    CONSTRAINT chk_tour_blackout_range CHECK (
        (start_time IS NULL AND end_time IS NULL) OR (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
