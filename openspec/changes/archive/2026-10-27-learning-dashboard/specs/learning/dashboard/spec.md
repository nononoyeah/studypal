# Spec Delta

## Purpose

学习助手首页的数据统计视图：以 mock 数据驱动展示学习概览统计卡片与周/月趋势图，
为后续接入 FastAPI 后端提供行为契约边界。

## ADDED Requirements

### Requirement: 学习助手入口问候区

Hero 骨架（粒子背景、渐变、亮/暗模式）SHALL 保留，内部文案 SHALL 切换为
学习助手问候语、今日学习摘要与「继续学习」按钮；「继续学习」按钮 SHALL
锚点跳转至学习模块列表区域。

#### Scenario: 点击继续学习

- **WHEN** 用户点击 Hero 区「继续学习」按钮
- **THEN** 页面平滑滚动至学习模块列表区域锚点

#### Scenario: 暗色模式下展示

- **WHEN** 页面处于暗色模式
- **THEN** 问候区沿用现有渐变背景与 dark: 前缀配色，无视觉断层

### Requirement: 数据统计卡片展示

首页 SHALL 展示 4 张学习统计卡片：累计学习天数、本周学习时长、目标达标次数、
连续打卡天数；数据 SHALL 全部读取自 `src/content/` 下的 mock 常量，SHALL NOT
发起任何网络请求。

#### Scenario: 正常渲染统计卡片

- **GIVEN** mock 统计数据文件存在且字段完整
- **WHEN** 用户打开首页
- **THEN** 4 张卡片按顺序渲染对应数值与标题

#### Scenario: mock 数据字段缺失

- **GIVEN** 某张卡片对应的数据字段缺失或为 null
- **WHEN** 用户打开首页
- **THEN** 该卡片显示 `--` 占位符，其余卡片正常渲染，页面不崩溃

### Requirement: 周/月趋势图

首页 SHALL 提供周/月两种维度的学习时长趋势图，默认展示周视图；视图切换 SHALL
通过标签切换完成；图表 SHALL 使用 SVG/CSS 实现，SHALL NOT 引入第三方图表库。

#### Scenario: 切换周视图与月视图

- **WHEN** 用户点击「周」或「月」标签
- **THEN** 图表重新渲染对应维度的 mock 数据，无需刷新页面

#### Scenario: 趋势数据为空

- **GIVEN** 图表数据数组为空
- **WHEN** 用户查看趋势图区域
- **THEN** 显示「暂无学习数据」空态文案，不渲染空的坐标轴或样式错乱的容器
