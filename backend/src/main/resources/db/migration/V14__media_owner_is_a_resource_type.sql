-- A file's owner is now the name of the resource type it is attached to, declared by the module
-- that owns that type. Inventory items were stored under the module name; the type is INVENTORY_ITEM.
UPDATE media_asset_tbl SET owner_module = 'INVENTORY_ITEM' WHERE owner_module = 'INVENTORY';
