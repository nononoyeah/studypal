# React + TypeScript + Vite

## 上线部署（前后端）

架构：前端 GitHub Pages（`https://nononoyeah.github.io/my-website/`），
后端 FastAPI 托管 Render 免费层（仓库内 `render.yaml` Blueprint 配置）。

> 已知限制：Render 免费层文件系统不持久，服务重启或重新部署后 SQLite
> 数据会丢失；免费实例闲置 15 分钟会休眠，首个请求需唤醒等待。

### 首次部署步骤

1. 推送本仓库到 GitHub，登录 Render 控制台 → New → Blueprint，
   选择本仓库，Render 读取 `render.yaml` 创建 `studypal-api` 服务。
2. 部署完成后记录 Render 分配的域名（形如 `https://studypal-api-xxxx.onrender.com`），
   验证：`curl https://<render-domain>/api/health` 返回 `{"status":"ok"}`。
3. 前端发布（指定后端地址）：

   ```bash
   # Windows PowerShell
   $env:VITE_API_BASE = "https://<render-domain>"; npm run deploy
   # Git Bash
   VITE_API_BASE=https://<render-domain> npm run deploy
   ```

4. 线上验证：打开 `https://nononoyeah.github.io/my-website/`，注册/登录后
   进入「学习分析」，确认学习数据、学习日历、成就均展示真实数据，
   浏览器控制台无 CORS 报错。

### 回滚步骤

- 后端：Render 控制台 → `studypal-api` → Deploys → 选上一个成功的 deployment
  → Rollback，API 即恢复上一版本，前端无需变更。
- 前端：在 Git 历史中找到上一个发布 commit，重新执行步骤 3 的 deploy 命令，
  线上站点即恢复上一版本，后端不受影响。
- 两端回滚相互独立，互不影响。

### 本地开发

后端：`cd backend && uvicorn app.main:app --reload`（默认 `http://localhost:8000`）。
前端：`npm run dev`（默认指向本地后端，行为与部署前一致）。



This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

自行体验：
backend/ 下 python -m uvicorn app.main:app --port 8000，
项目根 npm run dev，
浏览器打开 http://localhost:5173/my-website/#/chat。
注意 smoke_chat_user 是验证用账号，