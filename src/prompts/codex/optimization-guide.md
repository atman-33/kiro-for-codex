# Codex CLI Prompt Optimization Guide

This guide provides comprehensive instructions for optimizing prompts for Codex CLI to ensure maximum effectiveness in code generation and task execution.

## Core Optimization Principles

### 1. Clarity and Specificity
- Use precise, unambiguous language
- Avoid vague or interpretive instructions
- Provide specific examples and patterns
- Include concrete success criteria
- Define clear boundaries and constraints

### 2. Structured Information Hierarchy
- Organize information in logical sections
- Use consistent formatting patterns
- Provide clear section headers
- Structure complex information hierarchically
- Enable easy parsing and navigation

### 3. Context Completeness
- Include all necessary background information
- Provide relevant codebase context
- Reference existing patterns and conventions
- Include integration requirements
- Specify environmental constraints

### 4. Actionable Instructions
- Focus on specific, executable tasks
- Provide step-by-step guidance
- Include validation checkpoints
- Specify expected outcomes
- Enable incremental progress

## Codex CLI Specific Optimizations

### Command Structure Optimization
```markdown
# Optimal Command Structure

## Task: [Clear, Specific Task Name]

## Context
[Complete context with all necessary background]

## Objective
[Specific, measurable objective]

## Constraints
[Clear constraints and requirements]

## Expected Output
[Detailed description of expected results]

## Implementation Guidance
[Specific implementation instructions]

## Validation Criteria
[Clear success criteria and validation steps]
```

### Code Generation Optimization
```markdown
# Code Generation Best Practices

## Interface Definitions
```typescript
// Always provide complete interface definitions
interface ComponentInterface {
    method1(param: Type): ReturnType;
    method2(param1: Type1, param2: Type2): Promise<ReturnType>;
}
```

## Implementation Patterns
```typescript
// Provide clear implementation patterns
class ConcreteImplementation implements ComponentInterface {
    // Include comprehensive error handling
    // Follow existing codebase conventions
    // Add appropriate logging and monitoring
}
```

## Testing Patterns
```typescript
// Include comprehensive testing patterns
describe('ComponentImplementation', () => {
    // Setup, test cases, assertions
    // Cover edge cases and error scenarios
    // Use appropriate mocking strategies
});
```
```

### Error Handling Optimization
```markdown
# Error Handling Patterns

## Error Type Definitions
```typescript
// Define specific error types
class ValidationError extends Error {
    constructor(message: string, public details: ValidationDetails) {
        super(message);
        this.name = 'ValidationError';
    }
}
```

## Error Handling Implementation
```typescript
// Implement comprehensive error handling
try {
    // Main logic implementation
} catch (error) {
    // Specific error handling based on error type
    // Appropriate logging and monitoring
    // User-friendly error responses
}
```
```

## Prompt Structure Templates

### Basic Task Template
```markdown
---
id: [unique-id]
name: [Human Readable Name]
version: [version-number]
description: [Brief description of the prompt's purpose]
variables:
  [variable-name]:
    type: [string|number|boolean]
    required: [true|false]
    description: [Description of the variable]
---

# Task: [Task Name]

## Context
[Comprehensive context including background, current state, and objectives]

## Requirements
- [Requirement 1]: [Specific, measurable requirement]
- [Requirement 2]: [Specific, measurable requirement]
- [Requirement 3]: [Specific, measurable requirement]

## Constraints
- [Constraint 1]: [Specific limitation or requirement]
- [Constraint 2]: [Specific limitation or requirement]

## Expected Output
[Detailed description of expected results with examples]

## Implementation Guidelines
[Specific guidance for implementation including patterns and best practices]

## Validation Criteria
- [ ] [Validation criterion 1]
- [ ] [Validation criterion 2]
- [ ] [Validation criterion 3]

## Success Criteria
[Clear definition of successful completion]
```

### Complex Implementation Template
```markdown
# Task: [Complex Task Name]

## Overview
[High-level overview of the task and its importance]

## Context Analysis
### Current State
[Description of current system state]

### Target State
[Description of desired end state]

### Gap Analysis
[What needs to be implemented to bridge the gap]

## Requirements Breakdown
### Functional Requirements
1. [Functional requirement 1]
2. [Functional requirement 2]

### Non-Functional Requirements
1. [Performance requirement]
2. [Security requirement]
3. [Maintainability requirement]

## Architecture Considerations
### Component Design
[How components should be structured]

### Interface Definitions
[Required interfaces and contracts]

### Integration Points
[How this integrates with existing systems]

## Implementation Strategy
### Phase 1: [Phase Name]
[Detailed implementation steps for this phase]

### Phase 2: [Phase Name]
[Detailed implementation steps for this phase]

## Testing Strategy
### Unit Testing
[Unit testing requirements and patterns]

### Integration Testing
[Integration testing requirements]

### End-to-End Testing
[E2E testing requirements]

## Quality Assurance
### Code Quality Standards
[Specific quality requirements]

### Performance Requirements
[Performance benchmarks and requirements]

### Security Requirements
[Security considerations and requirements]

## Validation Framework
[Comprehensive validation approach]
```

