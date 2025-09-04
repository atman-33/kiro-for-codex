# AgentsExplorerProvider 单元测试用例

## 测试文件

`agentsExplorerProvider.test.ts`

## 测试目的

确保 AgentsExplorerProvider 正确实现 VSCode TreeDataProvider 接口，提供 agents 的树形视图展示功能。该模块负责在 VSCode 侧边栏中展示用户级和项目级的 agents，并提供交互功能。

## 测试用例概览

| 用例 ID    | 功能描述                   | 测试类型 |
| ---------- | -------------------------- | -------- |
| TC-AEP-001 | 构造函数初始化             | 正向测试 |
| TC-AEP-002 | 获取根节点（用户和项目组） | 正向测试 |
| TC-AEP-003 | 显示 loading 状态          | 正向测试 |
| TC-AEP-004 | 获取组内的 agents          | 正向测试 |
| TC-AEP-005 | 处理无工作区情况           | 边界测试 |
| TC-AEP-006 | Agent 节点属性             | 正向测试 |
| TC-AEP-007 | 组节点属性                 | 正向测试 |
| TC-AEP-008 | 设置项目 agents 文件监视   | 正向测试 |
| TC-AEP-009 | 设置用户 agents 文件监视   | 正向测试 |
| TC-AEP-010 | 文件变化触发刷新           | 正向测试 |
| TC-AEP-011 | 手动刷新功能               | 正向测试 |
| TC-AEP-012 | 刷新时数据更新             | 正向测试 |
| TC-AEP-013 | 处理 AgentManager 错误     | 异常测试 |
| TC-AEP-014 | 处理文件监视器创建失败     | 异常测试 |
| TC-AEP-015 | dispose 方法清理资源       | 正向测试 |

## 测试环境

- 测试框架：Jest
- 模拟：vscode TreeDataProvider API、AgentManager、文件监视器
- 测试数据：模拟的 agent 列表和树节点

## 测试用例

### 1. 构造函数和初始化

#### TC-AEP-001: 构造函数初始化

- **描述**: 验证 AgentsExplorerProvider 正确初始化
- **前置条件**: 有效的 context、agentManager 和 outputChannel
- **测试步骤**:
  1. 创建 AgentsExplorerProvider 实例
  2. 验证文件监视器设置
- **预期结果**:
  - 实例正确创建
  - 文件监视器正确设置

### 2. 树形结构生成

#### TC-AEP-002: 获取根节点（用户和项目组）

- **描述**: 验证根级别显示用户和项目 agent 组
- **前置条件**: 有工作区文件夹
- **测试步骤**:
  1. 调用 getChildren() 无参数
  2. 验证返回的节点
- **预期结果**:
  - 返回两个节点：User Agents 和 Project Agents
  - User Agents 在前，Project Agents 在后
  - 正确的图标和展开状态

#### TC-AEP-003: 显示 loading 状态

- **描述**: 验证刷新时显示 loading 动画
- **前置条件**: 调用 refresh() 方法
- **测试步骤**:
  1. 调用 refresh()
  2. 立即调用 getChildren()
  3. 等待 loading 完成后再次调用
- **预期结果**:
  - 第一次返回 loading 节点
  - loading 节点使用 sync~spin 图标
  - 完成后返回正常节点

#### TC-AEP-004: 获取组内的 agents

- **描述**: 验证获取特定组下的 agent 列表
- **前置条件**: AgentManager 返回模拟 agents
- **测试步骤**:
  1. 创建组节点
  2. 调用 getChildren(groupNode)
  3. 验证返回的 agent 节点
- **预期结果**:
  - 返回对应类型的所有 agents
  - 每个 agent 节点包含正确信息
  - 使用 robot 图标

#### TC-AEP-005: 处理无工作区情况

- **描述**: 验证无工作区时返回空列表
- **前置条件**: vscode.workspace.workspaceFolders 为 undefined
- **测试步骤**:
  1. 模拟无工作区
  2. 调用 getChildren()
