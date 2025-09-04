# Markdown 解析测试用例

## 测试文件

`markdownParsing.test.ts`

## 测试目的

确保 Markdown prompt 文件解析功能在代码更新后仍然正常工作，包括 frontmatter 解析、Handlebars 语法验证、编译一致性等核心功能。

## 测试用例概览

| 用例 ID | 功能描述                             | 测试类型 |
| ------- | ------------------------------------ | -------- |
| MD-01   | 验证所有 markdown 文件的 frontmatter | 正向测试 |
| MD-02   | 验证 Handlebars 变量定义一致性       | 正向测试 |
| MD-03   | 验证 create-spec.md 文件结构         | 正向测试 |
| MD-04   | 验证 init-steering.md 文件结构       | 正向测试 |
| MD-05   | 验证编译后 TypeScript 文件一致性     | 正向测试 |
| MD-06   | 解析简单的 greeting prompt           | 正向测试 |
| MD-07   | 解析包含 system 标签的复杂 prompt    | 正向测试 |

## 详细测试步骤

### MD-01: 验证所有 markdown 文件的 frontmatter

**测试目的**: 验证项目中所有 markdown prompt 文件都包含有效且完整的 frontmatter

**准备数据**:

- prompts 目录路径：`src/prompts`
- 使用 glob 模式：`**/*.md`

**测试步骤**:

1. 使用 glob 查找所有 `.md` 文件
2. 逐个读取文件内容
3. 使用 gray-matter 解析 frontmatter
4. 验证必需字段的存在和格式

**预期结果**:

- 所有文件都能成功解析
- 每个文件的 frontmatter 包含：
  - `id`：非空字符串
  - `name`：非空字符串
  - `version`：符合语义化版本格式（x.y.z）
  - `description`：非空字符串
- 文件内容（body）不为空

### MD-02: 验证 Handlebars 变量定义一致性

**测试目的**: 验证 markdown 内容中使用的 Handlebars 变量都在 frontmatter.variables 中定义

**准备数据**:

- 所有 markdown 文件
- 正则表达式：`/\{\{([^}]+)\}\}/g` 用于提取变量

**测试步骤**:

1. 读取每个 markdown 文件
2. 使用正则表达式提取所有 `{{variable}}` 使用
3. 过滤掉 Handlebars 助手（if、unless、each、with）
4. 检查每个变量是否在 frontmatter.variables 中定义

**预期结果**:

- 所有使用的变量都有对应的定义
- 不存在未定义的变量引用
- 助手函数被正确识别和排除

### MD-03: 验证 create-spec.md 文件结构

**测试目的**: 验证 spec 创建 prompt 文件的结构和内容完整性

**准备数据**:

- 文件路径：`src/prompts/spec/create-spec.md`

**测试步骤**:

1. 读取 create-spec.md 文件
2. 解析 frontmatter 和内容
3. 验证 frontmatter 字段
4. 验证内容结构

**预期结果**:

- frontmatter 包含：

  ```yaml
  id: create-spec
  name: Create Spec with Complete Workflow
  version: 1.0.0
  description: Complete prompt for creating a spec...
  variables:
    description: { type: string, required: true, ... }
    workspacePath: { type: string, required: true, ... }
    specBasePath: { type: string, required: true, ... }
  ```

- 内容包含：
  - `<system>` 和 `</system>` 标签
  - `{{description}}`、`{{workspacePath}}`、`{{specBasePath}}` 变量引用

### MD-04: 验证 init-steering.md 文件结构

**测试目的**: 验证 steering 初始化 prompt 文件的结构和内容完整性

**准备数据**:

- 文件路径：`src/prompts/steering/init-steering.md`

**测试步骤**:

1. 读取 init-steering.md 文件
2. 解析 frontmatter 和内容
3. 验证必需的变量定义
4. 验证内容包含必要元素

**预期结果**:

- frontmatter.id === 'init-steering'
- variables 包含 steeringPath 定义
- 内容包含 `{{steeringPath}}` 变量引用
- 包含 steering 文档创建说明

### MD-05: 验证编译后 TypeScript 文件一致性

**测试目的**: 验证 markdown 文件编译成 TypeScript 后内容保持一致

**准备数据**:

- Markdown 源文件：`src/prompts/spec/create-spec.md`
- TypeScript 目标文件：`src/prompts/target/spec/create-spec.ts`

**测试步骤**:

1. 读取 markdown 源文件，解析 frontmatter 和内容
2. 读取对应的 TypeScript 文件
3. 验证 TypeScript 中的 frontmatter 数据
4. 验证内容的转义和保留

**预期结果**:

- TypeScript 文件包含相同的 frontmatter 数据
- 内容正确转义：
  - `\n` → `\\n`
  - `"` → `\"`
  - `\` → `\\`
- 原始内容的语义保持不变

### MD-06: 解析简单的 greeting prompt

**测试目的**: 验证 gray-matter 能正确解析简单的 markdown prompt

**准备数据**:

```markdown
---
id: test-greeting
name: Greeting Prompt
version: 1.0.0
description: A friendly greeting prompt
variables:
  name:
    type: string
    required: true
    description: Person's name
  mood:
    type: string
    required: false
    description: Current mood
---

# Hello {{name}}!

{{#if mood}}
You seem to be feeling {{mood}} today.
{{else}}
How are you feeling today?
{{/if}}

Let me help you with your request.
```

**测试步骤**:

1. 使用 gray-matter 解析上述 markdown 内容
2. 验证解析后的 data（frontmatter）
3. 验证解析后的 content（body）

**预期结果**:

- data.id === 'test-greeting'
- data.variables.name.required === true
- data.variables.mood.required === false
- content 包含 'Hello {{name}}!'
- content 包含条件块 '{{#if mood}}'

### MD-07: 解析包含 system 标签的复杂 prompt

**测试目的**: 验证能正确解析包含特殊标签和复杂结构的 prompt

**准备数据**:

```markdown
---
id: complex-prompt
name: Complex System Prompt
version: 2.0.0
description: A prompt with system instructions
variables:
  task:
    type: string
    required: true
    description: Task description
  context:
    type: object
    required: false
    description: Additional context
---

<system>
You are an AI assistant specialized in {{task}}.

Follow these guidelines:
- Be concise and accurate
- Use examples when helpful
- Maintain a professional tone
</system>

## Task: {{task}}

{{#if context}}
### Context
{{#each context}}
- {{@key}}: {{this}}
{{/each}}
{{/if}}

Please proceed with the task.
```

**测试步骤**:

1. 解析复杂的 markdown 内容
2. 验证 frontmatter 的完整性
3. 验证内容保留了所有特殊结构

**预期结果**:

- data.version === '2.0.0'
- 内容包含 `<system>` 和 `</system>` 标签
- 内容包含 `{{#each context}}` 循环结构
- 所有格式和缩进保持原样

## 测试注意事项

### 文件系统依赖

- 测试依赖实际的文件系统
- 确保测试环境包含所有必需的 prompt 文件
- 考虑使用测试专用的 fixture 文件

### 正则表达式处理

- Handlebars 变量提取需要处理各种格式
- 注意处理嵌套的助手函数
- 考虑空格和换行的影响

### 编译一致性

- 转义字符的处理要特别注意
- 多行字符串的换行符处理
- Unicode 字符的保留

### 性能考虑

- 大量文件的遍历可能较慢
- 考虑并行处理提高效率
- 缓存解析结果避免重复读取
