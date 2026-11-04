# navigation Specification

## Purpose

规范首页顶部导航栏（Navbar）的可观察行为：固定定位布局、品牌名链接、锚点项平滑滚动、滚动离顶后的毛玻璃背景，以及浏览器能力降级容错，为存量 Dashboard 首页的导航行为提供可测试的行为契约。

## Requirements

### Requirement: 固定顶部导航布局

导航栏 SHALL 固定悬浮在首页视口顶部（不随页面滚动移出视野），并为内容区预留在视口顶部用于锚点定位的偏移空间，使锚点定位后的标题不被导航栏遮挡。

#### Scenario: 页面初始加载
- **WHEN** 用户打开首页且页面未发生滚动
- **THEN** 导航栏显示在视口顶部，覆盖在页面内容之上

#### Scenario: 锚点定位后的偏移
- **WHEN** 用户点击导航项使其左侧内容滚动到对应 section
- **THEN** 对应 section 的标题滚动停靠点位于导航栏底边之下，不被导航栏遮挡

### Requirement: 品牌名返回顶部链接

导航栏左侧 SHALL 显示个人名字（来自 `content/` 数据层，而非硬编码），且 SHALL 作为指向首页顶部锚点的链接，点击后回到页面顶部。

#### Scenario: 左侧品牌名展示与跳转
- **WHEN** 用户查看导航栏左侧
- **THEN** 显示 `profile.name` 数据项，点击后页面滚动/定位到首页顶部锚点 `#home`

### Requirement: 锚点项平滑滚动

导航项 SHALL 来自 `src/content/nav.ts` 的 NAV_ITEMS 数据层配置，每项点击后 SHALL 平滑滚动（非瞬时跳变）到 `id` 与该导航项一致的首页 section；导航项配置的锚点 id MUST 与对应 Section 渲染的 `id` 保持一致。

#### Scenario: 点击导航项平滑切换
- **WHEN** 用户点击导航栏中的某个锚点导航项（如「数据统计」）
- **THEN** 页面以平滑滚动动画移动到 `id` 与该项一致的 section，且路由路径与 URL 哈希保持不变（HashRouter 下哈希命名空间归路由所有，锚点点击 MUST NOT 产生路由副作用）

#### Scenario: 锚点 id 不一致（错误场景）
- **WHEN** `nav.ts` 中某导航项的 `id` 在首页任何 section 的 `id` 中不存在匹配
- **THEN** 该导航项被视作配置缺陷，核对阶段 MUST 将其修正或移除，点击行为不得使页面滚动到错误未知位置

### Requirement: 滚动离顶背景模糊

导航栏 SHALL 根据页面滚动位置呈现两种状态：页面位于顶部时背景透明，页面滚动离开顶部后呈现半透明毛玻璃（backdrop blur）背景与底部分隔线；MUST 在亮色与暗色模式下均保持可读性与正确配色。

#### Scenario: 顶部状态
- **WHEN** 页面顶部尚未滚离视口
- **THEN** 导航栏背景为透明、无边框底部分隔线

#### Scenario: 离顶状态（边界场景）
- **WHEN** 用户向下滚动使页面离开顶部（无论滚动距离多小）
- **THEN** 导航栏切换为半透明毛玻璃背景（backdrop blur）并显示底部分隔线

#### Scenario: 暗色模式可读性
- **WHEN** 页面处于暗色模式且导航栏处于离顶状态
- **THEN** 毛玻璃背景与导航文字采用暗色模式配色（`dark:` 前缀样式），列表文字仍清晰可读

#### Scenario: 状态往返切换
- **WHEN** 用户先向下滚动再滚回页面顶部
- **THEN** 导航栏在离顶/顶部两种状态间随滚动位置正确双向切换

### Requirement: 滚动观测降级容错

当浏览器不支持滚动监听能力（IntersectionObserver 不可用）时，系统 SHALL 优雅降级为常驻毛玻璃导航栏，MUST NOT 抛出页面级错误或导致导航功能不可用。

#### Scenario: 能力检测失败降级（错误场景）
- **WHEN** 浏览器环境无法创建 IntersectionObserver
- **THEN** 导航栏直接呈现毛玻璃常驻样式，点击导航项等交互仍正常工作，控制台无未捕获错误
