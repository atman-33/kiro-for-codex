# PromptLoader Unit Test Cases

## Test File

`promptLoader.test.ts`

## Test Purpose

Ensure that the PromptLoader service continues to work properly after code updates, including core functionality such as singleton pattern, initialization, loading, rendering, and error handling.

## Test Case Overview

| Case ID | Function Description                    | Test Type     |
| ------- | --------------------------------------- | ------------- |
| PL-01   | Get singleton instance                  | Positive test |
| PL-02   | Initialize and load all prompts        | Positive test |
| PL-03   | Load prompt by ID                       | Positive test |
| PL-04   | Load non-existent prompt               | Exception test|
| PL-05   | Render prompt with all variables       | Positive test |
| PL-06   | Render prompt with missing optional variables | Positive test |
| PL-07   | Render prompt with missing required variables | Exception test|
| PL-08   | Render simple prompt without variables    | Positive test |
| PL-09   | Get all prompts list                      | Positive test |
| PL-10   | Handle invalid Handlebars syntax         | Exception test|
| PL-11   | Handle invalid prompt modules             | Exception test|

## Detailed Test Steps

### PL-01: Get singleton instance

**Test Purpose**: Verify that PromptLoader implements correct singleton pattern

**Test Data**:

- Clear any existing instance state

**Test Steps**:

1. First call to `PromptLoader.getInstance()`, get instance 1
2. Second call to `PromptLoader.getInstance()`, get instance 2
3. Compare if both instances are the same object

**Expected Results**:

- instance1 === instance2 returns true
- Both calls return the same object reference

### PL-02: Initialize and load all prompts

**Test Purpose**: Verify that PromptLoader can successfully initialize and load all configured prompt templates

**Test Data**:

- Mock prompts/target module, provide test prompts:

  ```typescript
  {
    testPrompt: { frontmatter: {...}, content: '...' },
    simplePrompt: { frontmatter: {...}, content: '...' }
  }
  ```

**Test Steps**:

1. Create PromptLoader instance
2. Call `promptLoader.initialize()` method
3. Try to load registered prompts
4. Verify loading process doesn't throw exceptions

**Expected Results**:

- initialize() executes successfully without throwing exceptions
- Internal prompts Map contains all mocked prompts
- Can access loaded prompts through loadPrompt()

### PL-03: Load prompt by ID

**Test Purpose**: Verify ability to correctly load corresponding prompt object through prompt ID

**Test Data**:

- Ensure PromptLoader is initialized
- Prompt with ID 'test-prompt' exists

**Test Steps**:

1. Call `promptLoader.loadPrompt('test-prompt')`
2. Check returned prompt object
3. Verify frontmatter and content properties

**Expected Results**:

- Returns correct prompt object
- frontmatter.id === 'test-prompt'
- frontmatter.name === 'Test Prompt'
- content contains expected template content

### PL-04: Load non-existent prompt

**Test Purpose**: Verify system can correctly handle loading non-existent prompts

**Test Data**:

- Ensure PromptLoader is initialized
- Use non-existent prompt ID: 'non-existent'

**Test Steps**:

1. Call `promptLoader.loadPrompt('non-existent')`
2. Catch thrown error
3. Verify error message

**Expected Results**:

- Throws error
- Error message: `Prompt not found: non-existent. Available prompts: test-prompt, simple-prompt`
- Error message contains list of available prompts

### PL-05: Render prompt with all variables

**Test Purpose**: Verify that Handlebars template engine can correctly render prompts containing all variables

**Test Data**:

- Prompt template: `Hello {{name}}! {{#if age}}You are {{age}} years old.{{/if}}`
- Variable data: `{ name: 'John', age: 30 }`

**Test Steps**:

1. Call `promptLoader.renderPrompt('test-prompt', { name: 'John', age: 30 })`
2. Get rendering result
3. Verify output string

**Expected Results**:

- Returns: `Hello John! You are 30 years old.`
- All variables correctly replaced
- Conditional blocks correctly rendered

### PL-06: Render prompt with missing optional variables

**Test Purpose**: Verify system can correctly handle missing optional variables

**Test Data**:

- Prompt template: `Hello {{name}}! {{#if age}}You are {{age}} years old.{{/if}}`
- Variable data: `{ name: 'Jane' }` (missing age)

**Test Steps**:

1. Call `promptLoader.renderPrompt('test-prompt', { name: 'Jane' })`
2. Get rendering result
3. Verify output string

**Expected Results**:

- Returns: `Hello Jane!`
- Required variables correctly replaced
- Conditional block doesn't render due to missing variable

### PL-07: Render prompt with missing required variables

**Test Purpose**: Verify system can correctly validate required variables and report errors when missing

**Test Data**:

- Prompt definition has name as required variable
- Call without providing name variable: `{}`

**Test Steps**:

1. Try calling `promptLoader.renderPrompt('test-prompt', {})`
2. Catch thrown error
3. Verify error type and message

**Expected Results**:

- Throws validation error
- Error message: `Variable validation failed: Missing required variable: name`
- Variable validation performed before rendering

### PL-08: Render simple prompt without variables

**Test Purpose**: Verify ability to correctly render static prompts without any variables

**Test Data**:

- Prompt template: `This is a simple prompt without any variables.`
- No variables needed

**Test Steps**:

1. Call `promptLoader.renderPrompt('simple-prompt')`
2. Get rendering result
3. Verify output matches original content

**Expected Results**:

- Returns: `This is a simple prompt without any variables.`
- Content remains unchanged
- No need to provide variable parameters

### PL-09: Get all prompts list

**Test Purpose**: Verify ability to get metadata list of all loaded prompts

**Test Data**:

- Ensure PromptLoader is initialized
- At least 2 prompts available

**Test Steps**:

1. Call `promptLoader.listPrompts()`
2. Check returned array
3. Verify structure of each element

**Expected Results**:

- Returns array containing 2 elements
- Each element contains: id, name, version, category, description
- category extracted from ID (e.g. 'test-prompt' → 'test')

### PL-10: Handle invalid Handlebars syntax

**Test Purpose**: Verify system can gracefully handle template syntax errors

**Test Data**:

- Create prompt with syntax error: `{{#if name}}Unclosed if block`

**Test Steps**:

1. Manually add erroneous prompt to loader
2. Try to compile template
3. Verify error handling

**Expected Results**:

- Handlebars throws compilation error
- Error is correctly caught
- Doesn't cause system crash

### PL-11: Handle invalid prompt modules

**Test Purpose**: Verify initialization can skip invalid prompt modules

**Test Data**:

- Add invalid module to mock: `{ invalidPrompt: { invalid: true } }`

**Test Steps**:

1. Call `promptLoader.initialize()`
2. Verify initialization process
3. Check if valid prompts load normally

**Expected Results**:

- Initialization doesn't fail due to invalid modules
- Valid prompts load normally
- Invalid modules are silently skipped

## Test Considerations

### Mock Strategy

- Use Jest mock to isolate prompts/target module
- Clear singleton instance state before each test
- Mock data should cover various edge cases

### Handlebars Features

- Number 0 is considered falsy in conditional statements
- Empty strings are also falsy
- undefined variables don't cause errors, just don't render

### Performance Considerations

- Template compilation results are cached
- Initialization may be slow with large numbers of prompts
- Consider lazy loading optimization

### Test Isolation

- Each test should run independently
- Use beforeEach to reset state
- Avoid dependencies between tests
