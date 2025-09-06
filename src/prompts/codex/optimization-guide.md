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

## Interface Definitions (Functional Approach)
```typescript
// Always provide complete interface definitions using functional patterns
interface ComponentInterface {
    readonly process: (param: Type) => ReturnType;
    readonly validate: (param1: Type1, param2: Type2) => Promise<ValidationResult>;
    readonly transform: (data: InputType) => OutputType;
}
```

## Implementation Patterns (Functional)
```typescript
// Provide clear functional implementation patterns
const createComponentImplementation = (
    config: ComponentConfig
): ComponentInterface => ({
    process: (param) => {
        // Include comprehensive error handling
        // Follow functional programming principles
        // Use immutable operations
        return processWithConfig(param, config);
    },
    
    validate: async (param1, param2) => {
        // Functional validation approach
        const validationRules = getValidationRules(config);
        return validateParams(param1, param2, validationRules);
    },
    
    transform: (data) => {
        // Pure function transformation
        return pipe(
            normalizeData,
            applyBusinessRules,
            formatOutput
        )(data);
    }
});

// Use classes only when absolutely necessary
class ComplexStatefulComponent implements ComponentInterface {
    private readonly state: ComponentState;
    
    constructor(initialState: ComponentState) {
        this.state = initialState;
    }
    
    // Use arrow functions for methods
    public readonly process = (param: Type): ReturnType => {
        // Implementation with state management
    };
}
```

## Testing Patterns (Functional)
```typescript
// Include comprehensive testing patterns for functional code
describe('ComponentImplementation', () => {
    const mockConfig = createMockConfig();
    const component = createComponentImplementation(mockConfig);
    
    describe('process', () => {
        it('should process data immutably', () => {
            const input = createTestInput();
            const result = component.process(input);
            
            // Verify input wasn't mutated
            expect(input).toEqual(createTestInput());
            expect(result).toEqual(expectedOutput);
        });
    });
    
    // Test pure functions separately
    describe('utility functions', () => {
        it('should transform data predictably', () => {
            const input = createTestData();
            const result = transformData(input);
            
            // Pure function should always return same output for same input
            expect(result).toEqual(transformData(input));
        });
    });
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

## TypeScript Functional Programming Guidelines

### Core Principles
1. **Functional Programming First**: Prefer functional patterns over object-oriented approaches
2. **Arrow Functions Preferred**: Use arrow functions for better readability and lexical scoping
3. **Classes Only When Necessary**: Use classes only for complex state management or when absolutely required
4. **Immutability**: Favor immutable data structures and pure functions
5. **Composition Over Inheritance**: Build functionality through composition rather than class hierarchies

### Function Definition Patterns
```typescript
// ✅ Preferred: Arrow functions with explicit types
const processUser = (user: User): ProcessedUser => {
    return {
        ...user,
        processedAt: new Date(),
        status: 'processed'
    };
};

// ✅ For complex functions with multiple operations
const validateAndProcessUsers = (users: User[]): Result<ProcessedUser[], ValidationError> => {
    const validUsers = users.filter(isValidUser);
    const processedUsers = validUsers.map(processUser);
    
    return validUsers.length === users.length
        ? success(processedUsers)
        : error(new ValidationError('Some users failed validation'));
};

// ❌ Avoid: Traditional function declarations
function processUser(user: User): ProcessedUser {
    // Less preferred approach
}

// ❌ Avoid: Classes for simple operations
class UserProcessor {
    process(user: User): ProcessedUser {
        // Unnecessary class for simple operation
    }
}
```

### When to Use Classes
Classes should only be used in these specific scenarios:

```typescript
// ✅ Acceptable: Complex state management with multiple related methods
class StateMachine {
    private state: MachineState;
    private history: StateTransition[];
    
    constructor(initialState: MachineState) {
        this.state = initialState;
        this.history = [];
    }
    
    // Use arrow functions for methods to maintain 'this' binding
    public transition = (event: StateEvent): void => {
        const previousState = this.state;
        this.state = this.calculateNextState(event);
        this.history.push({ from: previousState, to: this.state, event });
    };
    
    public canTransition = (event: StateEvent): boolean => {
        return this.getValidTransitions().includes(event);
    };
}

// ✅ Acceptable: Implementing interfaces that require instance methods
class DatabaseConnection implements Connection {
    private pool: ConnectionPool;
    
    constructor(config: DatabaseConfig) {
        this.pool = createPool(config);
    }
    
    public query = async <T>(sql: string, params: unknown[]): Promise<T[]> => {
        // Implementation
    };
}

// ❌ Avoid: Simple data processing that can be functional
class MathUtils {
    static add(a: number, b: number): number {
        return a + b; // This should just be a function
    }
}
```

### Composition Patterns
```typescript
// ✅ Preferred: Composition with functions
interface UserService {
    validate: (user: User) => ValidationResult;
    process: (user: User) => ProcessedUser;
    save: (user: ProcessedUser) => Promise<void>;
}

