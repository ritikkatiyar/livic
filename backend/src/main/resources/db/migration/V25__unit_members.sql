-- Core model, slice 2: one record of who belongs to a unit, whatever their relationship to it.
-- Tenants come from leases today; owners and family members arrive with residential and society.
-- Everything that needs "who is in this flat" (notices, issues, resident context, live listings)
-- reads this table instead of reaching into leases.

CREATE TABLE `unit_member_tbl` (
    `id` VARCHAR(36) NOT NULL,
    `unit_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `role` VARCHAR(20) NOT NULL,
    `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
    `lease_id` VARCHAR(36) NULL,
    `invited_phone` VARCHAR(20) NULL,
    `from_date` DATE NOT NULL,
    `to_date` DATE NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `assigned_by_id` VARCHAR(36) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    KEY `idx_unit_member_unit_active` (`unit_id`, `is_active`),
    KEY `idx_unit_member_user_active` (`user_id`, `is_active`),
    KEY `idx_unit_member_lease` (`lease_id`),
    CONSTRAINT `fk_unit_member_unit` FOREIGN KEY (`unit_id`) REFERENCES `unit_tbl` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_unit_member_user` FOREIGN KEY (`user_id`) REFERENCES `user_tbl` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_unit_member_lease` FOREIGN KEY (`lease_id`) REFERENCES `lease_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Every existing lease becomes a tenant member, ended leases included, so history is kept.
INSERT INTO `unit_member_tbl`
    (`id`, `unit_id`, `user_id`, `role`, `is_primary`, `lease_id`, `from_date`, `to_date`, `is_active`, `created_at`)
SELECT UUID(), l.`unit_id`, l.`user_id`, 'TENANT', 1, l.`id`, l.`move_in_date`, l.`move_out_date`,
       CASE WHEN l.`status` = 'ACTIVE' THEN 1 ELSE 0 END, l.`created_at`
FROM `lease_tbl` l;
