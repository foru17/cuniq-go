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
- **号池保留窗口按池分开**（`ordinaryWindowMs` / `specialWindowMs`）：
  - cuniq 两个池都是 0——每次同步 10 批就能覆盖全池，没见到的即已售。
  - cmhk 普通池（W）3h，靓号池（C/D）0——C/D 每次调用返回**全量**列表，缺席即已售；W 是大池里的批次，缺席不代表售出。
- **逐号可用性校验**（`src/services/sources/cmhk.ts` 的 `verifyCmhkNumbers`）：把完整 8 位号码填进 `msisdnCondition` 就是精确查询，命中=在售、空=已售。每轮对"本轮没见到且还在窗口内"的号按最旧优先校验最多 40 个（`verifyBudget`），`gone` 删除、`available` 续期、任何异常算 `unknown` 一律保留。单轮上游调用硬上限 `MAX_UPSTREAM_CALLS_PER_RUN = 50`。
- **兜底**：靓号池任一等级抓取失败 → 该轮不按 0 窗口裁剪（`KEEP_ALL`），避免把靓号池打空；活跃号数量相比上轮塌陷到 30% 以下则整轮拒绝写缓存（`isPoolCollapse`）。
- 数据更新触发：`/api/update-numbers` 同时支持 `POST`（手动，Bearer `UPDATE_API_TOKEN`）和 `GET`（定时器，Bearer `UPDATE_API_TOKEN` 或 `CRON_SECRET`）。定时器是本仓库的 GitHub Actions `.github/workflows/refresh-numbers.yml`（`*/15 * * * *`，同时打两个站，token 存在仓库 secrets `CUNIQ_UPDATE_API_TOKEN` / `CMHK_UPDATE_API_TOKEN`）。cmhk 另有页面访问触发的 `after()` 自刷新兜底（缓存 >15 分钟才触发）。
- **两个站都开了 Vercel 的 bot 挑战**：从大陆 IP 用 curl 访问会拿到 `HTTP 403` + `x-vercel-mitigated: challenge`（连首页都是），海外出口（GitHub Actions runner、Surge 代理 127.0.0.1:6152）则正常 200。本机调试线上接口一律加 `-x http://127.0.0.1:6152`。
- 上游接口的实测特性（2026-09-07 验证）：CMHK 模糊 `msisdnCondition`（1~3 位）返回的是**随机子集**，不能用来枚举全池；只有 8 位精确查询可靠。CUniq 同样支持 `queryNum=<8位>` 精确查询。
- CMHK 上游接口从本机（大陆网络）直连会被重置，需走代理（Surge HTTP 代理 127.0.0.1:6152）；Vercel 服务器可直连。
- CLI 部署 cmhk-go（不改动 .vercel 目录）：`VERCEL_ORG_ID=team_buaQda49E3lNYPMZ7loQXHO9 VERCEL_PROJECT_ID=prj_KhAQGCOqqcg3Q4AZRgt7nggeTTf5 npx vercel deploy --prod --yes`

## 凭据登记（值均在 `.env.local`，不进 git）

- `UPDATE_API_TOKEN`：cuniq-go 更新接口 token。
- `CMHK_UPDATE_API_TOKEN`：cmhk-go 更新接口 token（cmhk-go Vercel 项目的 `UPDATE_API_TOKEN` 环境变量与此一致）。
- `S3_*`：Cloudflare R2（两个项目共用同一组值）。
- `NEXT_PUBLIC_APP_CODE`：阿里云号码归属地 API（仅 cuniq 用）。
- Vercel CLI 已登录（luolei / team zuoluotv，**Hobby 计划**——Vercel Cron 每天只跑一次，做不了 15 分钟定时）。
- Google Analytics：cuniq-go `NEXT_PUBLIC_GA_ID = G-E0VHSBG0XE`；cmhk-go `NEXT_PUBLIC_GA_ID = G-E13NCDQ4Z4`（均已写入各自 Vercel 项目的 Production/Preview/Development）。自定义事件在 `src/lib/analytics.ts`：`select_number_type` / `apply_filter` / `reset_filters` / `store_cta_click`，每条带 `carrier` 参数。
- Cloudflare DNS（zuoluo.tv, zone `58e8b2341c4ad6e920e8c50346e7f183`）：API Token 在 `~/DEV/telegram-master/.env.deploy` 的 `CLOUDFLARE_API_TOKEN`（有 DNS 写权限）；wrangler OAuth 无 DNS scope，不要用。

## UI 基准

- cuniq 基准：https://cuniq.zuoluo.tv/ （截图存 `.ui-acceptance/2026-08-31/cuniq-baseline-desktop.png`）
- cmhk 基准：https://cmhk.zuoluo.tv/ （2026-08-31 首发版即基准，截图存 `.ui-acceptance/2026-08-31/cmhk-home-*.png`）
