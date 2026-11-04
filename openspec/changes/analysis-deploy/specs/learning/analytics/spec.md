# Spec Delta

## Purpose

学习数据统计页：由 FastAPI 从现有 `users` 与 `chat_messages` 表聚合真实学习
活跃数据，驱动概览统计卡片与周/月活跃趋势图展示，替代 mock 数据。

## ADDED Requirements

### Requirement: 聚合统计接口

后端 SHALL 提供 `GET /api/analytics/summary` 接口，返回当前用户的聚合统计：
累计活跃天数、本周活跃天数、连续活跃天数、累计对话消息数、累计 xp；数据 SHALL
由数据库聚合计算得出，SHALL NOT 读取任何 mock 常量。接口 SHALL 要求 JWT 认证，
仅返回当前认证用户自己的数据。

- **GIVEN** 用户已登录且存在学习对话记录
- **WHEN** 前端请求 `GET /api/analytics/summary`
- **THEN** 接口返回 200 与该用户的聚合统计字段，数值与数据库聚合结果一致

#### Scenario: 未认证访问

- **GIVEN** 请求未携带有效 JWT
- **WHEN** 请求 `GET /api/analytics/summary`
- **THEN** 接口返回 401，响应体不含任何统计数据

#### Scenario: 新用户无任何记录

- **GIVEN** 用户已注册但无任何对话记录
- **WHEN** 请求 `GET /api/analytics/summary`
- **THEN** 接口返回 200，各统计字段为 0，SHALL NOT 返回 null 或报错

### Requirement: 活跃日定义

系统 SHALL 将「活跃日」定义为：当日至少产生 1 条该用户的对话消息；
累计活跃天数、周/月活跃统计、日历打卡 SHALL 基于该统一定义计算。

#### Scenario: 当日有对话记录

- **GIVEN** 用户在当天产生了至少 1 条对话消息
- **WHEN** 统计活跃状态
- **THEN** 当天被计为一个活跃日

#### Scenario: 当日无对话记录

- **GIVEN** 用户当天没有任何对话消息
- **WHEN** 统计活跃状态
- **THEN** 当天不计入活跃日

### Requirement: 概览统计卡片展示

学习数据页 SHALL 展示统计概览卡片，读取 `GET /api/analytics/summary` 返回的
真实数据渲染；页面 SHALL 展示加载态直至数据返回。

#### Scenario: 正常渲染统计卡片

- **GIVEN** 接口返回完整统计数据
- **WHEN** 用户打开学习数据页
- **THEN** 概览卡片渲染各统计项的数值与标题，与接口返回值一致

#### Scenario: 接口加载中

- **WHEN** 统计接口尚未返回
- **THEN** 卡片区域展示加载态占位，SHALL NOT 显示空数值或报错

### Requirement: 周/月活跃趋势图

学习数据页 SHALL 提供周/月两种维度的活跃趋势图，默认展示周视图；趋势数据 SHALL
来自 `GET /api/analytics/trend`（按日对话消息数聚合），SHALL 使用 SVG/CSS 实现，
SHALL NOT 引入第三方图表库。

- **GIVEN** 用户已登录
- **WHEN** 请求 `GET /api/analytics/trend?period=week`
- **THEN** 接口返回 200 与近 7 个自然日各日的对话消息数序列

#### Scenario: 切换周视图与月视图

- **WHEN** 用户点击「周」或「月」标签
- **THEN** 趋势图重新渲染对应维度的活跃数据，无需刷新页面

#### Scenario: 区间内无活跃数据

- **GIVEN** 所选周期内用户没有任何活跃日
- **WHEN** 用户查看该周期趋势图
- **THEN** 图表区域展示「暂无学习数据」空态文案，不渲染空坐标轴

### Requirement: 后端不可用降级

后端统计接口不可用或返回错误时，学习数据页 SHALL 展示明确的错误提示与重试
入口，SHALL NOT 崩溃，SHALL NOT 用 mock 数据冒充真实数据。

#### Scenario: 接口请求失败

- **GIVEN** 后端服务不可达或返回 5xx
- **WHEN** 用户打开学习数据页
- **THEN** 页面展示错误提示与重试按钮，点击重试重新发起请求

#### Scenario: 重试成功恢复展示

- **GIVEN** 页面处于错误提示态
- **WHEN** 后端恢复且用户点击重试
- **THEN** 页面重新加载并正常渲染统计数据
