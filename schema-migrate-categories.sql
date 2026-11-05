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
