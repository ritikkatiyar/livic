-- The lease points at the member, not the member at the lease (decision D16). A core table must
-- not reference a vertical's: unit members, the ledger and issues are core, the lease is rental's.
-- Rental now keeps the link on its own side, and core never learns that a lease exists.

ALTER TABLE `lease_tbl` ADD COLUMN `member_id` varchar(36) NULL AFTER `unit_id`;

-- Prefer the active member when a lease ever had more than one row.
UPDATE `lease_tbl` l JOIN `unit_member_tbl` m ON m.`lease_id` = l.`id` AND m.`is_active` = 1
SET l.`member_id` = m.`id`;
UPDATE `lease_tbl` l JOIN `unit_member_tbl` m ON m.`lease_id` = l.`id`
SET l.`member_id` = m.`id`
WHERE l.`member_id` IS NULL;

-- A lease older than unit members gets its tenant member now, so every lease has one.
INSERT INTO `unit_member_tbl` (`id`, `unit_id`, `user_id`, `role`, `is_primary`, `lease_id`, `from_date`, `to_date`, `is_active`)
SELECT UUID(), l.`unit_id`, l.`user_id`, 'TENANT', 1, l.`id`, l.`move_in_date`,
       CASE WHEN l.`status` = 'ENDED' THEN COALESCE(l.`move_out_date`, CURRENT_DATE) END,
       l.`status` = 'ACTIVE'
FROM `lease_tbl` l
WHERE l.`member_id` IS NULL;
UPDATE `lease_tbl` l JOIN `unit_member_tbl` m ON m.`lease_id` = l.`id`
SET l.`member_id` = m.`id`
WHERE l.`member_id` IS NULL;

ALTER TABLE `lease_tbl`
    MODIFY `member_id` varchar(36) NOT NULL,
    ADD KEY `idx_lease_member` (`member_id`),
    ADD CONSTRAINT `fk_lease_member` FOREIGN KEY (`member_id`) REFERENCES `unit_member_tbl` (`id`) ON DELETE RESTRICT;

-- Core loses every reference to the lease.
ALTER TABLE `unit_member_tbl` DROP FOREIGN KEY `fk_unit_member_lease`;
ALTER TABLE `unit_member_tbl` DROP INDEX `idx_unit_member_lease`, DROP COLUMN `lease_id`;

ALTER TABLE `finance_ledger_tbl` DROP FOREIGN KEY `fk_ledger_lease`;
ALTER TABLE `finance_ledger_tbl` DROP INDEX `fk_ledger_lease`, DROP COLUMN `lease_id`;

ALTER TABLE `issue_tbl` DROP COLUMN `lease_id`;
