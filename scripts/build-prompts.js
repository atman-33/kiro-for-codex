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
  // Normalize body newlines to LF to ensure consistent output across OSes
  const normalizedBody = body.replace(/\r\n/g, '\n');
  // Normalize the displayed source path to POSIX-style (forward slashes)
  const displayMdPath = path.relative(process.cwd(), mdPath).split(path.sep).join('/');
  
  // Generate TypeScript code
  const tsContent = `// Auto-generated from ${displayMdPath}
// DO NOT EDIT MANUALLY

export const frontmatter = ${JSON.stringify(data, null, 2)};

export const content = ${JSON.stringify(normalizedBody)};

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
  
  // Write file with LF line endings regardless of host OS
  const tsContentLF = tsContent.replace(/\r\n/g, '\n');
  fs.writeFileSync(tsPath, tsContentLF, { encoding: 'utf8' });
  console.log(`Generated: ${path.relative(process.cwd(), tsPath)}`);
}

// Generate index.ts that re-exports all prompt modules
function generateIndex(outputDir) {
  // Collect all .ts files under outputDir (recursively), excluding index.ts
  function walk(dir) {
    const entries = fs.readdirSync(dir);
    const files = [];
    for (const entry of entries) {
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        files.push(...walk(full));
      } else if (stat.isFile() && entry.endsWith('.ts') && entry !== 'index.ts') {
        files.push(full);
      }
    }
    return files;
  }

  const files = walk(outputDir);

  // Create export lines with stable camelCase aliases
  const toCamel = (filePath) => path
    .basename(filePath, '.ts')
    .split('-')
    .map((seg, i) => (i === 0 ? seg : seg.charAt(0).toUpperCase() + seg.slice(1)))
    .join('');

  const relFromOutput = (absPath) => {
    const rel = path.relative(outputDir, absPath).split(path.sep).join('/');
    return './' + rel.replace(/\.ts$/, '');
  };

  const lines = [
    '// Auto-generated index file',
    '// Re-export all prompt modules',
    ''
  ];

  // Ensure deterministic ordering
  files.sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const alias = toCamel(file);
    const modulePath = relFromOutput(file);
    lines.push(`export { default as ${alias} } from '${modulePath}';`);
  }

  const indexPath = path.join(outputDir, 'index.ts');
  const content = lines.join('\n') + '\n';
  fs.writeFileSync(indexPath, content, { encoding: 'utf8' });
  console.log(`Generated index: ${path.relative(process.cwd(), indexPath)}`);
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
  
  // After generating modules, rebuild index to include all prompts
  generateIndex(outputDir);

  console.log('Build complete!');
}

// Run
main();
