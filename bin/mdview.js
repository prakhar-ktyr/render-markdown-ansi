#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { renderMarkdown } = require('../dist/index.js');

// Get the file path from the command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log('Usage: mdview <file.md>');
  process.exit(args.length === 0 ? 1 : 0);
}

const filePath = path.resolve(process.cwd(), args[0]);

try {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at ${filePath}`);
    process.exit(1);
  }

  const markdownContent = fs.readFileSync(filePath, 'utf8');
  console.log(renderMarkdown(markdownContent));
} catch (error) {
  console.error(`Error reading file: ${error.message}`);
  process.exit(1);
}
