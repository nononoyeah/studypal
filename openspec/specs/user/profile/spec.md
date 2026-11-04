# profile Specification

## Purpose

定义受保护的用户 Profile 能力：头像、连续学习天数（streak）、用户等级（level）
的读取与更新行为，及 streak / level 的计算口径。

## Requirements

### Requirement: 读取用户 Profile

系统 SHALL 提供受保护的 Profile 读取端点，返回当前认证用户的头像 URL、
连续学习天数（streak）与用户等级（level）。未认证请求 MUST 被拒绝。

#### Scenario: 读取成功

- **GIVEN** 用户已认证并持有有效 access token
- **WHEN** 客户端请求 Profile 端点
- **THEN** 系统返回 200，包含头像 URL、streak、level 字段

#### Scenario: 未认证访问

- **GIVEN** 请求未携带 token 或 token 无效
- **WHEN** 客户端请求 Profile 端点
- **THEN** 系统返回 401 错误，不返回任何 Profile 数据

### Requirement: 更新头像

系统 SHALL 允许认证用户更新自己的头像 URL，仅影响当前用户。
URL MUST 通过基本格式校验；其他 Profile 字段（streak、level）MUST NOT
可通过该端点直接修改。

#### Scenario: 更新头像成功

- **GIVEN** 用户已认证，提交合法的头像 URL
- **WHEN** 客户端提交更新请求
- **THEN** 系统返回 200 与更新后的完整 Profile

#### Scenario: 非法 URL 格式

- **GIVEN** 用户提交的值不是合法 URL
- **WHEN** 客户端提交更新请求
- **THEN** 系统返回 422 校验错误，头像保持原值

### Requirement: streak 计算口径

streak SHALL 由后端在登录时计算：首版本以注册日为 streak 起点，
同一自然日内的重复登录不重复累计，跨自然日登录 SHALL 使 streak 加 1。
本版本不关联学习行为分析，仅维护存储与返回口径。

#### Scenario: 当日重复登录

- **GIVEN** 用户当日已登录过一次且 streak 已记录
- **WHEN** 用户在同一天内再次登录
- **THEN** streak 保持不变

#### Scenario: 跨日登录累计

- **GIVEN** 用户上次登录为昨天且 streak 为 N
- **WHEN** 用户今天登录
- **THEN** streak 变为 N + 1

#### Scenario: 断签后重新登录

- **GIVEN** 用户上次登录在两天或更早之前且 streak 为 N
- **WHEN** 用户今天登录
- **THEN** streak 重置为 1（以本次登录为新起点）

### Requirement: 用户等级映射

level SHALL 由经验值（xp）按固定区间映射得出，随 Profile 一并返回。
本版本 xp 仅有存储字段且默认为 0，无自动增长来源（学习行为联动为后续
独立 change）。

#### Scenario: 默认等级

- **GIVEN** 新注册用户 xp 为 0
- **WHEN** 客户端读取 Profile
- **THEN** 返回的 level 为映射区间的最低等级（1 级）

#### Scenario: xp 变化后等级重算

- **GIVEN** 用户 xp 被更新至更高区间的阈值
- **WHEN** 客户端读取 Profile
- **THEN** 返回按映射表重算后的等级
