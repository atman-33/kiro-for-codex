# Prompt 快照测试用例

## 测试文件

`promptSnapshots.test.ts`

## 测试目的

使用 Jest 快照测试功能确保所有 prompt 模板的输出保持稳定，防止意外的内容改动影响用户体验。快照测试会保存每个 prompt 的完整渲染输出，并在后续运行时进行比较。

## 测试用例概览

| 用例 ID | 功能描述                               | 测试类型 |
| ------- | -------------------------------------- | -------- |
| INT-15  | create spec prompt 快照测试            | 回归测试 |
| INT-16  | init steering prompt 快照测试          | 回归测试 |
| INT-17  | create custom steering prompt 快照测试 | 回归测试 |
| INT-18  | refine steering prompt 快照测试        | 回归测试 |
| INT-19  | delete steering prompt 快照测试        | 回归测试 |

## 详细测试步骤

### INT-15: create spec prompt 快照测试

**测试目的**: 确保 spec 创建 prompt 的输出保持稳定

**准备数据**:

```typescript
{
  description: 'User authentication with JWT',
  workspacePath: '/snapshot/test',
  specBasePath: '.claude/specs'
}
```

**测试步骤**:

1. 初始化 PromptLoader
2. 渲染 create-spec prompt
3. 使用 `toMatchSnapshot()` 比较输出

**预期结果**:

- 第一次运行：创建快照文件
- 后续运行：输出与快照匹配

### INT-16: init steering prompt 快照测试

**测试目的**: 确保 steering 初始化 prompt 的输出保持稳定

**准备数据**:

```typescript
{
  steeringPath: '/snapshot/test/.claude/steering'
}
```

**测试步骤**:

1. 渲染 init-steering prompt
2. 比较快照

**预期结果**:

- 输出包含正确的路径和初始化指令
- 与保存的快照一致

### INT-17: create custom steering prompt 快照测试

**测试目的**: 确保自定义 steering 创建 prompt 的输出保持稳定

**准备数据**:

```typescript
{
  description: 'API design patterns and best practices',
  steeringPath: '/snapshot/test/.claude/steering'
}
```

**测试步骤**:

1. 渲染 create-custom-steering prompt
2. 比较快照

**预期结果**:

- 输出包含用户描述
- 与保存的快照一致

### INT-18: refine steering prompt 快照测试

**测试目的**: 确保 steering 精炼 prompt 的输出保持稳定

**准备数据**:

```typescript
{
  filePath: '/snapshot/test/.claude/steering/api-guidelines.md'
}
```

**测试步骤**:

1. 渲染 refine-steering prompt
2. 比较快照

**预期结果**:

- 输出包含文件路径和精炼指南
- 与保存的快照一致

### INT-19: delete steering prompt 快照测试

**测试目的**: 确保 steering 删除 prompt 的输出保持稳定

**准备数据**:

```typescript
{
  documentName: 'deprecated-guidelines.md',
  steeringPath: '/snapshot/test/.claude/steering'
}
```

**测试步骤**:

1. 渲染 delete-steering prompt
2. 比较快照

**预期结果**:

- 输出包含文档名称和路径
- 与保存的快照一致

## 快照文件管理

### 快照文件位置

- 快照保存在 `__snapshots__/promptSnapshots.test.ts.snap`
- 每个测试用例对应一个快照条目

### 更新快照

当 prompt 模板有意修改时：

```bash
# 更新所有快照
npm test promptSnapshots.test.ts -- -u

# 交互式更新
npm test promptSnapshots.test.ts -- -i
```

### 查看差异

测试失败时会显示详细的差异：

- 红色：被删除的内容
- 绿色：新增的内容
- 灰色：未改变的上下文

## 最佳实践

### 1. 固定测试数据

- 使用固定的测试输入，避免随机值
- 路径使用 `/snapshot/test` 前缀
- 描述使用英文，避免编码问题

### 2. 版本控制

- 快照文件必须提交到 Git
- PR 中要审查快照的变化
- 使用有意义的提交信息

### 3. 定期审查

- 定期检查快照是否过于庞大
- 考虑是否需要简化 prompt
- 确保快照反映实际使用场景

### 4. CI/CD 集成

- 在 CI 中运行快照测试
- 禁止在 CI 中更新快照
- 快照不匹配应导致构建失败

## 常见问题

### 快照过大

如果快照文件变得过大：

1. 考虑只测试关键部分
2. 使用 `expect.stringContaining()` 测试部分内容
3. 将大型 prompt 拆分为多个小测试

### 跨平台问题

不同操作系统可能产生不同的换行符：

1. 在 `.gitattributes` 中设置快照文件的换行符
2. 使用 `prettier` 格式化快照
3. 在测试中规范化换行符

### 快照丢失

如果快照文件丢失：

1. 运行测试重新生成
2. 从版本控制恢复
3. 确保 `.gitignore` 没有忽略快照文件
