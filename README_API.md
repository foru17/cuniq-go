# CUniq 选号神器 - API 文档

## API 端点

### 1. 读取号码数据 (GET)

**端点**: `GET /api/numbers?type={type}`

**用途**: 从缓存读取号码数据,不触发数据更新

**参数**:
- `type` (可选): `ordinary` 或 `special`
  - `ordinary`: 普通号码
  - `special`: 靓号
  - 默认: `ordinary`

**响应示例**:
```json
{
  "data": [
    {
      "hkNumber": "59001234",
      "mainlandNumber": "8659001234",
      "province": "广东",
      "city": "深圳",
      "addedAt": 1732531200000,
      "lastSeenAt": 1732531200000
    }
  ],
  "lastUpdated": 1732531200000
}
```

**说明**:
- 此端点仅读取缓存,不会触发数据更新
- 如果缓存不存在,返回空数据
- 会自动补充缺失的地理位置信息

---

### 2. 更新号码数据 (POST)

**端点**: `POST /api/update-numbers`

**用途**: 从 CUniq API 获取最新数据并更新缓存

**请求**: 无需请求体

**响应示例**:
```json
{
  "success": true,
  "timestamp": 1732531200000,
  "duration": "2345ms",
  "stats": {
    "ordinary": {
      "previous": 150,
      "current": 155,
      "active": 152,
      "new": 5
    },
    "special": {
      "previous": 80,
      "current": 82,
      "active": 81,
      "new": 2
    },
    "locationEnriched": 7
  }
}
```

**说明**:
- 此端点应由后台定时任务调用,不应由前端直接调用
- 会同时更新普通号码和靓号数据
- 自动进行地理位置数据enrichment
- 返回详细的更新统计信息

---

## 使用场景

### 前端应用
前端只需调用 `GET /api/numbers` 读取缓存数据:

```typescript
const response = await fetch('/api/numbers?type=ordinary');
const { data, lastUpdated } = await response.json();
```

### 后台定时任务

#### 方式 1: 使用 cron 命令

创建定时任务每10分钟更新一次:

```bash
# 编辑 crontab
crontab -e

# 添加以下行 (每10分钟执行一次)
*/10 * * * * curl -X POST http://localhost:3000/api/update-numbers
```

#### 方式 2: 使用 Vercel Cron Jobs

在 `vercel.json` 中配置:

```json
{
  "crons": [{
    "path": "/api/update-numbers",
    "schedule": "*/10 * * * *"
  }]
}
```

#### 方式 3: 使用 Node.js 脚本

创建 `scripts/update-numbers.js`:

```javascript
const fetch = require('node-fetch');

async function updateNumbers() {
  try {
    const response = await fetch('http://localhost:3000/api/update-numbers', {
      method: 'POST'
    });
    const result = await response.json();
    console.log('Update completed:', result);
  } catch (error) {
    console.error('Update failed:', error);
  }
}

updateNumbers();
```

然后使用 cron 或其他调度工具定期运行此脚本。

---

## 本地测试

### 测试更新API

```bash
# 触发数据更新
curl -X POST http://localhost:3000/api/update-numbers

# 查看响应
# 应该看到包含统计信息的 JSON 响应
```

### 测试读取API

```bash
# 读取普通号码
curl http://localhost:3000/api/numbers?type=ordinary

# 读取靓号
curl http://localhost:3000/api/numbers?type=special
```

---

## 缓存机制

- **缓存文件**: `data/cache.json`
- **缓存结构**:
  ```json
  {
    "ordinary": [...],
    "special": [...],
    "lastUpdated": 1732531200000
  }
  ```
- **数据合并**: 新数据会与现有缓存合并,保留历史的 `addedAt` 时间戳
- **活跃过滤**: 只返回在最后一次更新中仍然存在的号码

---

## 注意事项

1. **Cookie 更新**: CUniq API 需要有效的 Cookie。如果更新失败,可能需要更新 `src/app/api/update-numbers/route.ts` 中的 Cookie 值

2. **API 限流**: 避免过于频繁地调用更新API,建议间隔至少5-10分钟

3. **地理位置API**: 使用阿里云手机号归属地查询API,有调用次数限制。已实现缓存机制减少重复查询

4. **错误处理**: 更新API 会捕获错误并返回详细的错误信息,便于调试
