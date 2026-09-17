-- Flyway Migration V20: Marketplace listing seed data (prices, bookability, descriptions and photos)
-- Targets only the demo properties created by V2 (matched by name), so it is a no-op on databases without them.

-- 1. Property descriptions
UPDATE property_tbl
SET description = 'Premium single-occupancy residences on 100 Feet Road, Indiranagar. Fully managed with 24/7 security, power backup and a rooftop pool, a short walk from the metro.'
WHERE name = 'Livic Residency' AND description IS NULL;

UPDATE property_tbl
SET description = CONCAT(name, ' offers comfortable twin-sharing rooms with home-style meals, daily housekeeping and high-speed Wi-Fi. Ideal for students and young professionals.')
WHERE name LIKE 'mom''s pg %' AND description IS NULL;

-- 2. Unit pricing, bookability, descriptions and amenities
-- Livic Residency: single units priced by floor (₹13,000 - ₹17,000); the second unit on each floor is open for instant booking
UPDATE unit_tbl u
JOIN property_tbl p ON p.id = u.property_id
SET u.base_price  = 12000 + (u.floor * 1000),
    u.is_bookable = (u.unit_number LIKE '%2'),
    u.description = CONCAT('Furnished single room on floor ', u.floor, ' with an attached bathroom, wardrobe and study desk.'),
    u.amenities   = JSON_ARRAY('Attached Bathroom', 'Air Conditioning', 'Study Desk', 'Wardrobe')
WHERE p.name = 'Livic Residency' AND u.base_price IS NULL;

-- mom's pg N: twin-sharing units priced by PG number and floor (₹5,900 - ₹8,500); every fifth unit is open for instant booking
UPDATE unit_tbl u
JOIN property_tbl p ON p.id = u.property_id
SET u.base_price  = 5500 + (CAST(SUBSTRING_INDEX(p.name, ' ', -1) AS UNSIGNED) * 250) + (u.floor * 150),
    u.is_bookable = (MOD(CAST(u.unit_number AS UNSIGNED), 5) = 0),
    u.description = CONCAT('Twin-sharing room on floor ', u.floor, ' with two beds, individual lockers and shared bathroom access.'),
    u.amenities   = JSON_ARRAY('Twin Beds', 'Personal Locker', 'Meals Included', 'Housekeeping')
WHERE p.name LIKE 'mom''s pg %' AND u.base_price IS NULL;

-- 3. Property photos (3 per property, rotated through a pool of building and interior shots)
INSERT INTO media_asset_tbl (id, owner_module, reference_id, storage_provider, external_id, url, file_type, caption, uploaded_by_user_id, uploaded_at, created_at, updated_at)
SELECT UUID(), 'PROPERTY', p.id, 'LOCAL', CONCAT('seed-property-', p.id, '-', slot.n),
       CONCAT('https://images.unsplash.com/', pool.photo, '?auto=format&fit=crop&w=1200&q=80'),
       'IMAGE', CONCAT(p.name, ' photo ', slot.n + 1), '51b21b41-22f7-44a6-ba3e-1e03421d46ea', NOW(6), NOW(6), NOW(6)
FROM (
    SELECT id, name, ROW_NUMBER() OVER (ORDER BY name) AS rn
    FROM property_tbl
    WHERE name = 'Livic Residency' OR name LIKE 'mom''s pg %'
) p
CROSS JOIN (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2) slot
JOIN (
    SELECT 0 AS idx, 'photo-1545324418-cc1a3fa10c00' AS photo UNION ALL
    SELECT 1, 'photo-1502672260266-1c1ef2d93688' UNION ALL
    SELECT 2, 'photo-1560448204-e02f11c3d0e2' UNION ALL
    SELECT 3, 'photo-1600585154340-be6161a56a0c' UNION ALL
    SELECT 4, 'photo-1522708323590-d24dbb6b0267' UNION ALL
    SELECT 5, 'photo-1555854877-bab0e564b8d5' UNION ALL
    SELECT 6, 'photo-1600596542815-ffad4c1539a9' UNION ALL
    SELECT 7, 'photo-1595526114035-0d45ed16cfbf' UNION ALL
    SELECT 8, 'photo-1512917774080-9991f1c4c750' UNION ALL
    SELECT 9, 'photo-1513694203232-719a280e022f'
) pool ON pool.idx = MOD(p.rn * 3 + slot.n, 10)
WHERE NOT EXISTS (
    SELECT 1 FROM media_asset_tbl m WHERE m.owner_module = 'PROPERTY' AND m.reference_id = p.id COLLATE utf8mb4_unicode_ci
);

-- 4. Unit photos (1 per unit, rotated through a pool of room interiors)
INSERT INTO media_asset_tbl (id, owner_module, reference_id, storage_provider, external_id, url, file_type, caption, uploaded_by_user_id, uploaded_at, created_at, updated_at)
SELECT UUID(), 'PROPERTY', u.id, 'LOCAL', CONCAT('seed-unit-', u.id),
       CONCAT('https://images.unsplash.com/', pool.photo, '?auto=format&fit=crop&w=1200&q=80'),
       'IMAGE', CONCAT('Unit ', u.unit_number), '51b21b41-22f7-44a6-ba3e-1e03421d46ea', NOW(6), NOW(6), NOW(6)
FROM (
    SELECT un.id, un.unit_number, ROW_NUMBER() OVER (ORDER BY pr.name, un.floor, un.unit_number) AS rn
    FROM unit_tbl un
    JOIN property_tbl pr ON pr.id = un.property_id
    WHERE pr.name = 'Livic Residency' OR pr.name LIKE 'mom''s pg %'
) u
JOIN (
    SELECT 0 AS idx, 'photo-1502672260266-1c1ef2d93688' AS photo UNION ALL
    SELECT 1, 'photo-1522708323590-d24dbb6b0267' UNION ALL
    SELECT 2, 'photo-1560448204-e02f11c3d0e2' UNION ALL
    SELECT 3, 'photo-1595526114035-0d45ed16cfbf' UNION ALL
    SELECT 4, 'photo-1555854877-bab0e564b8d5' UNION ALL
    SELECT 5, 'photo-1513694203232-719a280e022f'
) pool ON pool.idx = MOD(u.rn, 6)
WHERE NOT EXISTS (
    SELECT 1 FROM media_asset_tbl m WHERE m.owner_module = 'PROPERTY' AND m.reference_id = u.id COLLATE utf8mb4_unicode_ci
);
