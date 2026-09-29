-- Mess menu: a weekly menu a PG or hostel repeats every week, shown to residents once the
-- property switches the MESS module on (property_module_tbl).

-- Meal slots each property defines for itself (Breakfast, Lunch, Bed tea, ...), in display order.
-- Names are unique per property, but that is checked in the service: renaming two slots in one
-- save would briefly collide on a unique key, and the ai_ci collation would also treat "Café" as "Cafe".
CREATE TABLE mess_meal_slot_tbl (
    id VARCHAR(36) NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    name VARCHAR(40) NOT NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    sort_order INT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_mess_meal_slot_property (property_id),
    CONSTRAINT fk_mess_meal_slot_property FOREIGN KEY (property_id) REFERENCES property_tbl (id) ON DELETE CASCADE,
    CONSTRAINT chk_mess_meal_slot_time CHECK (
        (start_time IS NULL AND end_time IS NULL)
        OR (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- What is served in a slot on a day of the week; a slot's items go with it
CREATE TABLE mess_menu_item_tbl (
    id VARCHAR(36) NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    slot_id VARCHAR(36) NOT NULL,
    day_of_week VARCHAR(9) NOT NULL,
    name VARCHAR(80) NOT NULL,
    diet_type VARCHAR(8) NULL,
    sort_order INT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_mess_menu_item_property_day (property_id, day_of_week),
    CONSTRAINT fk_mess_menu_item_property FOREIGN KEY (property_id) REFERENCES property_tbl (id) ON DELETE CASCADE,
    CONSTRAINT fk_mess_menu_item_slot FOREIGN KEY (slot_id) REFERENCES mess_meal_slot_tbl (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A short note for one day of the week, e.g. "Sunday special" or "Mess closed for Diwali"
CREATE TABLE mess_day_note_tbl (
    id VARCHAR(36) NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    day_of_week VARCHAR(9) NOT NULL,
    note VARCHAR(200) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_mess_day_note_property_day (property_id, day_of_week),
    CONSTRAINT fk_mess_day_note_property FOREIGN KEY (property_id) REFERENCES property_tbl (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Staff permissions (see StaffPermission). Custom-access grants resolve through permission_tbl,
-- so a code missing here would be dropped silently when an owner grants it.
INSERT INTO permission_tbl (id, code, description)
SELECT UUID(), c.code, c.description
FROM (
    SELECT 'MESS_VIEW' AS code, 'View the weekly mess menu' AS description
    UNION ALL SELECT 'MESS_MANAGE', 'Turn the mess menu on or off and edit meals and meal times'
) c
WHERE NOT EXISTS (SELECT 1 FROM permission_tbl p WHERE p.code = c.code);
