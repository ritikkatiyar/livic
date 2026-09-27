-- Billing history must survive a unit being deleted.
--
-- Deleting a unit cascaded into unit_member_tbl, which cascaded into bill_tbl, so removing a
-- unit destroyed its members' bills. Rental was protected only by accident: lease_tbl.unit_id
-- is RESTRICT, so a unit with a tenant could not be deleted at all. An owner has no lease, so
-- nothing restricted deleting their unit -- and a building admin redrawing a floor layout
-- would have silently erased that owner's maintenance bills. Residential is exactly the case
-- the accidental shield did not cover.
--
-- These become RESTRICT so the database refuses rather than deletes. The service layer also
-- guards on active members, which is what produces a readable message; this is the backstop
-- for any future writer that forgets.

ALTER TABLE `bill_tbl`
    DROP FOREIGN KEY `fk_bill_member`;
ALTER TABLE `bill_tbl`
    ADD CONSTRAINT `fk_bill_member` FOREIGN KEY (`member_id`)
        REFERENCES `unit_member_tbl` (`id`) ON DELETE RESTRICT;

-- The ledger kept its row but lost the payer, which for a financial record is its own kind of
-- data loss: the entry survives with no way to attribute it.
ALTER TABLE `finance_ledger_tbl`
    DROP FOREIGN KEY `fk_ledger_member`;
ALTER TABLE `finance_ledger_tbl`
    ADD CONSTRAINT `fk_ledger_member` FOREIGN KEY (`member_id`)
        REFERENCES `unit_member_tbl` (`id`) ON DELETE RESTRICT;

-- A member row is history once it has ended, so a unit delete must not take it either.
ALTER TABLE `unit_member_tbl`
    DROP FOREIGN KEY `fk_unit_member_unit`;
ALTER TABLE `unit_member_tbl`
    ADD CONSTRAINT `fk_unit_member_unit` FOREIGN KEY (`unit_id`)
        REFERENCES `unit_tbl` (`id`) ON DELETE RESTRICT;
