# login-ui Specification

## Purpose

前端登录能力：用户通过登录/注册页面完成身份认证，凭据安全保存在本地并在过期时自动恢复，受保护页面可引导未登录用户进入登录流程并在认证后回跳。

## Requirements

### Requirement: 登录与注册页面

平台 SHALL 提供登录/注册二合一页面：同一表单可切换「登录」与「注册」模式，表单校验规则 SHALL 与后端一致（用户名 1-50 字符、密码 8-128 字符），校验失败 SHALL 在提交前就地提示；登录成功 SHALL 存储 access token 与 refresh token 并跳转到登录前意图访问的页面（无明确意图时跳转对话页面）；注册成功 SHALL 自动使用同一凭据完成登录并跳转；凭据错误（密码错误、用户不存在、用户名已注册）SHALL 展示后端返回的错误信息且不跳转。

#### Scenario: 登录成功

- **GIVEN** 用户在登录模式下输入正确的用户名与密码
- **WHEN** 用户提交表单
- **THEN** access token 与 refresh token 保存到本地，页面跳转到登录前意图访问的页面（无意图时为对话页面）

#### Scenario: 注册成功自动登录

- **GIVEN** 用户在注册模式下输入符合规则的新用户名与密码
- **WHEN** 用户提交表单
- **THEN** 注册完成并自动登录，token 已保存，页面跳转到对话页面

#### Scenario: 凭据错误提示

- **GIVEN** 用户提交的凭据错误（密码错误、用户不存在）或注册时用户名已被占用
- **WHEN** 后端返回错误
- **THEN** 页面就地展示错误信息，停留在当前表单，不发生跳转

#### Scenario: 前端校验拦截

- **GIVEN** 用户输入为空、用户名超长或密码不足 8 位
- **WHEN** 用户提交表单
- **THEN** 表单就地提示校验错误，不发起网络请求

### Requirement: Token 存储与过期恢复

前端 SHALL 将 access token 与 refresh token 保存在浏览器本地存储；受保护请求收到 401 时 SHALL 使用 refresh token 自动刷新 access token 并重放原请求，恢复后用户无感知；刷新失败（refresh token 无效或过期）SHALL 清除本地凭据并引导用户重新登录。

#### Scenario: access token 过期自动恢复

- **GIVEN** 用户已登录且 access token 已过期但 refresh token 有效
- **WHEN** 用户发起受保护请求
- **THEN** 前端自动刷新 access token 并成功完成原请求，用户无感知

#### Scenario: refresh token 失效重新登录

- **GIVEN** refresh token 无效或已过期
- **WHEN** 任一受保护请求触发刷新失败
- **THEN** 本地凭据被清除，用户被引导至登录页面重新认证

#### Scenario: 并发请求仅刷新一次

- **GIVEN** 多个受保护请求同时收到 401
- **WHEN** 触发 token 刷新
- **THEN** 仅发起一次刷新请求，全部请求在刷新完成后重放成功

### Requirement: 受保护页面访问控制

未登录用户 SHALL NOT 直接使用受保护页面功能：访问对话页面时 SHALL 展示登录引导并提供跳转登录页入口；登录成功后 SHALL 回跳到此前意图访问的受保护页面。

#### Scenario: 未登录访问对话页

- **WHEN** 未登录用户访问对话页面
- **THEN** 页面展示登录引导与「去登录」入口，不展示对话输入区

#### Scenario: 登录后回跳

- **GIVEN** 用户从对话页引导进入登录页
- **WHEN** 登录成功
- **THEN** 页面跳转回对话页，对话功能可用

### Requirement: 退出登录

已登录用户 SHALL 能在对话页面执行退出登录：本地凭据被清除，页面回到首页，受保护页面恢复为未登录状态。

#### Scenario: 退出登录

- **WHEN** 已登录用户在对话页面点击退出登录
- **THEN** 本地存储的凭据被清除，页面跳转回首页，再次进入对话页时显示登录引导
