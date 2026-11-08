CREATE TABLE IF NOT EXISTS stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  hours TEXT DEFAULT '',
  transport TEXT DEFAULT '',
  services TEXT DEFAULT '',
  description TEXT DEFAULT '',
  discount TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  website TEXT DEFAULT '',
  map_url TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  image_urls TEXT DEFAULT '[]',
  pdf_url TEXT DEFAULT '',
  pdf_name TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,
  promo_visible INTEGER NOT NULL DEFAULT 0,
  region TEXT NOT NULL DEFAULT 'all',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_stores_category ON stores(category);
CREATE INDEX IF NOT EXISTS idx_stores_visible ON stores(visible);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  link_url TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_visible ON events(visible);
CREATE INDEX IF NOT EXISTS idx_events_sort ON events(sort_order);

CREATE TABLE IF NOT EXISTS promo_stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  hours TEXT DEFAULT '',
  transport TEXT DEFAULT '',
  services TEXT DEFAULT '',
  description TEXT DEFAULT '',
  discount TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  website TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  image_urls TEXT DEFAULT '[]',
  pdf_url TEXT DEFAULT '',
  pdf_name TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,
  region TEXT NOT NULL DEFAULT 'all',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_promo_stores_category ON promo_stores(category);
CREATE INDEX IF NOT EXISTS idx_promo_stores_visible ON promo_stores(visible);

CREATE TABLE IF NOT EXISTS promo_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  image_url TEXT DEFAULT '',
  desktop_image_url TEXT DEFAULT '',
  mobile_image_url TEXT DEFAULT '',
  title TEXT DEFAULT '活動推廣',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO promo_settings (id, image_url) VALUES (1, '');

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO categories (slug, name, sort_order) VALUES
  ('dining', '餐飲相關特約店家', 0),
  ('cafe', '咖啡 · 點心 · 甜品類', 1),
  ('hotel', '旅館民宿特約店家', 2),
  ('souvenir', '伴手禮/觀光工廠特約店家', 3),
  ('leisure', '生活休閒類特約店家', 4),
  ('shopping', '生活服務及購物', 5);
