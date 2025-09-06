# Codex CLI Approval Mode Templates

This document provides template structures optimized for different Codex CLI approval modes. Each mode requires different prompt structures and interaction patterns for optimal code generation.

## Interactive Mode Templates

### Interactive Mode Characteristics
- Step-by-step execution with user feedback
- Clear progress indicators and checkpoints
- Detailed explanations for each step
- Opportunity for user input and course correction

### Interactive Spec Creation Template
```markdown
# Task: [Task Name] (Interactive Mode)

## Context
[Clear context with current step indication]

**Current Step**: [X of Y] - [Step Description]
**Previous Steps Completed**: [List of completed steps]
**Next Steps**: [Preview of upcoming steps]

## Current Objective
[Specific, focused objective for this step]

## Expected User Input
[What input or feedback is expected from the user]

## Implementation Approach
1. **Step 1**: [Detailed description with rationale]
   - Action: [Specific action to take]
   - Expected Result: [What should happen]
   - Validation: [How to verify success]

2. **Step 2**: [Next step description]
   - Action: [Specific action to take]
   - Expected Result: [What should happen]
   - Validation: [How to verify success]

## Progress Checkpoint
After completing this step, please review:
- [ ] [Checkpoint 1]
- [ ] [Checkpoint 2]
- [ ] [Checkpoint 3]

**Ready to proceed?** [Clear question for user confirmation]

## Next Steps Preview
Once this step is approved, we will:
1. [Next step 1]
2. [Next step 2]
3. [Next step 3]
```

### Interactive Implementation Template
```markdown
# Task: Implement [Component Name] (Interactive Mode)

## Current Implementation Step
**Step [X of Y]**: [Step Description]

## Code to Implement
```typescript
// Step-by-step implementation
[Code block with clear comments explaining each part]
```

## Explanation
[Detailed explanation of what this code does and why]

## Testing for This Step
```typescript
// Tests specific to this implementation step
[Test code with explanations]
```

## Validation Questions
Before proceeding, please confirm:
1. Does this implementation approach look correct?
2. Are there any concerns with the code structure?
3. Should we modify anything before continuing?

## Next Implementation Step
After approval, we will implement:
[Preview of next step]
```

## Auto-Edit Mode Templates

### Auto-Edit Mode Characteristics
- Focused, complete implementations
- Minimal need for clarification
- Self-contained code changes
- Clear success criteria

### Auto-Edit Spec Creation Template
```markdown
# Task: [Task Name] (Auto-Edit Mode)

## Context
[Complete context with all necessary information]

## Objective
[Clear, unambiguous objective]

## Implementation Plan
[Complete plan with all steps outlined]

## Expected Output
[Detailed description of expected results]

## Constraints and Requirements
- [Constraint 1]: [Specific requirement]
- [Constraint 2]: [Specific requirement]
- [Constraint 3]: [Specific requirement]

## Success Criteria
- [ ] [Measurable success criterion 1]
- [ ] [Measurable success criterion 2]
- [ ] [Measurable success criterion 3]

## Implementation Details
[Complete implementation guidance with all necessary details]

## Validation Approach
[How to validate the implementation is correct]
```

### Auto-Edit Implementation Template
```markdown
# Task: Implement [Component Name] (Auto-Edit Mode)

## Implementation Objective
[Clear, specific objective]

## Complete Implementation
```typescript
// Complete, production-ready implementation
[Full code implementation with comprehensive error handling]
```

## Comprehensive Test Suite
```typescript
// Complete test coverage
[Full test implementation covering all scenarios]
```

## Integration Requirements
[Specific integration steps and requirements]

## Validation Checklist
- [ ] Implementation meets all requirements
- [ ] All tests pass successfully
- [ ] Integration is seamless
- [ ] Error handling is comprehensive
- [ ] Performance meets requirements
```

## Full-Auto Mode Templates

### Full-Auto Mode Characteristics
- Complete, comprehensive implementations
- All edge cases and scenarios covered
- Production-ready output
- No user intervention required