const createUserService = (
    validator: UserValidator,
    processor: UserProcessor,
    repository: UserRepository
): UserService => ({
    validate: (user) => validator.validate(user),
    process: (user) => processor.process(user),
    save: (user) => repository.save(user)
});

// ✅ Function composition for complex operations
const processUserPipeline = (user: User): Promise<ProcessedUser> => {
    return pipe(
        validateUser,
        transformUser,
        enrichUser,
        saveUser
    )(user);
};
```

### Immutability Patterns
```typescript
// ✅ Preferred: Immutable updates
const updateUserStatus = (user: User, status: UserStatus): User => ({
    ...user,
    status,
    updatedAt: new Date()
});

// ✅ Immutable array operations
const addUserToList = (users: User[], newUser: User): User[] => [
    ...users,
    newUser
];

const removeUserFromList = (users: User[], userId: string): User[] =>
    users.filter(user => user.id !== userId);

// ❌ Avoid: Mutating objects directly
const updateUserStatusMutable = (user: User, status: UserStatus): void => {
    user.status = status; // Mutates the original object
    user.updatedAt = new Date();
};
```

### Error Handling with Functional Patterns
```typescript
// ✅ Preferred: Result/Either pattern for error handling
type Result<T, E> = Success<T> | Failure<E>;

interface Success<T> {
    readonly kind: 'success';
    readonly value: T;
}

interface Failure<E> {
    readonly kind: 'failure';
    readonly error: E;
}

const success = <T>(value: T): Success<T> => ({ kind: 'success', value });
const failure = <E>(error: E): Failure<E> => ({ kind: 'failure', error });

const processUserSafely = (user: User): Result<ProcessedUser, ProcessingError> => {
    try {
        const processed = processUser(user);
        return success(processed);
    } catch (error) {
        return failure(new ProcessingError(error.message));
    }
};
```

## Language and Style Guidelines

### Technical Writing Best Practices
- Use active voice for instructions
- Be concise while maintaining completeness
- Use consistent terminology throughout
- Avoid jargon unless necessary and defined
- Structure sentences for easy parsing

### TypeScript Best Practices
```typescript
// Prefer functional programming patterns over object-oriented
// Use arrow functions for better readability and lexical scoping
const processData = (data: InputType[]): OutputType[] => {
    return data
        .filter(item => item.isValid)
        .map(item => transformItem(item))
        .sort((a, b) => a.priority - b.priority);
};

// Use classes only when absolutely necessary (e.g., for complex state management)
// Prefer composition over inheritance
interface DataProcessor {
    process: (data: InputType) => OutputType;
    validate: (data: InputType) => boolean;
}

const createDataProcessor = (config: ProcessorConfig): DataProcessor => ({
    process: (data) => {
        // Functional implementation
        return processWithConfig(data, config);
    },
    validate: (data) => validateData(data, config.rules)
});

// Avoid classes unless they provide clear benefits
// Only use classes for:
// 1. Complex state management with multiple related methods
// 2. When implementing interfaces that require instance methods
// 3. When inheritance provides clear architectural benefits
class ComplexStateMachine {
    private state: MachineState;
    
    constructor(initialState: MachineState) {
        this.state = initialState;
    }
    
    // Use arrow functions for methods to maintain 'this' binding
    public transition = (event: StateEvent): void => {
        this.state = this.calculateNextState(event);
    };
}
```

### Code Documentation Standards
```typescript
/**
 * Comprehensive JSDoc comment explaining the function
 * @param param1 - Clear description of parameter
 * @param param2 - Clear description of parameter
 * @returns Clear description of return value
 * @throws {ErrorType} Description of when this error is thrown
 * @example
 * // Clear usage example with functional approach
 * const result = processFunction(param1, param2);
 */
const processFunction = (param1: Type1, param2: Type2): ReturnType => {
    // Implementation with clear inline comments
    // Prefer immutable operations and pure functions
};
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
- **TypeScript Specific:**
  - Prefer functional programming patterns over object-oriented
  - Use arrow functions for better readability and lexical scoping
  - Favor composition over inheritance
  - Use immutable data structures and pure functions
  - Implement type-safe error handling with Result/Either patterns

### Don'ts
- Use vague or ambiguous language
- Omit important context or constraints
- Provide incomplete examples
- Mix different approval mode patterns
- Skip validation or testing requirements
- Ignore existing codebase conventions
- Implement minimal error handling
- Forget to include success criteria
- **TypeScript Specific:**
  - Don't use classes unless absolutely necessary
  - Avoid traditional function declarations in favor of arrow functions
  - Don't mutate objects directly - use immutable patterns
  - Avoid inheritance hierarchies - prefer composition
  - Don't ignore TypeScript's strict type checking capabilities

### Continuous Improvement
- Regularly review and update prompt templates
- Gather feedback on prompt effectiveness
- Monitor code generation quality
- Optimize based on usage patterns
- Update for new Codex CLI features
- Maintain consistency across all prompts
- Document lessons learned and best practices