## Language and Style Guidelines

### Technical Writing Best Practices
- Use active voice for instructions
- Be concise while maintaining completeness
- Use consistent terminology throughout
- Avoid jargon unless necessary and defined
- Structure sentences for easy parsing

### Code Documentation Standards
```typescript
/**
 * Comprehensive JSDoc comment explaining the function
 * @param param1 - Clear description of parameter
 * @param param2 - Clear description of parameter
 * @returns Clear description of return value
 * @throws {ErrorType} Description of when this error is thrown
 * @example
 * // Clear usage example
 * const result = functionName(param1, param2);
 */
function functionName(param1: Type1, param2: Type2): ReturnType {
    // Implementation with clear inline comments
}
```

### Error Message Guidelines
```typescript
// Good error messages are specific and actionable
throw new ValidationError(
    'Invalid email format provided',
    {
        field: 'email',
        value: providedEmail,
        expectedFormat: 'user@domain.com',
        validationRule: 'RFC 5322 compliant email address'
    }
);
```

## Approval Mode Specific Optimizations

### Interactive Mode Optimizations
- Break complex tasks into smaller, reviewable steps
- Include clear progress indicators
- Provide detailed explanations for each step
- Use checkpoint questions for user feedback
- Preview next steps to maintain context

### Auto-Edit Mode Optimizations
- Provide complete context upfront
- Minimize ambiguous requirements
- Include comprehensive implementation guidance
- Focus on self-contained, complete implementations
- Provide clear success criteria

### Full-Auto Mode Optimizations
- Include all requirements and constraints upfront
- Provide comprehensive specifications
- Anticipate edge cases and error scenarios
- Include complete validation framework
- Ensure production-ready output

## Performance Optimization Guidelines

### Prompt Efficiency
- Structure information for quick parsing
- Use clear section headers and formatting
- Minimize redundant information
- Focus on essential details
- Optimize for Codex CLI processing patterns

### Code Generation Efficiency
- Provide clear patterns and examples
- Include comprehensive type definitions
- Specify integration requirements clearly
- Include performance considerations
- Optimize for maintainability

### Testing Efficiency
- Provide clear testing patterns
- Include comprehensive test coverage requirements
- Specify mock and stub patterns
- Include performance testing requirements
- Optimize for continuous integration

## Quality Assurance Framework

### Prompt Quality Checklist
- [ ] Clear, specific task definition
- [ ] Comprehensive context provided
- [ ] All requirements clearly specified
- [ ] Constraints and limitations defined
- [ ] Expected output clearly described
- [ ] Implementation guidance provided
- [ ] Validation criteria specified
- [ ] Success criteria defined
- [ ] Approval mode optimizations applied
- [ ] Code examples are complete and correct

### Implementation Quality Standards
- [ ] Code follows existing patterns
- [ ] Error handling is comprehensive
- [ ] Testing coverage is adequate
- [ ] Documentation is complete
- [ ] Performance requirements met
- [ ] Security considerations addressed
- [ ] Integration requirements satisfied
- [ ] Validation criteria met

### Validation Framework
- [ ] All requirements implemented
- [ ] All tests passing
- [ ] Code quality standards met
- [ ] Integration successful
- [ ] Performance benchmarks achieved
- [ ] Security requirements satisfied
- [ ] Documentation complete and accurate
- [ ] User acceptance criteria met

## Best Practices Summary

### Do's
- Use clear, specific language
- Provide comprehensive context
- Include concrete examples
- Structure information hierarchically
- Optimize for the target approval mode
- Include comprehensive validation criteria
- Follow existing codebase patterns
- Implement robust error handling

### Don'ts
- Use vague or ambiguous language
- Omit important context or constraints
- Provide incomplete examples
- Mix different approval mode patterns
- Skip validation or testing requirements
- Ignore existing codebase conventions
- Implement minimal error handling
- Forget to include success criteria

### Continuous Improvement
- Regularly review and update prompt templates
- Gather feedback on prompt effectiveness
- Monitor code generation quality
- Optimize based on usage patterns
- Update for new Codex CLI features
- Maintain consistency across all prompts
- Document lessons learned and best practices