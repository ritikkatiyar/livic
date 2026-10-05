-- People sign up themselves; a landlord or a building finds them by phone and adds them. For that,
-- a phone number must be stored one way, E.164 (+<country code><number>), so that 98765 43210,
-- 098765-43210 and +91 98765 43210 are the same person.
--
-- Only values that are clearly phone numbers are rewritten, and never onto a number another account
-- already has; anything else is left as it is (lookups normalize what is typed, so it just won't match).

UPDATE user_tbl SET phone_number = NULL WHERE TRIM(phone_number) = '';

-- +<digits>, written with spaces, dashes or brackets
UPDATE user_tbl u
LEFT JOIN (SELECT phone_number AS taken FROM user_tbl WHERE phone_number IS NOT NULL) t
       ON t.taken = CONCAT('+', REGEXP_REPLACE(u.phone_number, '[^0-9]', ''))
SET u.phone_number = CONCAT('+', REGEXP_REPLACE(u.phone_number, '[^0-9]', ''))
WHERE u.phone_number REGEXP '^[+][0-9 ()-]+$'
  AND u.phone_number <> CONCAT('+', REGEXP_REPLACE(u.phone_number, '[^0-9]', ''))
  AND t.taken IS NULL;

-- A 10-digit number is Indian
UPDATE user_tbl u
LEFT JOIN (SELECT phone_number AS taken FROM user_tbl WHERE phone_number IS NOT NULL) t
       ON t.taken = CONCAT('+91', REGEXP_REPLACE(u.phone_number, '[^0-9]', ''))
SET u.phone_number = CONCAT('+91', REGEXP_REPLACE(u.phone_number, '[^0-9]', ''))
WHERE u.phone_number REGEXP '^[0-9 ()-]+$'
  AND CHAR_LENGTH(REGEXP_REPLACE(u.phone_number, '[^0-9]', '')) = 10
  AND t.taken IS NULL;

-- 0 followed by 10 digits: the national trunk prefix
UPDATE user_tbl u
LEFT JOIN (SELECT phone_number AS taken FROM user_tbl WHERE phone_number IS NOT NULL) t
       ON t.taken = CONCAT('+91', SUBSTRING(REGEXP_REPLACE(u.phone_number, '[^0-9]', ''), 2))
SET u.phone_number = CONCAT('+91', SUBSTRING(REGEXP_REPLACE(u.phone_number, '[^0-9]', ''), 2))
WHERE u.phone_number REGEXP '^[0-9 ()-]+$'
  AND CHAR_LENGTH(REGEXP_REPLACE(u.phone_number, '[^0-9]', '')) = 11
  AND REGEXP_REPLACE(u.phone_number, '[^0-9]', '') LIKE '0%'
  AND t.taken IS NULL;

-- 91 followed by 10 digits, written without the plus
UPDATE user_tbl u
LEFT JOIN (SELECT phone_number AS taken FROM user_tbl WHERE phone_number IS NOT NULL) t
       ON t.taken = CONCAT('+', REGEXP_REPLACE(u.phone_number, '[^0-9]', ''))
SET u.phone_number = CONCAT('+', REGEXP_REPLACE(u.phone_number, '[^0-9]', ''))
WHERE u.phone_number REGEXP '^[0-9 ()-]+$'
  AND CHAR_LENGTH(REGEXP_REPLACE(u.phone_number, '[^0-9]', '')) = 12
  AND REGEXP_REPLACE(u.phone_number, '[^0-9]', '') LIKE '91%'
  AND t.taken IS NULL;

-- The same unique index existed twice.
ALTER TABLE user_tbl DROP INDEX uk_user_tbl_phone_number;

-- When the number was last confirmed by a code sent to it. Nothing requires it yet; it is cleared
-- whenever the number changes, and shown next to search results.
ALTER TABLE user_tbl ADD COLUMN phone_verified_at DATETIME(6) NULL;

-- Every unit member is a person with an account: owners sign up first, like tenants. Nothing was
-- ever stored as an invitation by phone.
ALTER TABLE unit_member_tbl MODIFY user_id VARCHAR(36) NOT NULL;
ALTER TABLE unit_member_tbl DROP COLUMN invited_phone;
