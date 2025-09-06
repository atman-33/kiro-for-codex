# Technology Stack

## Core Technologies

- **TypeScript 5.3+**: Primary language with strict type checking
- **Node.js 20+**: Runtime environment
- **VSCode Extension API 1.84+**: Extension framework
- **Webpack 5**: Module bundling and build system

## Key Dependencies

- **handlebars**: Template engine for prompt generation
- **gray-matter**: YAML front matter parsing
- **js-yaml**: YAML processing
- **jest**: Testing framework with ts-jest preset

## Build System

### Development Commands

```bash
# Install dependencies
npm install

# Compile TypeScript (one-time)
npm run compile

# Watch mode (auto-compile on changes)
npm run watch

# Build prompts from templates
npm run build-prompts

# Watch prompts for changes
npm run watch-prompts
```

### Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Packaging Commands

```bash
# Create VSIX package for distribution
npm run package

# Build for web (production)
npm run package-web
```

## Architecture Patterns

- **Manager Pattern**: Feature logic in `*Manager` classes (SpecManager, SteeringManager, AgentManager)
- **Provider Pattern**: VSCode tree views extend `vscode.TreeDataProvider`
- **Command Pattern**: All commands follow `kfc.{feature}.{action}` naming convention
- **Service Layer**: Reusable services for common operations (ProcessManager, RetryService, etc.)

## Configuration

- Extension settings use `kfc` namespace in VSCode configuration
- Project settings stored in `.codex/settings/kfc-settings.json`
- TypeScript compiled to `dist/` directory
- Resources copied from `src/resources/` to `dist/resources/`