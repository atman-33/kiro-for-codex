# AgentManager 单元测试用例

## 测试文件

`agentManager.test.ts`

## 测试目的

确保 AgentManager 服务正确管理 Claude Code agents，包括内置 agents 初始化、agent 列表获取、路径管理、文件操作等核心功能。该模块负责管理项目级和用户级的 agents，是 agents 系统的核心管理器。

## 测试用例概览

| 用例 ID   | 功能描述                 | 测试类型 |
| --------- | ------------------------ | -------- |
| TC-AM-001 | 构造函数初始化           | 正向测试 |
| TC-AM-002 | 成功初始化内置 agents    | 正向测试 |
| TC-AM-003 | 跳过已存在的内置 agents  | 正向测试 |
| TC-AM-004 | 处理初始化错误           | 异常测试 |
| TC-AM-005 | 获取项目级 agents        | 正向测试 |
| TC-AM-006 | 获取用户级 agents        | 正向测试 |
| TC-AM-007 | 处理空目录               | 边界测试 |
| TC-AM-008 | 解析 YAML frontmatter    | 正向测试 |
| TC-AM-009 | 获取项目级 agent 路径    | 正向测试 |
| TC-AM-010 | 获取用户级 agent 路径    | 正向测试 |
| TC-AM-011 | 检查 agent 存在性        | 正向测试 |
| TC-AM-012 | 初始化 system prompts    | 正向测试 |
| TC-AM-013 | 处理已存在的 prompt 文件 | 正向测试 |
| TC-AM-014 | 处理无效的 YAML          | 异常测试 |
| TC-AM-015 | 处理文件读取权限问题     | 异常测试 |
| TC-AM-016 | 处理空的工作区           | 边界测试 |

## 测试环境

- 测试框架：Jest
- 模拟：vscode API、文件系统操作
- 测试数据：模拟的 agent 文件和配置

## 测试用例

### 1. 构造函数和初始化

#### TC-AM-001: 构造函数初始化

- **描述**: 验证 AgentManager 正确初始化
- **前置条件**: 有效的工作区路径和输出通道
- **测试步骤**:
  1. 创建 AgentManager 实例
  2. 验证内部属性正确设置
- **预期结果**:
  - workspaceRoot 正确设置
  - outputChannel 正确设置

### 2. 内置 Agents 初始化

#### TC-AM-002: 成功初始化内置 agents

- **描述**: 验证内置 agents 成功从资源目录复制
- **前置条件**:
  - 资源目录存在内置 agents
  - 目标目录不存在内置 agents
- **测试步骤**:
  1. 调用 initializeBuiltInAgents()
  2. 验证文件复制操作
- **预期结果**:
  - 创建 .claude/agents/kfc 目录
  - 复制所有内置 agent 文件
  - 输出成功日志

#### TC-AM-003: 跳过已存在的内置 agents

- **描述**: 验证已存在的 agents 不会被覆盖
- **前置条件**: 目标目录已存在部分 agents
- **测试步骤**:
  1. 创建部分 agent 文件
  2. 调用 initializeBuiltInAgents()
  3. 验证文件操作
- **预期结果**:
  - 已存在的文件被跳过
  - 只复制缺失的文件
  - 输出相应日志

#### TC-AM-004: 处理初始化错误

- **描述**: 验证初始化过程中的错误处理
- **前置条件**: 模拟文件系统错误
- **测试步骤**:
  1. 模拟 fs 操作抛出错误
  2. 调用 initializeBuiltInAgents()
- **预期结果**:
  - 捕获并记录错误
  - 不抛出异常

### 3. Agent 列表获取

#### TC-AM-005: 获取项目级 agents

- **描述**: 验证正确获取项目级 agents
- **前置条件**: 项目 .claude/agents 目录包含 agent 文件
- **测试步骤**:
  1. 创建模拟 agent 文件
  2. 调用 getAgentList('project')
  3. 验证返回的列表
- **预期结果**:
  - 返回所有项目级 agents
  - 正确解析 YAML frontmatter
  - 包含路径信息

#### TC-AM-006: 获取用户级 agents

