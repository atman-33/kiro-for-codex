# Codex CLI Prompt Optimization System

This directory contains Codex CLI optimized prompt templates and supporting documentation for the Claude to Codex migration project.

## Overview

The Codex optimization system provides enhanced prompt templates specifically designed for Codex CLI execution patterns. These templates improve code generation quality, reduce ambiguity, and optimize for different Codex CLI approval modes.

## Directory Structure

```
src/prompts/codex/
├── README.md                      # This documentation file
├── template-mapping.json          # Configuration mapping original to optimized templates
├── optimization-guide.md          # Comprehensive optimization guidelines
├── approval-mode-templates.md     # Templates for different approval modes
└── [optimized template files]     # Codex-optimized versions of existing templates
```

## Key Features

### 1. Codex-Optimized Templates
- **Enhanced Clarity**: Prompts use precise, unambiguous language optimized for Codex CLI processing
- **Structured Information**: Hierarchical organization for easy parsing and execution
- **Complete Context**: Comprehensive background information and constraints
- **Actionable Instructions**: Specific, executable guidance with clear success criteria

### 2. Approval Mode Support
- **Interactive Mode**: Step-by-step execution with user feedback and checkpoints
- **Auto-Edit Mode**: Focused, complete implementations with minimal user intervention
- **Full-Auto Mode**: Comprehensive, production-ready implementations

### 3. Template System
- **Backward Compatibility**: Original templates remain available as fallbacks
- **Seamless Migration**: Gradual transition from Claude Code to Codex CLI
- **Configuration-Driven**: Easy switching between original and optimized templates

## Template Categories

### Spec Templates
- `create-spec-codex.md`: Optimized spec creation workflow
- `impl-task-codex.md`: Optimized task implementation

### Steering Templates
- `create-custom-steering-codex.md`: Optimized custom steering creation
- `init-steering-codex.md`: Optimized steering initialization

### Agent Templates
- `spec-requirements-codex.md`: Optimized requirements agent
- `spec-design-codex.md`: Optimized design agent
- `spec-tasks-codex.md`: Optimized tasks agent
- `spec-impl-codex.md`: Optimized implementation agent

## Usage Guidelines

### Template Selection
The system automatically selects the appropriate template based on:
1. **Provider Type**: Codex CLI vs Claude Code
2. **Approval Mode**: Interactive, Auto-Edit, or Full-Auto
3. **Configuration**: User preferences and system settings

### Configuration
Templates are configured via `template-mapping.json`:
```json
{
  "templateMappings": {
    "category": {
      "template-id": {
        "original": "path/to/original.md",
        "codex_optimized": "path/to/optimized.md",
        "description": "Template description"
      }
    }
  }
}
```

### Approval Mode Optimization
Each template includes mode-specific optimizations:

#### Interactive Mode
- Step-by-step execution
- Clear progress indicators
- User feedback checkpoints
- Detailed explanations

#### Auto-Edit Mode
- Complete, focused implementations
- Minimal ambiguity
- Self-contained changes
- Clear success criteria

#### Full-Auto Mode
- Comprehensive specifications
- Production-ready output
- Complete edge case coverage
- No user intervention required

## Optimization Principles

### 1. Clarity and Specificity
- Use precise, technical language
- Avoid ambiguous terms and phrases
- Include specific examples and patterns
- Define clear success criteria

### 2. Structured Information
- Organize content hierarchically
- Use consistent formatting patterns
- Provide clear section boundaries
- Enable easy parsing and navigation

### 3. Context Completeness
- Include all necessary background
- Provide relevant codebase context
- Reference existing patterns
- Specify integration requirements

### 4. Actionable Instructions
- Focus on executable tasks
- Provide step-by-step guidance
- Include validation checkpoints
- Specify expected outcomes

## Implementation Guidelines

### Code Quality Standards
- Follow TypeScript best practices
- Include comprehensive error handling
- Use descriptive naming conventions
- Add appropriate documentation
- Implement proper testing
- Consider performance implications

