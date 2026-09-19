-- Core model, slice 1: units live in a block, so a society can have Tower A and Tower B.
-- Rental and residential properties get one hidden default block. property_type already exists (V19).

CREATE TABLE `block_tbl` (
    `id` VARCHAR(36) NOT NULL,
    `property_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    `is_default` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_block_property_name` (`property_id`, `name`),
    KEY `idx_block_property_id` (`property_id`),
    CONSTRAINT `fk_block_property` FOREIGN KEY (`property_id`) REFERENCES `property_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- One default block per existing property, so every unit has somewhere to live.
INSERT INTO `block_tbl` (`id`, `property_id`, `name`, `sort_order`, `is_default`)
SELECT UUID(), p.`id`, 'Main', 0, 1
FROM `property_tbl` p;

ALTER TABLE `unit_tbl`
    ADD COLUMN `block_id` VARCHAR(36) NULL AFTER `property_id`;

UPDATE `unit_tbl` u
    JOIN `block_tbl` b ON b.`property_id` = u.`property_id` AND b.`is_default` = 1
SET u.`block_id` = b.`id`;

ALTER TABLE `unit_tbl`
    MODIFY COLUMN `block_id` VARCHAR(36) NOT NULL,
    ADD CONSTRAINT `fk_unit_block` FOREIGN KEY (`block_id`) REFERENCES `block_tbl` (`id`) ON DELETE RESTRICT;

-- Unit numbers repeat across towers (A-101 and B-101), so they are unique per block, not per property.
ALTER TABLE `unit_tbl`
    DROP INDEX `uk_unit_tbl_property_unit_number`,
    ADD UNIQUE KEY `uk_unit_block_unit_number` (`block_id`, `unit_number`);
