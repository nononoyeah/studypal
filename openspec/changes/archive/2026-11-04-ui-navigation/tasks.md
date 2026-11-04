# Tasks：ui-navigation

实施策略：逐 Phase 对照 `specs/ui/navigation/spec.md` 核对现有实现；发现 spec 差点时做最小修复，其余情况不修改任何代码。每个 Phase 结束后停下等待用户确认（AGENTS.md Apply 阶段规则）。

## 1. Phase 1 — 固定布局与品牌链接核对

- [x] 1.1 对照 spec「固定顶部导航布局」核对 `Navbar.tsx` 表现：起始视口时导航栏悬浮视口顶部，且锚点定位后内容不被导航栏遮挡（`scroll-padding-top: 4rem` 兜底）；如有遮挡则调整 `src/index.css` 的 `scroll-padding-top` 为最小修复。验证：`npm run dev` 后浏览器点击任一导航项，section 标题完整可见，不为导航栏所遮挡。
- [x] 1.2 对照 spec「品牌名返回顶部链接」核对：导航栏左侧渲染 `content/profile` 的 `profile.name`（非硬编码），点击回到 `#home` 顶部。验证：人工核对 `Navbar.tsx` 渲染源与其在浏览器中的点击跳转行为。

## 2. Phase 2 — 锚点平滑滚动核对

- [x] 2.1 静态核对 `nav.ts` 六个 `navItems.id`（home/stats/goals/modules/suggestions/trends 与之在 `App.tsx` 首页组合的各 section `id` 一一相等；发现不一致即按 spec 错误场景处理为最小修复，即修正 nav.ts 或增补 section id，二者绝不另建重复组件。验证：run grep 式核对记录逐项对照结果，六项全部一致，无落项。
- [x] 2.2 浏览器核验「锚点项平滑滚动」：逐个点击六项导航，页面均为平滑滚动（非瞬时跳变）到对应 section，且 URL 哈希同步为 `#<id>`；点击行为不得使视口滚动到错误的位置。验证：六个点击操作行为记录完成，无一处跳变或落错位。

## 3. Phase 3 — 毛玻璃状态与降级容错核对

- [x] 3.1 核验「滚动离顶背景模糊」四态/边界：页面顶部时透明无底线，向下滚动（小滚动量）后切换为毛玻璃+底线，再滚回顶部时双向状态正确恢复；暗色模式下毛玻璃与文字配色均清晰可读。验证：亮/暗两态下顶部往返滚动核验，观察结果与 spec 场景逐一一致；如有偏离（如回顶不透明残留）做最小修复后复验。
- [x] 3.2 核查「滚动观测降级容错」代码路径：`Navbar.tsx` 中 IntersectionObserver 创建带回退捕获（try/catch + fallback），失败时为常驻毛玻璃且无页面级报错；实现不动即确认通过。验证：记录 `Navbar.tsx:13-22` 代码路径审查结论并说明容误机制；`npm run dev` 下页面无控制台未捕获错误。
- [x] 3.3 响应式抽查：sm 及更小断点下六项导航横向布局依赖既有的 `whitespace-nowrap/间距收缩` 方案（spec 约定引入密码类汉堡菜单为 NonGoal，不新增交互）。验证：开发视角截图式校验各断点无横向溢出、无遮挡；如有溢出仅用 Tailwind 间距/字号工具类做最小修复。

## 4. Phase 4 — 构建验证与规范一致性收尾

- [x] 4.1 运行 `npm run build`（tsc + vite），确认核对阶段产生的任何修复 diff 不破坏构建，构建通过且无 TypeScript 报错。验证：构建命令零错误退出。
- [x] 4.2 产出「spec ↔ 实现核对总结」：对照 delta spec 五个 Requirement 逐条标注「已满足/已修复/仍偏离」及证据；确认五项核对后状态均为已满足或已修复，仍偏离则停止并向上报告，不自行追加范围。
- [x] 4.3 将修复 diff（若第 1-3 Phase 有）及核对总结提交给用户 review，等待确认后再进入归档流程。验证：用户确认已收到并核对。

## Workflow follow-up（不计入进度，归档阶段参考）

- 用户确认 Phase 4 后运行 `/opsx-archive`，将 `ui-navigation` 归档合入 `openspec/specs/ui/navigation/spec.md`，并向用户汇报 OpenSpec 结构变化。
