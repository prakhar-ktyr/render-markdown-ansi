import { describe, it, expect } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);
const CLI_PATH = path.resolve(__dirname, '../bin/mdview.js');

describe('CLI - mdview', () => {
  it('should display help message', async () => {
    const { stdout } = await execAsync(`node ${CLI_PATH} --help`);
    expect(stdout).toContain('Usage: mdview');
  });

  it('should display version', async () => {
    const { stdout } = await execAsync(`node ${CLI_PATH} --version`);
    expect(stdout).toMatch(/mdview v\d+\.\d+\.\d+/);
  });

  it('should render markdown file', async () => {
    const { stdout } = await execAsync(`node ${CLI_PATH} README.md`);
    expect(stdout).toContain('render-markdown-ansi');
  });

  it('should read from stdin', async () => {
    const { stdout } = await execAsync(`echo "# Hello Stdin" | node ${CLI_PATH} --no-colors`);
    expect(stdout).toContain('Hello Stdin');
  });

  it('should error when file is not found', async () => {
    try {
      await execAsync(`node ${CLI_PATH} non-existent-file.md`);
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.code).toBe(1);
      expect(error.stderr).toContain('Error: File not found');
    }
  });

  it('should error when no file and no stdin is provided', async () => {
    try {
      await execAsync(`node ${CLI_PATH}`);
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.code).toBe(1);
      expect(error.stdout).toContain('Usage: mdview');
    }
  });

  it('should handle options via flags', async () => {
    const { stdout } = await execAsync(`echo "[link](url)" | node ${CLI_PATH} --hide-links --no-colors`);
    expect(stdout).toContain('link');
    expect(stdout).not.toContain('url');
  });
});
