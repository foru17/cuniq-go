# cuniq-next / cmhk-go 项目说明

一套代码库，两个部署（多租户由 `NEXT_PUBLIC_CARRIER` 环境变量区分）：

| 站点 | 载体 | Vercel 项目 | 数据源 | 特点 |
|---|---|---|---|---|
| cuniq.zuoluo.tv | `cuniq`（默认） | cuniq-go（GitHub 自动部署 main） | CUniq 官网选号接口 | 一卡双号（+852/+86）、归属地 |
| cmhk.zuoluo.tv | `cmhk` | cmhk-go | 中国移动香港官网选号接口 | 单一 +852 号源，分 W（普通）/ C、D（靓号）等级 |

## 架构要点

- 载体配置集中在 `src/lib/carrier.ts`（品牌文案、缓存文件名、是否双号、自刷新等）。
- 数据抓取在 `src/services/sources/{cuniq,cmhk}.ts`，共享合并逻辑 `src/services/updateService.ts`。
- 缓存共用一个 R2 桶（bucket `cuniq`）：cuniq 用 `cache.json`，cmhk 用 `cmhk-cache.json`。
- cuniq 的"活跃号码"窗口为 0（每次同步返回全量池）；cmhk 每次返回随机批次，活跃窗口 6h（`activeWindowMs`）。
- 数据更新触发：cuniq 靠外部 cron 调 `POST /api/update-numbers`（Bearer token）；cmhk 无外部 cron，页面访问时若缓存 >15 分钟旧，用 Next `after()` 后台自刷新。
- CMHK 上游接口从本机（大陆网络）直连会被重置，需走代理（Surge HTTP 代理 127.0.0.1:6152）；Vercel 服务器可直连。
- CLI 部署 cmhk-go（不改动 .vercel 目录）：`VERCEL_ORG_ID=team_buaQda49E3lNYPMZ7loQXHO9 VERCEL_PROJECT_ID=prj_KhAQGCOqqcg3Q4AZRgt7nggeTTf5 npx vercel deploy --prod --yes`

## 凭据登记（值均在 `.env.local`，不进 git）

- `UPDATE_API_TOKEN`：cuniq-go 更新接口 token。
- `CMHK_UPDATE_API_TOKEN`：cmhk-go 更新接口 token（cmhk-go Vercel 项目的 `UPDATE_API_TOKEN` 环境变量与此一致）。
- `S3_*`：Cloudflare R2（两个项目共用同一组值）。
- `NEXT_PUBLIC_APP_CODE`：阿里云号码归属地 API（仅 cuniq 用）。
- Vercel CLI 已登录（luolei / team zuoluotv）。
- Cloudflare DNS（zuoluo.tv, zone `58e8b2341c4ad6e920e8c50346e7f183`）：API Token 在 `~/DEV/telegram-master/.env.deploy` 的 `CLOUDFLARE_API_TOKEN`（有 DNS 写权限）；wrangler OAuth 无 DNS scope，不要用。

## UI 基准

- cuniq 基准：https://cuniq.zuoluo.tv/ （截图存 `.ui-acceptance/2026-08-31/cuniq-baseline-desktop.png`）
- cmhk 基准：https://cmhk.zuoluo.tv/ （2026-08-31 首发版即基准，截图存 `.ui-acceptance/2026-08-31/cmhk-home-*.png`）