- **预期结果**: 返回空数组

### 3. 树节点属性

#### TC-AEP-006: Agent 节点属性

- **描述**: 验证 agent 节点的属性设置
- **前置条件**: 创建包含完整信息的 agent
- **测试步骤**:
  1. 创建 AgentItem 实例
  2. 验证各属性
- **预期结果**:
  - 正确的标签和图标
  - tooltip 显示描述
  - description 显示工具数量
  - 包含打开文件的命令

#### TC-AEP-007: 组节点属性

- **描述**: 验证组节点的属性设置
- **前置条件**: 创建用户组和项目组节点
- **测试步骤**:
  1. 创建不同类型的组节点
  2. 验证属性
- **预期结果**:
  - User Agents 使用 globe 图标
  - Project Agents 使用 root-folder 图标
  - 正确的 tooltip 文本

### 4. 文件监视功能

#### TC-AEP-008: 设置项目 agents 文件监视

- **描述**: 验证项目 agents 目录监视器设置
- **前置条件**: 有工作区文件夹
- **测试步骤**:
  1. 创建 provider 实例
  2. 验证文件监视器创建
- **预期结果**:
  - 创建 .claude/agents/**/*.md 监视器
  - 监听 create、change、delete 事件

#### TC-AEP-009: 设置用户 agents 文件监视

- **描述**: 验证用户 agents 目录监视器设置
- **前置条件**: 用户目录存在
- **测试步骤**:
  1. 创建 provider 实例
  2. 验证用户目录监视器
- **预期结果**:
  - 创建 ~/.claude/agents/**/*.md 监视器
  - 处理监视器创建错误

#### TC-AEP-010: 文件变化触发刷新

- **描述**: 验证文件变化触发视图刷新
- **前置条件**: 文件监视器已设置
- **测试步骤**:
  1. 触发文件创建事件
  2. 触发文件修改事件
  3. 触发文件删除事件
- **预期结果**:
  - 每个事件触发 _onDidChangeTreeData
  - 不显示 loading 动画

### 5. 刷新机制

#### TC-AEP-011: 手动刷新功能

- **描述**: 验证手动刷新显示 loading 动画
- **前置条件**: Provider 已初始化
- **测试步骤**:
  1. 调用 refresh() 方法
  2. 验证 loading 状态
  3. 验证完成后状态
- **预期结果**:
  - 设置 isLoading 为 true
  - 触发树更新事件
  - 100ms 后恢复正常

#### TC-AEP-012: 刷新时数据更新

- **描述**: 验证刷新后显示最新数据
- **前置条件**: AgentManager 数据已更新
- **测试步骤**:
  1. 更新 AgentManager 返回数据
  2. 调用 refresh()
  3. 验证新数据显示
- **预期结果**: 显示更新后的 agent 列表

### 6. 错误处理

#### TC-AEP-013: 处理 AgentManager 错误

- **描述**: 验证处理 AgentManager 抛出的错误
- **前置条件**: AgentManager.getAgentList 抛出错误
- **测试步骤**:
  1. 模拟 getAgentList 抛出错误
  2. 调用 getChildren()
- **预期结果**:
  - 捕获错误
  - 返回空列表或错误节点
  - 记录错误日志

#### TC-AEP-014: 处理文件监视器创建失败

- **描述**: 验证文件监视器创建失败的处理
- **前置条件**: createFileSystemWatcher 抛出错误
- **测试步骤**:
  1. 模拟创建监视器失败
  2. 创建 provider 实例
- **预期结果**:
  - 捕获错误
  - 记录错误信息
  - Provider 仍能正常工作

### 7. 资源清理

#### TC-AEP-015: dispose 方法清理资源

- **描述**: 验证 dispose 正确清理资源
- **前置条件**: Provider 已创建并设置监视器
- **测试步骤**:
  1. 创建 provider
  2. 调用 dispose()
  3. 验证资源清理
- **预期结果**:
  - 文件监视器被 dispose
  - 不再响应文件变化
