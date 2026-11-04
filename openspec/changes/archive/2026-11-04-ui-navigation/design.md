# Design：ui-navigation

## Context

导航栏已由存量代码完整实现（复用对象，非新建）：

- `src/components/Navbar.tsx`：固定顶部 `header` + IntersectionObserver 监听顶部哨兵元素切换毛玻璃态
- `src/content/nav.ts`：`navItems` 数据层（六个锚点项 id/label）
- `src/index.css:7-9`：`scroll-behavior: smooth` + `scroll-padding-top: 4rem`
- `App.tsx`：首页 Route 由 `Navbar` + 六个 section 组成，各 section `id` 与 `navItems` 一一对应（已核对）

组件层级（现状，本变更不改变结构）：

```
App (HashRouter)
└─ Route "/" (Dashboard 首页)
   ├─ Navbar ── 数据依赖：content/nav.ts ( navItems )、content/profile ( name )
   └─ main
      ├─ HeroSection #home
      ├─ StatsCardsSection #stats
      ├─ DailyGoalsSection #goals
      ├─ ModulesSection #modules
      ├─ AiSuggestionsSection #suggestions
      └─ TrendChart #trends
```

移动端展示：`nav.ts` 项较多，当前依赖 `whitespace-nowrap` + 横向间距收缩显示，无汉堡菜单（提案红线，不做）。

## Goals / Non-Goals

**Goals:**

- 以最小 diff 使现有实现逐条满足 `specs/ui/navigation` 的 spec（核对 → 修复缺口 → 验证）
- 导航行为契约沉淀到 `openspec/specs/ui/navigation/spec.md`，防止未来平台化演进时回归

**Non-Goals:**

- 不重构 Navbar 内部实现方式（如把 IntersectionObserver 换成 scroll 事件监听）
- 不改 `navItems` 数据结构、不新增移动端抽屉交互、不动主题系统

## Decisions

1. **核对式 BrownField 策略**：规格以"现有实现 + 提案要求"为基准写成，apply 阶段的核心动作是逐条验证而非重写。
   *备选：直接重写导航组件*——被否，违背 AGENTS.md「复用优先」与 config.yaml「已有代码必须复用」约束。
2. **锚点点击采用受控滚动**（`preventDefault` + `scrollIntoView({ behavior: 'smooth' })`）。
   *理由：Phase 2 核对发现存量回归——`HashRouter` 占用哈希命名空间，原生锚点 `href="#stats"` 会把哈希解析为伪路由 `/stats`，无匹配路由导致首页整树卸载白屏。锚点因此 MUST NOT 改写哈希。备选 BrowserRouter 被否：gh-pages 深链接刷新 404；CSS `scroll-behavior: smooth` 保留为浏览器直接定位（初始加载带哈希等场景）的全局兜底，`scroll-padding-top` 对 `scrollIntoView` 同样生效。*
3. **锚点遮挡用既有 `scroll-padding-top: 4rem`** 兜底；如核对发现遮挡，调整该值而不是改各 section 结构。
4. **降级容错保持现有 try/catch → 常驻毛玻璃**实现（`Navbar.tsx:13-22`），spec 已将其定义性强为必须行为。
5. **验证手段**：每个 Phase 结束以 `npm run build`（tsc + vite）保证类型与构建通过，浏览器手动核验交互行为；不新增测试框架（项目现状无 e2e 设施，属 Non-Goal 扩权）。

## Risks / Trade-offs

- [nav.ts 项较多，小屏横向溢出] → 核对阶段实测 sm 断点；溢出则仅用 Tailwind 工具类收紧间距/字号，不加新交互
- [CSS smooth 方案在系统开启"减少动态效果"（prefers-reduced-motion）时行为由浏览器裁决] → 接受浏览器默认行为，不额外处理（spec 未约定动画时长）
- [IntersectionObserver 依赖顶部哨兵绝对定位元素] → 属既有实现，核对确认其在任意滚动位置仍能正确触发即可

## Migration Plan

纯前端最小 diff：按 Phase 提交，可逐 commit `git revert` 回滚； spec 文件在 `/opsx-archive` 时合入 `openspec/specs/ui/navigation/`。回滚 spec 即删除对应目录，无数据迁移。

## Open Questions

无（歧义已在 propose 前与用户确认：BrownField 对齐式 + 命名 `ui-navigation`）。
