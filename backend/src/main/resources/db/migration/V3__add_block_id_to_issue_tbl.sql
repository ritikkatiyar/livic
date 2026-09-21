-- V3__add_block_id_to_issue_tbl.sql
-- Allow tagging issues and maintenance requests to a specific block/tower or common area within a tower.

ALTER TABLE `issue_tbl` ADD COLUMN `block_id` varchar(36) DEFAULT NULL AFTER `property_id`;
ALTER TABLE `issue_tbl` ADD CONSTRAINT `fk_issue_block` FOREIGN KEY (`block_id`) REFERENCES `block_tbl` (`id`) ON DELETE SET NULL;
CREATE INDEX `idx_issue_block` ON `issue_tbl` (`block_id`);
