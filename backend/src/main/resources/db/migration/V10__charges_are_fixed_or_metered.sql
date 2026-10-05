-- Bills and charges are core: they serve rental, residential and society alike, so they no
-- longer name rent or sort charges into categories. A charge is a name, fixed or metered, and a
-- rate; a bill line is a description and a signed amount, and the bill's total is their sum.

-- Rent was a system charge that every rental property got. It now comes from the lease alone,
-- so the charge goes. Bills keep their rent lines, whose amount and description are frozen on
-- the line; the lines just stop pointing at the charge.
UPDATE `bill_line_tbl` SET `charge_config_id` = NULL
WHERE `charge_config_id` IN (SELECT `id` FROM `charge_config_tbl` WHERE `charge_category` = 'RENT');
DELETE FROM `billing_worksheet_entry_tbl`
WHERE `charge_config_id` IN (SELECT `id` FROM `charge_config_tbl` WHERE `charge_category` = 'RENT');
DELETE FROM `meter_reading_tbl`
WHERE `charge_config_id` IN (SELECT `id` FROM `charge_config_tbl` WHERE `charge_category` = 'RENT');
DELETE FROM `charge_config_tbl` WHERE `charge_category` = 'RENT';

-- A discount was stored positive and subtracted because of its type. The sign now carries it,
-- so existing discounts turn negative and every bill's total stays what it was.
UPDATE `bill_line_tbl` SET `amount` = -`amount` WHERE `charge_type` = 'DISCOUNT' AND `amount` > 0;
UPDATE `billing_worksheet_entry_tbl` SET `entered_value` = -`entered_value`
WHERE `entered_value` > 0
  AND `charge_config_id` IN (SELECT `id` FROM `charge_config_tbl` WHERE `charge_category` = 'DISCOUNT');
UPDATE `charge_config_tbl` SET `base_rate` = -`base_rate` WHERE `charge_category` = 'DISCOUNT' AND `base_rate` > 0;

-- Only the rent charge was ever system-required.
ALTER TABLE `charge_config_tbl` DROP COLUMN `charge_category`, DROP COLUMN `is_system_required`;
ALTER TABLE `bill_line_tbl` DROP COLUMN `charge_type`;

-- Bills, not rent: the permissions and the plan feature say so.
UPDATE `permission_tbl` SET `code` = 'BILL_VIEW', `description` = 'View bills and invoices' WHERE `code` = 'RENT_ROLL_VIEW';
UPDATE `permission_tbl` SET `code` = 'BILL_MANAGE', `description` = 'Generate, publish and record payments for bills' WHERE `code` = 'RENT_ROLL_MANAGE';
UPDATE `property_join_code_permission_tbl` SET `permission_code` = 'BILL_VIEW' WHERE `permission_code` = 'RENT_ROLL_VIEW';
UPDATE `property_join_code_permission_tbl` SET `permission_code` = 'BILL_MANAGE' WHERE `permission_code` = 'RENT_ROLL_MANAGE';
UPDATE `plan_feature_limit_tbl` SET `feature_key` = 'BATCH_BILL_GENERATION' WHERE `feature_key` = 'BATCH_RENT_GENERATION';
