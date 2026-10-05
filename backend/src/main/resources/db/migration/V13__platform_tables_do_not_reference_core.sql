-- Platform must not depend on core, in the schema as in the code. A membership (platform auth)
-- is scoped to a property (core), so property_id stays as a plain id. Deleting a property
-- already removes its memberships in code, before the property row goes; the cascade was a
-- second, hidden path for the same thing.
ALTER TABLE `membership_tbl` DROP FOREIGN KEY `fk_membership_property`;
