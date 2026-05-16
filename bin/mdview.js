#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { renderMarkdown } = require('../dist/index.js');
const pkg = require('../package.json');

const args = process.argv.slice(2);

const options = {
  width: process.stdout.columns || 80,
  colors: true,
  unicode: true,
  showLinks: true
};

const positionalArgs = [];

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--no-colors') {
    options.colors = false;
  } else if (arg === '--no-unicode') {
    options.unicode = false;
  } else if (arg === '--hide-links') {
    options.showLinks = false;
  } else if (arg.startsWith('--width=')) {
    const w = parseInt(arg.substring(8), 10);
    if (!isNaN(w)) {
      options.width = w;
    }
  } else if (arg === '--help' || arg === '-h') {
    console.log(`Usage: mdview [options] <file.md>
       cat <file.md> | mdview [options]

Options:
  --no-colors     Disable ANSI colors
  --no-unicode    Use ASCII characters instead of Unicode
  --hide-links    Do not show URLs after link text
  --width=<n>     Set terminal wrap width (default: auto)
  -v, --version   Show version number
  -h, --help      Show this help message`);
    process.exit(0);
  } else if (arg === '--version' || arg === '-v') {
    console.log(`mdview v${pkg.version}`);
    process.exit(0);
  } else {
    positionalArgs.push(arg);
  }
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    
    // Set a timeout in case stdin is kept open but nothing is piped
    // (e.g. running without a TTY but no piped data)
    const timeout = setTimeout(() => {
      resolve('');
    }, 100);

    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (chunk) => {
      clearTimeout(timeout);
      data += chunk;
    });
    
    process.stdin.on('end', () => {
      clearTimeout(timeout);
      resolve(data);
    });
  });
}

async function run() {
  try {
    // If a file is explicitly provided, read the file
    if (positionalArgs.length > 0) {
      const filePath = path.resolve(process.cwd(), positionalArgs[0]);
      if (!fs.existsSync(filePath)) {
        console.error(`Error: File not found at ${filePath}`);
        process.exit(1);
      }
      const markdownContent = fs.readFileSync(filePath, 'utf8');
      console.log(renderMarkdown(markdownContent, options));
      return;
    }

    // Otherwise, try to read from stdin if it's not a TTY
    if (!process.stdin.isTTY) {
      const stdinData = await readStdin();
      if (stdinData.trim().length > 0) {
        console.log(renderMarkdown(stdinData, options));
        return;
      }
    }
    
    // If no file and no stdin, show usage
    console.log('Usage: mdview [options] <file.md>');
    console.log('Use "mdview --help" for more information.');
    process.exit(1);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

run();
