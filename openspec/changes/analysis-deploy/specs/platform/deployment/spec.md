# Spec Delta

## Purpose

平台上线部署行为：前端托管于 GitHub Pages（base `/my-website/`），后端
FastAPI 托管于 Render 免费托管，前后端通过环境变量与 CORS 配置联通，并提供
回滚手段。

## ADDED Requirements

### Requirement: 前端 GitHub Pages 发布

前端 SHALL 通过现有 `npm run deploy` 流程发布至 gh-pages 分支，站点 SHALL 可在
`https://<user>.github.io/my-website/` 访问；学习分析区各页面 SHALL 在线上
可直达（路由 SHALL 不依赖服务器端 rewrite 规则）。

#### Scenario: 线上访问分析区页面

- **GIVEN** 前端已发布至 gh-pages
- **WHEN** 用户在浏览器直接打开学习分析区页面的完整线上 URL
- **THEN** 页面正常渲染对应内容，资源路径均正确加载（无 404 静态资源）

### Requirement: 后端 Render 发布

后端 SHALL 部署至 Render 免费托管并由 Git 分支推送触发部署；部署完成后，后端
SHALL 在 Render 分配的域名上提供 API 服务，其 `/docs` 页面 SHALL 可访问并返回
200。

#### Scenario: 分支推送触发部署

- **WHEN** 后端代码推送到触发分支
- **THEN** Render 自动执行部署，部署完成后 API 在分配域名上可用

#### Scenario: 线上 API 健康检查

- **GIVEN** Render 部署完成
- **WHEN** 请求后端域名的 `/docs`
- **THEN** 返回 200 与 API 文档页面

### Requirement: 前后端联通配置

前端生产构建 SHALL 复用现有 `VITE_API_BASE` 环境变量读取后端 API 地址；本地开发
SHALL 保持现有默认本地地址不变。后端 CORS 配置 SHALL 允许 GitHub Pages 线上
域名跨域访问，同时保留本地开发来源。

#### Scenario: 线上数据请求联通

- **GIVEN** 前端已配置生产 API 地址且后端已部署
- **WHEN** 已登录用户在线上站点打开学习数据页
- **THEN** 浏览器成功请求后端接口并渲染真实数据，控制台无 CORS 报错

#### Scenario: 本地开发不受影响

- **GIVEN** 未设置 `VITE_API_BASE_URL`
- **WHEN** 开发者本地运行 `npm run dev`
- **THEN** 前端使用现有默认本地后端地址，行为与部署前一致

### Requirement: 免费实例休眠表现

Render 免费实例休眠后的首个请求 SHALL 允许较长的唤醒等待；前端 SHALL 在等待
期间展示加载态，请求失败时 SHALL 提供重试入口。

#### Scenario: 休眠唤醒首个请求

- **GIVEN** 后端免费实例处于休眠状态
- **WHEN** 用户打开学习数据页发起首个请求
- **THEN** 页面保持加载态直至响应返回或超时，超时后展示错误提示与重试入口

### Requirement: 发布回滚

前后端 SHALL 各自具备独立回滚手段：后端 SHALL 可在 Render 控制台回滚至上一个
deployment；前端 SHALL 可通过重新部署上一个发布 commit 的构建产物恢复站点；
任一回滚 SHALL 不影响另一端已发布的版本。

#### Scenario: 后端回滚

- **WHEN** 在 Render 控制台对上一个 deployment 执行 rollback
- **THEN** 后端 API 恢复为上一版本行为，前端站点无需变更

#### Scenario: 前端回滚

- **WHEN** 使用上一发布 commit 重新执行 gh-pages 部署
- **THEN** 线上站点恢复为上一版本内容，后端服务不受影响