- **描述**: 验证正确获取用户级 agents
- **前置条件**: 用户目录 ~/.claude/agents 包含 agent 文件
- **测试步骤**:
  1. 模拟用户目录 agent 文件
  2. 调用 getAgentList('user')
  3. 验证返回的列表
- **预期结果**:
  - 返回所有用户级 agents
  - 递归读取子目录
  - 正确解析元数据

#### TC-AM-007: 处理空目录

- **描述**: 验证空目录返回空列表
- **前置条件**: agents 目录不存在或为空
- **测试步骤**:
  1. 确保目录为空
  2. 调用 getAgentList()
- **预期结果**: 返回空数组

#### TC-AM-008: 解析 YAML frontmatter

- **描述**: 验证正确解析不同格式的 YAML
- **前置条件**: 准备不同格式的 agent 文件
- **测试步骤**:
  1. 创建包含各种 YAML 格式的文件
  2. 调用 readAgentsRecursively()
  3. 验证解析结果
- **预期结果**:
  - 正确解析 name、description
  - 正确处理 tools 数组和字符串
  - 处理缺失字段

### 4. Agent 路径管理

#### TC-AM-009: 获取项目级 agent 路径

- **描述**: 验证正确生成项目级 agent 路径
- **前置条件**: 有效的工作区
- **测试步骤**:
  1. 调用 getAgentPath('test-agent', 'project')
  2. 验证返回路径
- **预期结果**: 返回 {workspace}/.claude/agents/test-agent.md

#### TC-AM-010: 获取用户级 agent 路径

- **描述**: 验证正确生成用户级 agent 路径
- **前置条件**: 有效的用户目录
- **测试步骤**:
  1. 调用 getAgentPath('test-agent', 'user')
  2. 验证返回路径
- **预期结果**: 返回 ~/.claude/agents/test-agent.md

#### TC-AM-011: 检查 agent 存在性

- **描述**: 验证 checkAgentExists 方法
- **前置条件**: 准备存在和不存在的 agent 文件
- **测试步骤**:
  1. 创建测试 agent 文件
  2. 调用 checkAgentExists() 检查存在的文件
  3. 调用 checkAgentExists() 检查不存在的文件
- **预期结果**:
  - 存在的文件返回 true
  - 不存在的文件返回 false

### 5. System Prompt 初始化

#### TC-AM-012: 初始化 system prompts

- **描述**: 验证 system prompt 文件复制
- **前置条件**: 资源目录包含 prompt 文件
- **测试步骤**:
  1. 调用 initializeSystemPrompts()
  2. 验证文件复制
- **预期结果**:
  - 创建 .claude/prompts 目录
  - 复制 spec-workflow-starter.md
  - 输出成功日志

#### TC-AM-013: 处理已存在的 prompt 文件

- **描述**: 验证不覆盖已存在的文件
- **前置条件**: 目标文件已存在
- **测试步骤**:
  1. 创建已存在的 prompt 文件
  2. 调用 initializeSystemPrompts()
- **预期结果**:
  - 跳过已存在的文件
  - 输出跳过日志

### 6. 边界情况和错误处理

#### TC-AM-014: 处理无效的 YAML

- **描述**: 验证处理格式错误的 YAML
- **前置条件**: 创建包含无效 YAML 的文件
- **测试步骤**:
  1. 创建格式错误的 agent 文件
  2. 调用 getAgentList()
- **预期结果**:
  - 不抛出异常
  - 记录错误日志
  - 跳过无效文件

#### TC-AM-015: 处理文件读取权限问题

- **描述**: 验证处理无权限读取的文件
- **前置条件**: 模拟文件读取权限错误
- **测试步骤**:
  1. 模拟 fs.readFileSync 抛出权限错误
  2. 调用相关方法
- **预期结果**:
  - 捕获错误
  - 记录错误信息
  - 继续处理其他文件

#### TC-AM-016: 处理空的工作区

- **描述**: 验证在无工作区时的行为
- **前置条件**: workspaceRoot 为 undefined
- **测试步骤**:
  1. 创建无工作区的 AgentManager
  2. 调用各种方法
- **预期结果**:
  - 方法正常返回
  - 不执行项目级操作
  - 用户级操作正常工作
