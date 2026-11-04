# Proposal：ui-navigation

## Why

存量项目已从个人品牌站演进为 AI 学习平台 Dashboard，顶部导航栏（`src/components/Navbar.tsx`）是实现中的核心 UI 资产，但其行为（固定顶部、锚点平滑滚动、滚动后背景模糊等）此前被删除且从未沉淀为 spec。导航栏作为横跨首页全部 sections 的入口组件，行为无规范约束会带来回归风险；需要按"复用现有实现"的原则建立规范并做一次符合性核对，而不是重新实现。

## What Changes

- **新增** `ui/navigation` capability spec：以 delta 形式把导航栏现有行为固化为规范性要求（Given/When/Then 格式，含边界/错误场景）
- **核对阶段（Phase）新增规范要求的静止行为**：点击导航锚点平滑滚动到对应 section（依赖 `index.css` 的 `scroll-behavior: smooth`）
- **核对阶段修复**：对现有实现逐条比对规范，发现缺口（如锚点 id 与 section id 不一致、滚动遮挡等）时做最小修复
- **复用**：保留现有 `Navbar.tsx`、`src/content/nav.ts` 数据层、`ThemeToggle` 与「学习分析」「AI 助手」路由按钮，结构不推倒重来

## Out-of-Scope（不做事项，红线）

- 不做多级下拉菜单
- 不新增/修改用户登录、注册入口（现有登录页路由不动）
- 不做站内搜索
- 不改动 `navItems` 数据结构与 `content/` 数据层约定
- 不为移动端新增汉堡菜单或抽屉交互（保持现有布局收缩策略）
- 不改动主题系统（`theme/`）与暗色模式实现方式

## 回滚方案

核对阶段以验证为主，代码修改预期极小（最小 diff 修复）。任何代码变更均以独立 commit 提交出现 specification 差异问题时，可直接 `git revert` 该 commit 或恢复 `Navbar.tsx` / `nav.ts` / `index.css` 既有版本，无数据迁移、无依赖降级，风险低。

## Capabilities

### New Capabilities

- `ui/navigation`: 首页顶部导航栏的规范性能力，覆盖固定定位布局、品牌名返回顶部链接、锚点项平滑滚动定位、滚动离顶后的毛玻璃背景，以及降级容错行为

### Modified Capabilities

（无——现有 `auth/`、`learning/`、`user/` 各 capability 的需求不受影响）

## Impact

- **代码**：`src/components/Navbar.tsx`、`src/content/nav.ts`、`src/index.css`（核对对象，预计不变或仅最小修复）；无新增组件
- **Specs**：新增 `openspec/specs/ui/navigation/spec.md`（归档后）
- **API / 依赖 / 构建部署**：无影响；不改 `gh-pages` 部署流程与首屏性能约束
