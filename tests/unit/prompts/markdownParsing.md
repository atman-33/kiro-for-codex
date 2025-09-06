# Markdown Parsing Test Cases

## Test File

`markdownParsing.test.ts`

## Test Purpose

Ensure that Markdown prompt file parsing functionality continues to work properly after code updates, including frontmatter parsing, Handlebars syntax validation, compilation consistency, and other core features.

## Test Case Overview

| Case ID | Function Description                           | Test Type     |
| ------- | ---------------------------------------------- | ------------- |
| MD-01   | Verify frontmatter of all markdown files      | Positive test |
| MD-02   | Verify Handlebars variable definition consistency | Positive test |
| MD-03   | Verify create-spec.md file structure          | Positive test |
| MD-04   | Verify init-steering.md file structure        | Positive test |
| MD-05   | Verify compiled TypeScript file consistency   | Positive test |
| MD-06   | Parse simple greeting prompt                   | Positive test |
| MD-07   | Parse complex prompt with system tags         | Positive test |

## Detailed Test Steps

### MD-01: Verify frontmatter of all markdown files

**Test Purpose**: Verify that all markdown prompt files in the project contain valid and complete frontmatter

**Test Data**:

- prompts directory path: `src/prompts`
- Use glob pattern: `**/*.md`

**Test Steps**:

1. Use glob to find all `.md` files
2. Read file contents one by one
3. Use gray-matter to parse frontmatter
4. Verify existence and format of required fields

**Expected Results**:

- All files can be successfully parsed
- Each file's frontmatter contains:
  - `id`: non-empty string
  - `name`: non-empty string
  - `version`: semantic version format (x.y.z)
  - `description`: non-empty string
- File content (body) is not empty

### MD-02: Verify Handlebars variable definition consistency

**Test Purpose**: Verify that all Handlebars variables used in markdown content are defined in frontmatter.variables

**Test Data**:

- All markdown files
- Regular expression: `/\{\{([^}]+)\}\}/g` for extracting variables

**Test Steps**:

1. Read each markdown file
2. Use regular expression to extract all `{{variable}}` usage
3. Filter out Handlebars helpers (if, unless, each, with)
4. Check if each variable is defined in frontmatter.variables

**Expected Results**:

- All used variables have corresponding definitions
- No undefined variable references exist
- Helper functions are correctly identified and excluded

### MD-03: Verify create-spec.md file structure

**Test Purpose**: Verify the structure and content integrity of the spec creation prompt file

**Test Data**:

- File path: `src/prompts/spec/create-spec.md`

**Test Steps**:

1. Read create-spec.md file
2. Parse frontmatter and content
3. Verify frontmatter fields
4. Verify content structure

**Expected Results**:

- frontmatter contains:

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

- Content contains:
  - `<system>` and `</system>` tags
  - `{{description}}`, `{{workspacePath}}`, `{{specBasePath}}` variable references

### MD-04: Verify init-steering.md file structure

**Test Purpose**: Verify the structure and content integrity of the steering initialization prompt file

**Test Data**:

- File path: `src/prompts/steering/init-steering.md`

**Test Steps**:

1. Read init-steering.md file
2. Parse frontmatter and content
3. Verify required variable definitions
4. Verify content contains necessary elements

**Expected Results**:

- frontmatter.id === 'init-steering'
- variables contains steeringPath definition
- Content contains `{{steeringPath}}` variable reference
- Contains steering document creation instructions

### MD-05: Verify compiled TypeScript file consistency

**Test Purpose**: Verify that content remains consistent after markdown files are compiled to TypeScript

**Test Data**:

- Markdown source file: `src/prompts/spec/create-spec.md`
- TypeScript target file: `src/prompts/target/spec/create-spec.ts`

**Test Steps**:

1. Read markdown source file, parse frontmatter and content
2. Read corresponding TypeScript file
3. Verify frontmatter data in TypeScript
4. Verify content escaping and preservation

**Expected Results**:

- TypeScript file contains same frontmatter data
- Content correctly escaped:
  - `\n` → `\\n`
  - `"` → `\"`
  - `\` → `\\`
- Original content semantics remain unchanged

### MD-06: Parse simple greeting prompt

**Test Purpose**: Verify that gray-matter can correctly parse simple markdown prompts

**Test Data**:

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

**Test Steps**:

1. Use gray-matter to parse the above markdown content
2. Verify parsed data (frontmatter)
3. Verify parsed content (body)

**Expected Results**:

- data.id === 'test-greeting'
- data.variables.name.required === true
- data.variables.mood.required === false
- content contains 'Hello {{name}}!'
- content contains conditional block '{{#if mood}}'

### MD-07: Parse complex prompt with system tags

**Test Purpose**: Verify correct parsing of prompts containing special tags and complex structures

**Test Data**:

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

**Test Steps**:

1. Parse complex markdown content
2. Verify frontmatter completeness
3. Verify content preserves all special structures

**Expected Results**:

- data.version === '2.0.0'
- Content contains `<system>` and `</system>` tags
- Content contains `{{#each context}}` loop structure
- All formatting and indentation preserved

## Test Considerations

### File System Dependencies

- Tests depend on actual file system
- Ensure test environment contains all required prompt files
- Consider using test-specific fixture files

### Regular Expression Processing

- Handlebars variable extraction needs to handle various formats
- Pay attention to nested helper functions
- Consider impact of spaces and line breaks

### Compilation Consistency

- Escape character handling requires special attention
- Multi-line string line break handling
- Unicode character preservation

### Performance Considerations

- Traversing large numbers of files may be slow
- Consider parallel processing for efficiency
- Cache parsing results to avoid repeated reads
