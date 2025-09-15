/**
 * Type definitions for the prompt system
 */

export interface PromptVariable {
	type: "string" | "number" | "boolean" | "array" | "object";
	required?: boolean;
	default?: any;
	description?: string;
}

export interface PromptFrontmatter {
	id: string;
	name: string;
	version: string;
	description?: string;
	author?: string;
	tags?: string[];
	extends?: string;
	variables?: Record<string, PromptVariable>;
}

export interface PromptTemplate {
	frontmatter: PromptFrontmatter;
	content: string;
}

export interface PromptMetadata {
	id: string;
	name: string;
	version: string;
	description?: string;
	category: string;
}

export interface ValidationResult {
	valid: boolean;
	errors?: string[];
}