### Full-Auto Spec Creation Template
```markdown
# Task: [Task Name] (Full-Auto Mode)

## Complete Context
[Comprehensive context with all background information]

## Comprehensive Objective
[Complete objective with all requirements and constraints]

## Full Implementation Specification
[Complete specification covering all aspects]

### Requirements Analysis
[Complete requirements breakdown]

### Design Specifications
[Complete design with all components and interfaces]

### Implementation Plan
[Complete implementation plan with all tasks]

### Testing Strategy
[Complete testing approach covering all scenarios]

### Error Handling Strategy
[Complete error handling approach]

### Performance Requirements
[Complete performance specifications]

### Security Considerations
[Complete security requirements]

## Complete Success Criteria
[Comprehensive success criteria covering all aspects]

## Full Validation Framework
[Complete validation approach for all components]
```

### Full-Auto Implementation Template
```markdown
# Task: Complete Implementation of [Feature Name] (Full-Auto Mode)

## Comprehensive Implementation

### Core Implementation
```typescript
// Complete, production-ready implementation
[Full implementation with all components, error handling, logging, etc.]
```

### Complete Test Suite
```typescript
// Comprehensive test coverage
[Complete test implementation covering all scenarios, edge cases, error conditions]
```

### Integration Layer
```typescript
// Complete integration implementation
[Full integration code with existing systems]
```

### Configuration and Setup
```typescript
// Complete configuration
[All necessary configuration and setup code]
```

### Documentation
```markdown
# Complete documentation
[Full documentation including API docs, usage examples, troubleshooting]
```

### Performance Optimization
```typescript
// Performance optimizations
[All performance-related code and optimizations]
```

### Security Implementation
```typescript
// Security measures
[Complete security implementation including validation, authentication, etc.]
```

### Monitoring and Logging
```typescript
// Monitoring and logging
[Complete monitoring and logging implementation]
```

## Validation and Quality Assurance
[Complete validation covering all aspects of the implementation]
```

## Mode-Specific Optimization Guidelines

### Interactive Mode Optimization
- Break complex tasks into digestible steps
- Provide clear progress indicators
- Include detailed explanations for each step
- Enable easy course correction
- Use clear checkpoint questions
- Preview next steps to maintain context

### Auto-Edit Mode Optimization
- Focus on complete, self-contained implementations
- Minimize ambiguity in requirements
- Include comprehensive context upfront
- Provide clear success criteria
- Structure for efficient execution
- Minimize need for clarification

### Full-Auto Mode Optimization
- Provide complete specifications upfront
- Include all edge cases and scenarios
- Ensure production-ready output
- Cover all aspects comprehensively
- Include complete validation framework
- Anticipate all possible requirements

## Template Selection Guidelines

### Use Interactive Mode When:
- User needs to provide input during execution
- Complex decisions require user judgment
- Learning or explanation is important
- Iterative refinement is expected
- User wants to maintain control over process

### Use Auto-Edit Mode When:
- Requirements are clear and complete
- Implementation is straightforward
- Minimal user intervention is desired
- Focus is on efficient execution
- Output quality is more important than explanation

### Use Full-Auto Mode When:
- Complete automation is required
- All requirements are fully specified
- Production-ready output is needed immediately
- No user intervention is possible
- Comprehensive coverage is essential

## Best Practices for All Modes

### Common Optimization Principles
- Use clear, unambiguous language
- Provide specific, actionable instructions
- Include comprehensive error handling
- Structure information hierarchically
- Use consistent formatting and style
- Include validation and success criteria

### Code Quality Standards
- Follow TypeScript best practices
- Include comprehensive error handling
- Use descriptive naming conventions
- Add appropriate documentation
- Implement proper testing
- Consider performance implications

### Integration Requirements
- Follow existing codebase patterns
- Maintain backward compatibility
- Update relevant interfaces
- Consider impact on other components
- Preserve existing functionality
- Follow established conventions