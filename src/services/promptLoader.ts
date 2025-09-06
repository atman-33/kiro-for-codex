import * as Handlebars from 'handlebars';
import * as path from 'path';
import templateMapping from '../prompts/codex/template-mapping.json';
import {
  PromptFrontmatter,
  PromptMetadata,
  PromptTemplate,
  ValidationResult
} from '../types/prompt.types';

// Import all prompts from index
import * as prompts from '../prompts/target';

/**
 * Service for loading and rendering prompt templates
 */
export class PromptLoader {
  private static instance: PromptLoader;
  private prompts: Map<string, PromptTemplate> = new Map();
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private idMap: Map<string, { original: string; optimized?: string; } > = new Map();
  private optimizationEnabled: boolean = false;
  private fallbackToOriginal: boolean = true;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PromptLoader {
    if (!PromptLoader.instance) {
      PromptLoader.instance = new PromptLoader();
    }
    return PromptLoader.instance;
  }

  /**
   * Initialize the loader by loading all prompts
   */
  public initialize(): void {
    // Clear existing data
    this.prompts.clear();
    this.compiledTemplates.clear();
    this.idMap.clear();

    // Load mapping configuration (best-effort; never throw)
    try {
      // Build ID map from template-mapping.json
      const mappings = (templateMapping as any)?.templateMappings || {};
      const categories = Object.keys(mappings);
      for (const cat of categories) {
        const items = mappings[cat] || {};
        for (const id of Object.keys(items)) {
          const entry = items[id];
          const optimizedPath: string | undefined = entry?.codex_optimized;
          const optimizedId = optimizedPath ? path.basename(optimizedPath, '.md') : undefined;
          this.idMap.set(id, { original: id, optimized: optimizedId });
        }
      }
      const cfg = (templateMapping as any)?.configuration || {};
      this.optimizationEnabled = Boolean(cfg.enableCodexOptimization);
      this.fallbackToOriginal = cfg.fallbackToOriginal !== false;
    } catch {
      // If mapping fails to load, proceed with defaults (no optimization)
      this.optimizationEnabled = false;
      this.fallbackToOriginal = true;
    }

    // Load all prompts
    const promptModules = Object.values(prompts);

    // Register each prompt
    for (const module of promptModules) {
      if (module.frontmatter && module.content) {
        this.registerPrompt(module as PromptTemplate);
      }
    }
  }

  /**
   * Register a prompt template
   */
  private registerPrompt(template: PromptTemplate): void {
    const { id } = template.frontmatter;

    // Store the template
    this.prompts.set(id, template);

    // Compile the template
    try {
      const compiled = Handlebars.compile(template.content);
      this.compiledTemplates.set(id, compiled);
    } catch (error) {
      console.error(`Failed to compile template ${id}:`, error);
    }
  }

  /**
   * Load a prompt template by ID
   */
  public loadPrompt(promptId: string): PromptTemplate {
    const template = this.prompts.get(promptId);
    if (!template) {
      throw new Error(`Prompt not found: ${promptId}. Available prompts: ${Array.from(this.prompts.keys()).join(', ')}`);
    }
    return template;
  }

  /**
   * Render a prompt with variables
   */
  public renderPrompt(promptId: string, variables: Record<string, any> = {}): string {
    const resolvedId = this.resolveTemplateId(promptId, variables);
    const template = this.loadPrompt(resolvedId);
    const compiled = this.compiledTemplates.get(resolvedId);

    if (!compiled) {
      throw new Error(`Compiled template not found: ${resolvedId}`);
    }

    // Validate required variables
    const validation = this.validateVariables(template.frontmatter, variables);
    if (!validation.valid) {
      throw new Error(`Variable validation failed: ${validation.errors?.join(', ')}`);
    }

    // Render the template
    try {
      return compiled(variables);
    } catch (error) {
      throw new Error(`Failed to render template ${resolvedId}: ${error}`);
    }
  }

  /**
   * Resolve requested template ID to optimized/original based on mapping and variables
   * Optimization applies only when variables include an approval mode (Codex flow)
   */
  private resolveTemplateId(requestedId: string, variables: Record<string, any>): string {
    // If explicitly requesting a concrete ID that exists, honor it
    if (this.prompts.has(requestedId)) {
      return requestedId;
    }

    // Only attempt optimization when caller indicates Codex usage (approvalMode provided)
    const hasApprovalMode = typeof variables?.approvalMode === 'string' && variables.approvalMode.length > 0;
    if (!hasApprovalMode || !this.optimizationEnabled) {
      return requestedId;
    }

    // Map base ID to optimized ID if available
    const mapEntry = this.idMap.get(requestedId);
    if (mapEntry?.optimized) {
      const optimizedId = mapEntry.optimized;
      if (optimizedId && this.prompts.has(optimizedId)) {
        return optimizedId;
      }
      // Fallback to original when optimized not present
      if (this.fallbackToOriginal && this.prompts.has(mapEntry.original)) {
        return mapEntry.original;
      }
    }

    // If no mapping found, return the requested ID (may throw later if not present)
    return requestedId;
  }

  /**
   * Validate variables against template requirements
   */
  private validateVariables(frontmatter: PromptFrontmatter, variables: Record<string, any>): ValidationResult {
    const errors: string[] = [];

    if (frontmatter.variables) {
      for (const [name, definition] of Object.entries(frontmatter.variables)) {
        if (definition.required && !(name in variables)) {
          errors.push(`Missing required variable: ${name}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * List all available prompts
   */
  public listPrompts(): PromptMetadata[] {
    const metadata: PromptMetadata[] = [];

    this.prompts.forEach((template, id) => {
      const category = id.split('-')[0]; // Extract category from ID
      metadata.push({
        id,
        name: template.frontmatter.name,
        version: template.frontmatter.version,
        description: template.frontmatter.description,
        category
      });
    });

    return metadata;
  }
}
