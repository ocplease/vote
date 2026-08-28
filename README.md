# 专家投票与实时评分系统

面向评审活动的三专家评分应用，包含大屏、专家专属打分链接、主持人控制台、参赛项目管理、CSV 批量导入和成绩导出。

## 默认专家

- 陈镇 — 产品专家
- 丛露微 — 研发专家
- 黄晓华 — 业务专家

专家链接格式：

- `/?role=judge_a` — 陈镇
- `/?role=judge_b` — 丛露微
- `/?role=judge_c` — 黄晓华
- `/?role=admin` — 主持人控制台
- `/?role=screen` — 大屏

大屏中的“评委扫码 / 链接”会为每位专家生成二维码与可复制链接。

## 本地运行

要求 Node.js 20+。

```bash
npm install
npm run dev
```

默认访问 `http://localhost:3000`。类型检查与生产构建：

```bash
npm run lint
npm run build
```

## 批量导入参赛项目

进入主持人控制台 → “添加参赛选手” → “CSV 批量上传”。可先下载模板。CSV 支持以下表头：

```csv
编号,选手/团队,参赛项目,赛道/分组
01,示例团队,示例参赛项目,创新赛道
```

“选手/团队”和“参赛项目”为必填。导入前会展示预览，确认后追加到候场队列；当前项目和候场项目都可直接编辑。

## Vercel 部署与数据持久化

项目使用 Vercel Functions 提供 API。生产环境应在 Vercel Marketplace 安装 Upstash Redis，Vercel 会自动注入：

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

部分 Vercel Marketplace 项目使用兼容变量名 `KV_REST_API_URL` 和 `KV_REST_API_TOKEN`，应用同时支持这两组变量。

可选设置 `COMPETITION_STATE_KEY`，用于同一 Redis 中隔离不同比赛。未配置 Redis 时会回退到进程内存，仅适合本地开发，不建议用于正式投票。

部署：

```bash
npx vercel --prod
```
