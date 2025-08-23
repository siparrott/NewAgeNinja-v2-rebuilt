import { promises as fs } from 'fs';
import pkg from 'glob';
const { glob } = pkg;
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fixImports() {
  // Pattern to match relative imports without .js extension
  const patterns = [
    /from ['"](\.\.[^'"]*?)(?<!\.js)['"]/g,  // ../ imports
    /from ['"](\.[^'"]*?)(?<!\.js)['"]/g,    // ./ imports
  ];

  const files = await glob('**/*.ts', { 
    cwd: process.cwd(),
    ignore: ['node_modules/**', 'dist/**', '*.d.ts', 'client/**'],
    absolute: true 
  });

  let totalFixed = 0;

  for (const file of files) {
    try {
      let content = await fs.readFile(file, 'utf-8');
      let modified = false;

      for (const pattern of patterns) {
        const newContent = content.replace(pattern, (match, importPath) => {
          // Skip if already has .js extension
          if (importPath.endsWith('.js')) return match;
          
          // Skip if it's a type-only import of shared/schema
          if (importPath.includes('shared/schema') && match.includes('type')) return match;
          
          // Add .js extension
          const result = match.replace(importPath, importPath + '.js');
          modified = true;
          return result;
        });
        content = newContent;
      }

      if (modified) {
        await fs.writeFile(file, content, 'utf-8');
        totalFixed++;
        console.log(`Fixed: ${file}`);
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }

  console.log(`\nFixed ${totalFixed} files with missing .js extensions`);
}

fixImports().catch(console.error);
