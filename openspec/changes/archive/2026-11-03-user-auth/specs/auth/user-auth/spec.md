# Spec Delta

## Purpose

定义 StudyPal 用户认证能力：用户注册、登录、JWT access/refresh token 签发与刷新、
密码安全存储。为平台后续所有受保护功能提供身份前提。

## ADDED Requirements

### Requirement: 用户注册

系统 SHALL 提供注册端点，接受用户名与密码，创建用户账号并返回成功标识。
用户名 MUST 在系统内唯一，密码 MUST 在存储前经哈希处理，任何环节 MUST NOT
以明文形式持久化密码。

#### Scenario: 注册成功

- **GIVEN** 用户名未被注册且密码满足最低长度要求（8 位）
- **WHEN** 客户端提交注册请求
- **THEN** 系统创建用户记录，密码以哈希形式存储，返回 201 与用户基础信息（不含密码字段）

#### Scenario: 用户名重复

- **GIVEN** 该用户名已存在
- **WHEN** 客户端以相同用户名提交注册请求
- **THEN** 系统返回 409 错误，不创建新用户，不泄露该账号是否存在之外的敏感信息

#### Scenario: 参数校验失败

- **GIVEN** 用户名为空、密码少于 8 位
- **WHEN** 客户端提交注册请求
- **THEN** 系统返回 422 校验错误，指明不满足要求的字段

### Requirement: 用户登录

系统 SHALL 提供登录端点，校验用户名与密码；校验通过后 MUST 同时签发
access token 与 refresh token（JWT），并在响应中返回用户基础信息。
登录行为 SHALL 作为连续学习天数（streak）的累计触发点。

#### Scenario: 登录成功

- **GIVEN** 用户已注册且密码正确
- **WHEN** 客户端提交登录请求
- **THEN** 系统返回 200，包含 access token、refresh token 与用户基础信息

#### Scenario: 密码错误

- **GIVEN** 用户名存在但密码不正确
- **WHEN** 客户端提交登录请求
- **THEN** 系统返回 401 错误，不签发任何 token，错误信息不区分「密码错误」与「用户不存在」

#### Scenario: 用户不存在

- **GIVEN** 用户名未注册
- **WHEN** 客户端提交登录请求
- **THEN** 系统返回 401 错误，响应内容与密码错误的场景保持一致

### Requirement: Token 刷新

系统 SHALL 提供刷新端点，接受有效的 refresh token 并签发新的 access token。
refresh token MUST 具备独立于 access token 的类型标识，access token MUST NOT
可用于刷新。

#### Scenario: 刷新成功

- **GIVEN** 客户端持有未过期、类型正确的 refresh token
- **WHEN** 客户端提交刷新请求
- **THEN** 系统返回 200 与新的 access token

#### Scenario: refresh token 无效或过期

- **GIVEN** refresh token 已过期、签名不合法或类型不正确
- **WHEN** 客户端提交刷新请求
- **THEN** 系统返回 401 错误，不签发新 token

#### Scenario: 使用 access token 冒充 refresh token

- **GIVEN** 客户端提交 access token 作为刷新凭据
- **WHEN** 客户端提交刷新请求
- **THEN** 系统返回 401 错误

### Requirement: 受保护端点的身份校验

需要身份的端点（含用户 Profile）SHALL 校验请求中的 access token；
缺失、过期、签名不合法的 token MUST 被拒绝且不返回任何业务数据。

#### Scenario: 携带有效 token 访问受保护端点

- **GIVEN** 请求头携带有效未过期的 access token
- **WHEN** 客户端请求受保护端点
- **THEN** 系统正常处理请求并返回业务数据

#### Scenario: 缺失或无效 token

- **GIVEN** 请求头缺失 token，或 token 过期、被篡改
- **WHEN** 客户端请求受保护端点
- **THEN** 系统返回 401 错误，不执行业务逻辑

### Requirement: 密码安全存储

系统 MUST 使用带盐的自适应哈希算法（如 bcrypt/argon2）存储密码，
用户查询、日志、响应中 MUST NOT 出现明文密码或可还原的哈希原文之外的密码信息。

#### Scenario: 存储内容检查

- **GIVEN** 任一用户完成注册
- **WHEN** 检查数据库中的用户记录
- **THEN** 密码字段为哈希值，无明文密码
