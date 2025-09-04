# 测试目录

本目录包含项目的所有测试相关文件。

## 目录结构

```plain
tests/
├── README.md                      # 本文档
├── MANUAL_TESTING.md             # 手动测试清单和记录
├── __mocks__/                    # Mock 文件
│   └── vscode.ts                 # VSCode API mock
├── unit/                         # 单元测试
│   ├── services/
│   │   ├── promptLoader.test.ts  # PromptLoader 测试
│   │   └── promptLoader.md       # PromptLoader 测试文档
│   ├── prompts/
│   │   ├── markdownParsing.test.ts # Markdown 解析测试
│   │   └── markdownParsing.md     # Markdown 解析测试文档
│   └── features/
│       ├── specManager.test.ts   # SpecManager 测试（待完善）
│       └── specManager.md        # SpecManager 测试文档
└── integration/                  # 集成测试
    ├── prompts.test.ts          # Prompts 集成测试
    ├── prompts.md               # Prompts 集成测试文档
    ├── promptSnapshots.test.ts  # Prompt 快照测试
    ├── promptSnapshots.md       # Prompt 快照测试文档
    └── __snapshots__/           # Jest 快照文件
```

## 测试策略

- **单元测试**: 测试独立的函数和类
- **集成测试**: 测试组件间的交互
- **快照测试**: 防止 prompt 内容意外改变

## 运行测试

```bash
# 运行所有测试
npm test

# 运行特定文件
npm test promptLoader.test.ts

# 运行测试并查看覆盖率
npm test -- --coverage

# 监听模式
npm test -- --watch

# 更新快照
npm test -- -u
```

## 测试文档

每个测试文件都有对应的 Markdown 文档，包含：

- 测试用例 ID 和描述
- 测试目的和准备数据
- 详细的测试步骤
- 预期结果

测试用例 ID 格式：

- `PL-XX`: PromptLoader 测试
- `MD-XX`: Markdown 解析测试
- `SM-XX`: SpecManager 测试
- `INT-XX`: 集成测试

## 当前状态

### 已完成

- ✅ PromptLoader 单元测试 (11 个用例)
- ✅ Markdown 解析测试 (7 个用例)
- ✅ Prompts 集成测试 (14 个用例)
- ✅ Prompt 快照测试 (5 个用例)

### 进行中

- 🚧 SpecManager 单元测试（TypeScript 类型问题）
- 🚧 SteeringManager 单元测试

### 计划中

- 📅 文件操作集成测试
- 📅 Provider 类测试

## 注意事项

1. **VSCode API Mock**: VSCode 扩展测试较复杂，需要 mock 大量 API
2. **类型问题**: TypeScript 严格类型检查可能导致 mock 困难
3. **异步操作**: 注意处理文件系统等异步操作
4. **测试隔离**: 确保测试之间不相互影响