### Testing Requirements
- Achieve minimum 90% test coverage
- Include unit tests for all functionality
- Create integration tests for complex interactions
- Test error scenarios and edge cases
- Use appropriate mocking strategies
- Follow existing test patterns

### Integration Approach
- Analyze existing codebase patterns
- Follow established architecture
- Update relevant interfaces
- Maintain backward compatibility
- Consider impact on other components
- Preserve existing functionality

## Migration Strategy

### Phase 1: Template Creation
- ✅ Create Codex-optimized versions of existing templates
- ✅ Implement approval mode specific variations
- ✅ Create comprehensive optimization guidelines
- ✅ Establish template mapping configuration

### Phase 2: Integration
- [ ] Update prompt loading system to support Codex templates
- [ ] Implement approval mode detection and selection
- [ ] Add configuration management for template selection
- [ ] Create fallback mechanisms for compatibility

### Phase 3: Validation
- [ ] Test all templates with Codex CLI
- [ ] Validate code generation quality
- [ ] Measure performance improvements
- [ ] Gather user feedback and iterate

### Phase 4: Deployment
- [ ] Enable Codex templates in production
- [ ] Monitor usage and effectiveness
- [ ] Optimize based on real-world usage
- [ ] Document lessons learned

## Quality Assurance

### Template Validation Checklist
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

### Code Generation Quality
- [ ] Generated code follows project conventions
- [ ] Error handling is comprehensive
- [ ] Testing coverage is adequate
- [ ] Documentation is complete
- [ ] Performance requirements met
- [ ] Security considerations addressed
- [ ] Integration requirements satisfied

## Best Practices

### Template Development
1. **Start with Requirements**: Understand the specific needs for Codex CLI optimization
2. **Analyze Existing Patterns**: Study current templates and identify improvement opportunities
3. **Structure for Clarity**: Organize information hierarchically for easy parsing
4. **Include Complete Context**: Provide all necessary background and constraints
5. **Test Thoroughly**: Validate templates with actual Codex CLI execution
6. **Iterate Based on Feedback**: Continuously improve based on usage and results

### Usage Recommendations
1. **Choose Appropriate Mode**: Select the right approval mode for your use case
2. **Provide Complete Context**: Include all necessary information in prompts
3. **Validate Results**: Always verify generated code meets requirements
4. **Follow Conventions**: Adhere to existing codebase patterns and standards
5. **Monitor Performance**: Track code generation quality and effectiveness

## Troubleshooting

### Common Issues
1. **Template Not Found**: Check template mapping configuration
2. **Poor Code Quality**: Review optimization guidelines and template structure
3. **Approval Mode Mismatch**: Verify mode selection and template compatibility
4. **Integration Failures**: Ensure templates follow existing patterns

### Support Resources
- **Optimization Guide**: Comprehensive guidelines for template optimization
- **Template Mapping**: Configuration reference for template selection
- **Approval Mode Templates**: Mode-specific template patterns
- **Best Practices**: Proven approaches for effective template usage

## Contributing

### Adding New Templates
1. Create optimized version following guidelines
2. Update template mapping configuration
3. Add appropriate documentation
4. Test with Codex CLI
5. Submit for review

### Improving Existing Templates
1. Identify optimization opportunities
2. Follow established patterns and guidelines
3. Test changes thoroughly
4. Update documentation as needed
5. Submit improvements for review

## Future Enhancements

### Planned Improvements
- [ ] Dynamic template generation based on context
- [ ] Machine learning optimization for template effectiveness
- [ ] Advanced approval mode detection
- [ ] Integration with Codex CLI performance metrics
- [ ] Automated template validation and testing

### Research Areas
- Template effectiveness measurement
- Code generation quality metrics
- User experience optimization
- Performance impact analysis
- Integration pattern optimization

## References

- [Codex CLI Documentation](https://docs.codex.ai/cli)
- [Template Optimization Guidelines](./optimization-guide.md)
- [Approval Mode Templates](./approval-mode-templates.md)
- [Template Mapping Configuration](./template-mapping.json)