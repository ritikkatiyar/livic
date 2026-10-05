-- Worksheet entries are now also created when bills are generated, including by the monthly
-- billing job, where no user is acting. The job used to fill created_by with a random UUID.
ALTER TABLE `billing_worksheet_entry_tbl` MODIFY `created_by` varchar(36) NULL;
