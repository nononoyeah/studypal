# Spec Delta

## Purpose

成就系统：基于用户聚合学习数据（xp、连续活跃天数、累计对话数、累计活跃天数）
由服务端派生成就徽章与解锁状态，展示学习里程碑，激励持续学习。

## ADDED Requirements

### Requirement: 成就接口

后端 SHALL 提供 `GET /api/analytics/achievements` 接口，返回当前用户的成就
列表：每项含成就名称、描述、解锁状态、目标值与当前进度值；解锁状态 SHALL 由
服务端根据聚合数据计算，SHALL NOT 由前端判定或使用 mock 常量。接口 SHALL 要求
JWT 认证。

- **GIVEN** 用户已登录且存在学习记录
- **WHEN** 请求 `GET /api/analytics/achievements`
- **THEN** 接口返回 200 与完整成就列表，各成就的进度值与解锁状态由服务端计算得出

#### Scenario: 未认证访问

- **GIVEN** 请求未携带有效 JWT
- **WHEN** 请求 `GET /api/analytics/achievements`
- **THEN** 接口返回 401，响应体不含任何成就数据

#### Scenario: 新用户全部未解锁

- **GIVEN** 用户已注册但无任何学习记录
- **WHEN** 请求 `GET /api/analytics/achievements`
- **THEN** 接口返回 200，全部成就解锁状态为未解锁、进度值为 0，SHALL NOT 报错

### Requirement: 成就列表展示

学习分析区 SHALL 展示成就列表：已解锁成就 SHALL 以解锁样式（彩色徽章）展示，
未解锁成就 SHALL 以灰态展示并显示进度（当前值/目标值）；成就 SHALL 覆盖
累计 xp、连续活跃天数、累计对话消息数、累计活跃天数四类维度。

#### Scenario: 正常渲染成就列表

- **GIVEN** 接口返回成就列表
- **WHEN** 用户查看成就区域
- **THEN** 已解锁成就呈彩色徽章样式，未解锁成就呈灰态并展示「当前值/目标值」进度

#### Scenario: 接口加载中

- **WHEN** 成就接口尚未返回
- **THEN** 成就区域展示加载态占位，SHALL NOT 渲染空列表或报错

### Requirement: 解锁状态正确性

当某成就的进度值达到目标值时，服务端 SHALL 将其判定为已解锁；进度值未达标时
SHALL 判定为未解锁；判定 SHALL 在每次请求时基于最新聚合数据计算。

#### Scenario: 进度达标解锁

- **GIVEN** 某成就目标为累计活跃 7 天，用户已累计活跃 7 天
- **WHEN** 请求成就接口
- **THEN** 该成就返回已解锁状态

#### Scenario: 进度未达标保持未解锁

- **GIVEN** 某成就目标为累计活跃 7 天，用户已累计活跃 3 天
- **WHEN** 请求成就接口
- **THEN** 该成就返回未解锁状态，进度展示 3/7

### Requirement: 成就加载失败降级

成就接口不可用或返回错误时，成就区域 SHALL 展示错误提示与重试入口，
SHALL NOT 崩溃，SHALL NOT 以本地推断的解锁状态冒充服务端结果。

#### Scenario: 接口请求失败

- **GIVEN** 成就接口不可达或返回 5xx
- **WHEN** 用户查看成就区域
- **THEN** 成就区域展示错误提示与重试按钮，不渲染任何徽章样式列表
