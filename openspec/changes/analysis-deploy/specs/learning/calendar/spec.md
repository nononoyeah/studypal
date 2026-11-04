# Spec Delta

## Purpose

学习日历：按月展示用户学习活跃日打卡情况，数据由后端按「活跃日」定义聚合返回，
帮助用户直观查看学习坚持度。

## ADDED Requirements

### Requirement: 活跃日历接口

后端 SHALL 提供 `GET /api/analytics/calendar` 接口，接受 `month` 参数
（格式 `YYYY-MM`），返回该月内各日的活跃状态与每日对话消息数；接口 SHALL 要求
JWT 认证，仅返回当前用户数据。

- **GIVEN** 用户已登录
- **WHEN** 请求 `GET /api/analytics/calendar?month=2026-11`
- **THEN** 接口返回 200 与 2026 年 11 月各日的活跃状态数据

#### Scenario: 非法月份参数

- **GIVEN** 请求携带的 `month` 不是合法的 `YYYY-MM` 格式
- **WHEN** 请求 `GET /api/analytics/calendar`
- **THEN** 接口返回 400 与明确的错误信息，SHALL NOT 返回部分数据

#### Scenario: 未认证访问

- **GIVEN** 请求未携带有效 JWT
- **WHEN** 请求 `GET /api/analytics/calendar`
- **THEN** 接口返回 401，响应体不含任何日历数据

### Requirement: 月历打卡展示

学习日历组件 SHALL 以月历形式展示当月各日的学习活跃状态：活跃日 SHALL 以
打卡样式（高亮/标记）区分于非活跃日；今日 SHALL 有明确标识；未来的日期 SHALL
以未发生样式展示，SHALL NOT 标记为活跃。

#### Scenario: 正常渲染月历

- **GIVEN** 接口返回当月日历数据
- **WHEN** 用户查看学习日历
- **THEN** 月历按日网格渲染，活跃日呈打卡样式，非活跃日呈普通样式

#### Scenario: 今日标识与未来日期

- **WHEN** 用户查看当月月历
- **THEN** 今日有明确标识，今日之后的日期呈未发生样式且无打卡标记

### Requirement: 月份切换

用户 SHALL 能在学习日历上切换查看上一个/下一个月份；切换 SHALL 重新请求对应
月份数据；查看未来月份时 SHALL 展示空月历。

#### Scenario: 切换到上一月

- **WHEN** 用户点击「上一月」控件
- **THEN** 日历重新渲染上月网格与该月活跃数据

#### Scenario: 查看未来月份

- **WHEN** 用户切换到晚于当前月的月份
- **THEN** 日历渲染该月空网格，所有日期无打卡标记，页面不报错

### Requirement: 日历加载失败降级

日历接口不可用或返回错误时，日历区域 SHALL 展示错误提示与重试入口，
SHALL NOT 崩溃或渲染错乱的月份网格。

#### Scenario: 接口请求失败

- **GIVEN** 日历接口不可达或返回 5xx
- **WHEN** 用户查看学习日历
- **THEN** 日历区域展示错误提示与重试按钮，月历网格不渲染错误数据
