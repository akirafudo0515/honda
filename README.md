# 台灣本田聯合福委會特約商店公布欄

靜態網站（Cloudflare Pages）＋簡易後台（Pages Functions + D1 + R2）。

- 前台：`https://www.hondataiwan-club.com/`
- 後台：`https://www.hondataiwan-club.com/admin/`

## 本機開發

```bash
npm install
npm run extract          # 從舊 HTML 抽出店家 → seed.sql
npm run migrate:local    # 建立本機 D1 並匯入種子資料
npm run dev              # wrangler pages dev
```

開啟：

- 前台：`http://127.0.0.1:8788/`
- 後台：`http://127.0.0.1:8788/admin/`
- 預設密碼：`change-me-please`（見 `wrangler.toml` 的 `ADMIN_PASSWORD`）

## 上線（需先 `npx wrangler login`）

1. 建立資源：

```bash
npm run db:create
npm run r2:create
```

2. 把 `wrangler.toml` 裡的 `database_id` 換成 `db:create` 回傳的 UUID。

3. 在 Cloudflare Pages 專案 `honda` 設定：

- D1 binding：`DB` → `honda-stores`
- R2 binding：`FILES` → `honda-store-files`
- Secrets：`ADMIN_PASSWORD`、`SESSION_SECRET`

4. 匯入遠端資料：

```bash
npm run migrate:remote
```

5. Push 到 GitHub `main`，或：

```bash
npx wrangler pages deploy htjwc.weebly.com --project-name=honda
```

## 店家分類 ID

| ID | 名稱 |
|---|---|
| dining | 餐飲相關特約店家 |
| cafe | 咖啡 · 點心 · 甜品類 |
| hotel | 旅館民宿特約店家 |
| souvenir | 伴手禮/觀光工廠特約店家 |
| leisure | 生活休閒類特約店家 |
| shopping | 生活服務及購物 |
