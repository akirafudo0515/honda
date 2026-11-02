-- Reclassify live stores that have one clear region but were left as all.
UPDATE stores SET region = 'north' WHERE id = 202;
UPDATE stores SET region = 'north' WHERE id = 204;
UPDATE stores SET region = 'north' WHERE id = 209;
UPDATE stores SET region = 'east' WHERE id = 196;
UPDATE stores SET region = 'south' WHERE id = 199;
UPDATE stores SET region = 'south' WHERE id = 205;
UPDATE stores SET region = 'central' WHERE id = 197;
UPDATE stores SET region = 'south' WHERE id = 50;
UPDATE stores SET region = 'south' WHERE id = 194;
UPDATE stores SET region = 'central' WHERE id = 189;
UPDATE stores SET region = 'north' WHERE id = 156;
