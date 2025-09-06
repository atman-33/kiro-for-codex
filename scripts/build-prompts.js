#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Recursively find all .md files
function findMarkdownFiles(dir) {
  const files = [];
  
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir);
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// Convert Markdown files to TypeScript modules
function convertMarkdownToTypeScript(mdPath, outputDir) {
  const content = fs.readFileSync(mdPath, 'utf8');
  const { data, content: body } = matter(content);
  
  // Generate TypeScript code
  const tsContent = `// Auto-generated from ${path.relative(process.cwd(), mdPath)}
// DO NOT EDIT MANUALLY

export const frontmatter = ${JSON.stringify(data, null, 2)};

export const content = ${JSON.stringify(body)};

export default {
  frontmatter,
  content
};
`;
  
  // Calculate output path - maintain relative directory structure
  const promptsDir = path.join(__dirname, '..', 'src', 'prompts');
  const relativePath = path.relative(promptsDir, mdPath);
  const tsFileName = relativePath.replace(/\.md$/, '.ts');
  const tsPath = path.join(outputDir, tsFileName);
  
  // Ensure output directory exists
  const tsDir = path.dirname(tsPath);
  if (!fs.existsSync(tsDir)) {
    fs.mkdirSync(tsDir, { recursive: true });
  }
  
  // Write file
  fs.writeFileSync(tsPath, tsContent);
  console.log(`Generated: ${path.relative(process.cwd(), tsPath)}`);
}

// Main function
function main() {
  const promptsDir = path.join(__dirname, '..', 'src', 'prompts');
  const outputDir = path.join(__dirname, '..', 'src', 'prompts', 'target');
  
  // Ensure directory exists
  if (!fs.existsSync(promptsDir)) {
    console.log('Creating prompts directory...');
    fs.mkdirSync(promptsDir, { recursive: true });
  }
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    console.log('Creating prompts target directory...');
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Find and convert all Markdown files
  const mdFiles = findMarkdownFiles(promptsDir);
  
  if (mdFiles.length === 0) {
    console.log('No markdown files found in', promptsDir);
    return;
  }
  
  console.log(`Converting ${mdFiles.length} markdown files...`);
  mdFiles.forEach(mdFile => convertMarkdownToTypeScript(mdFile, outputDir));
  
  console.log('Build complete!');
}

// Run
main();