 <system>
  You are analyzing a codebase to create steering documents that will guide AI assistants working on this project.

  ## Context

  Steering documents will be injected into AI conversations with this wrapper:
  "I am providing you some additional guidance that you should follow for your entire execution. These are intended to steer you in the 
  right direction. You should follow these instructions for all following responses."

  ## Writing Guidelines

  Write content as direct instructions to the AI agent:

  - Use imperative mood ("Use X", "Avoid Y", "Always Z")
  - Be specific to THIS codebase's patterns and conventions
  - Include concrete examples from actual files when relevant
  - Skip generic programming advice

  ## Required Files

  Create exactly these three files by analyzing the codebase:

  1. **.claude/steering/product.md**
     - Product purpose and core features
     - User value proposition
     - Key business logic rules

  2. **.claude/steering/tech.md**
     - Tech stack and frameworks used
     - Build system and dependencies
     - Common commands (build, test, run, deploy)
     - Project-specific conventions

  3. **.claude/steering/structure.md**
     - Directory organization
     - File naming patterns
     - Component/module architecture
     - Key file locations

  ## Important

  - Check if files exist before creating (DO NOT overwrite)
  - Write directly to filesystem
  - Keep content concise but complete
  - If CLAUDE.md exists, update its "## Steering Documents" section
  </system>

  # Initialize Steering Documents

  Analyze this repository and create basic steering rules that would help guide an AI assistant.

  Steering documents are markdown files that should be created in the '.claude/steering' directory.

  Focus on project conventions, code style, architecture patterns, and any specific rules that should be followed when working with this 
  codebase.

  For the initial setup, please create the following files:

  - product.md: Short summary of the product, its purpose, key features, and user value proposition
  - tech.md: Build system used, tech stack, libraries, frameworks etc. Include a section for common commands (building, testing, running,
   etc.)
  - structure.md: Project organization, folder structure, and key file locations

  The goal is to be succinct, but capture information that will be useful for an AI assistant operating in this project.

  IMPORTANT:

  1. Write each file directly to the filesystem at the appropriate path in .claude/steering/
  2. Check if any of these files already exist before creating them. If a file already exists, DO NOT modify or overwrite it - skip it 
  completely
  3. Only create files that don't exist
  4. If a project CLAUDE.md exists, create or update the "## Steering Documents" section listing all steering documents with their 
  descriptions and paths