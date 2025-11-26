# CUniq Go 月神卡选号神器

> 一个专为强迫症和靓号爱好者打造的 CUniq 月神卡选号工具。

## 在线演示

[在线](https://cuniq.zuoluo.tv/)

## 📌 关于月神卡

中国联通香港 CUniq 月神卡，应该算是目前手机卡套餐里一个真正的「Bug 级」存在。

- 💰 **HK$9/月**
- 🆔 **支持内地身份证实名**
- ❌ **无需押金**
- 📱 **+852 / +86 一卡双号**
- 🔄 **实体卡 / eSIM 任意选择**

要知道，现在国内最便宜的保号套餐也要 ¥8/月。但月神卡不仅更便宜，还能：
✨ 接验证码
✨ 备用手机号
✨ 出差港澳
✨ 注册平台
✨ 跨境通信

## 🔍 为什么做这个工具？

虽然月神卡性价比极高，但官网选号体验实在太折磨了：
⚠️ 刷号慢
⚠️ 想挑尾号要靠运气
⚠️ 没法过滤数字规则

所以，我花了几个小时做了这个「月神卡选号工具」，希望能帮大家更轻松地挑到顺眼的号码。

## 🛠️ 功能特点

- ✔ **数字匹配筛选**：支持包含/排除特定数字
- ✔ **靓号规则**：内置 AABB / ABAB / AAA / 连号 / 尾号过滤等规则
- ✔ **双号查看**：支持香港号 (+852) & 内地号 (+86) 分开查看
- ✔ **实时数据**：数据实时抓取，每约 15 分钟同步 CUniq 官网
- ✔ **高效筛选**：比手动刷号码池快很多、省时间很多

## 🚀 技术栈

本项目使用最新的 Next.js 技术栈构建：

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, RSC)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Storage**: [Cloudflare R2](https://www.cloudflare.com/products/r2/) (用于缓存号码数据)
- **Deployment**: Vercel

## 💻 本地开发

### 1. 克隆项目

```bash
git clone https://github.com/foru17/cuniq-go.git
cd cuniq-go
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

复制 `.env.example` 到 `.env.local` 并填入必要信息：

```bash
cp .env.example .env.local
```

需要配置的环境变量：

```env
# App Code (用于获取位置信息)
APP_CODE=your_app_code_here

# API Token (用于更新数据的接口鉴权)
UPDATE_API_TOKEN=your_secure_token_here

# Cloudflare R2 / S3 Storage (用于数据持久化)
S3_BUCKET_NAME=your_bucket
S3_ENDPOINT=your_endpoint
S3_DOMAIN_HOST=your_public_domain
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key
```

### 4. 启动开发服务器

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

## 📦 部署

本项目可以直接部署到 [Vercel](https://vercel.com)。

1. Fork 本仓库。
2. 在 Vercel 中导入项目。
3. 在 Vercel 项目设置中配置上述环境变量。
4. 部署即可。

## 📄 License

MIT License
