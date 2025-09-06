# Project Structure

## Root Directory Organization

```
├── src/                     # Source code
├── tests/                   # Test files
├── scripts/                 # Build and utility scripts
├── .kiro/steering/          # AI steering documents
├── .codex/                  # Codex CLI integration files
├── dist/                    # Compiled output (generated)
└── node_modules/            # Dependencies (generated)
```

## Source Code Structure (`src/`)

### Core Files
- `extension.ts` - Extension entry point and command registration
- `constants.ts` - Configuration constants and defaults

### Feature Organization
```
src/
├── features/               # Business logic by feature
│   ├── agents/            # Agent management
│   ├── spec/              # Spec workflow management  
│   └── steering/          # Steering document management
├── providers/             # VSCode TreeDataProviders
├── services/              # Reusable service layer
├── utils/                 # Utility functions
├── types/                 # TypeScript type definitions
├── prompts/               # AI prompt templates
└── resources/             # Static resources (copied to dist)
```

## Naming Conventions

### Files and Directories
- Use kebab-case for file names: `spec-manager.ts`
- Use camelCase for directory names: `src/features/`
- Manager classes: `{Feature}Manager` (e.g., `SpecManager`)
- Provider classes: `{Feature}ExplorerProvider` (e.g., `SpecExplorerProvider`)

### Commands
- Follow pattern: `kfc.{feature}.{action}`
- Examples: `kfc.spec.create`, `kfc.steering.refine`

### Configuration
- VSCode settings use `kfc` namespace
- Project settings in `.codex/settings/kfc-settings.json`
- Constants defined in `src/constants.ts`

## Test Organization (`tests/`)

```
tests/
├── unit/                  # Unit tests mirroring src structure
│   ├── features/
│   ├── providers/
│   ├── services/
│   └── utils/
├── integration/           # Integration tests
└── __mocks__/            # Test mocks (e.g., vscode mock)
```

## Key Architectural Principles

- **Separation of Concerns**: Features, providers, services, and utilities are clearly separated
- **Manager Pattern**: Each feature has a dedicated manager class for business logic
- **Provider Pattern**: VSCode tree views implemented as separate provider classes
- **Service Layer**: Common operations abstracted into reusable services
- **Resource Management**: Static resources organized under `src/resources/`