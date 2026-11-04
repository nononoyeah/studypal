# ai-suggestions Specification

## Purpose

AI 建议学习面板的 mock 静态展示：以 mock 数据渲染建议内容，本阶段无任何真实
AI 调用。

## Requirements

### Requirement: AI 建议面板静态展示

首页 SHALL 展示「AI 建议学习面板」，渲染 2-3 条学习建议卡片（建议标题、简述、
行动标签）；内容 SHALL 读取自 `src/content/` 下的 mock 常量，SHALL NOT 发起
任何网络请求或调用任何 AI 服务。

#### Scenario: 正常渲染建议卡片

- **GIVEN** mock 建议数据存在且包含 2-3 条记录
- **WHEN** 用户打开首页
- **THEN** 建议卡片按顺序渲染标题、简述与行动标签

#### Scenario: Mock 来源标识

- **WHEN** 用户查看 AI 建议面板
- **THEN** 面板展示「示例数据」标识，明确内容来自 mock 而非真实 AI

#### Scenario: mock 数据字段缺失

- **GIVEN** 某条建议的简述字段缺失
- **WHEN** 用户打开首页
- **THEN** 该卡片渲染标题并隐藏简述行，其余卡片正常展示，页面不崩溃

### Requirement: 建议行动标签跳转

每条建议卡片的行动标签 SHALL 可点击并锚点跳转至对应的学习模块区域；若目标
锚点不存在，页面 SHALL 停留在当前区域且无报错。

#### Scenario: 点击行动标签跳转

- **WHEN** 用户点击某条建议的行动标签
- **THEN** 页面平滑滚动至对应的学习模块锚点区域

#### Scenario: 行动标签指向不存在的锚点

- **WHEN** 用户点击一个指向不存在锚点的行动标签
- **THEN** 页面停留在当前位置，控制台无报错，面板布局不发生变化
