#!/usr/bin/env node

/**
 * Generates a manifest.json file for documentation builds
 * Usage: node generate-manifest.js <docs_path> <repository> <commit_sha>
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';

/**
 * Detects the documentation generator tool and version
 * @param {string} docsPath - Path to the documentation folder
 * @returns {{tool: string, version: string}}
 */
function detectDocGenerator(docsPath) {
  const cwd = process.cwd();

  // Check for Sphinx
  const sphinxConfPaths = [
    join(docsPath, 'conf.py'),
    join(cwd, 'conf.py')
  ];

  for (const confPath of sphinxConfPaths) {
    if (existsSync(confPath)) {
      try {
        const version = execSync('sphinx-build --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] })
          .match(/\d+\.\d+\.\d+/)?.[0] || 'unknown';
        return { tool: 'sphinx', version };
      } catch {
        return { tool: 'sphinx', version: 'unknown' };
      }
    }
  }

  // Check for TypeDoc or JSDoc in package.json
  const packageJsonPath = join(cwd, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      if (deps.typedoc) {
        const version = deps.typedoc.replace(/^[\^~]/, '');
        return { tool: 'typedoc', version };
      }

      if (deps.jsdoc) {
        const version = deps.jsdoc.replace(/^[\^~]/, '');
        return { tool: 'jsdoc', version };
      }
    } catch (err) {
      console.error('Warning: Could not parse package.json:', err.message);
    }
  }

  // Check for JSDoc config files
  const jsdocConfigs = ['.jsdoc.json', 'jsdoc.json'];
  for (const config of jsdocConfigs) {
    if (existsSync(join(cwd, config))) {
      return { tool: 'jsdoc', version: 'unknown' };
    }
  }

  // Check for TypeDoc config
  if (existsSync(join(cwd, 'typedoc.json'))) {
    return { tool: 'typedoc', version: 'unknown' };
  }

  return { tool: 'other', version: 'unknown' };
}

/**
 * Generates the manifest.json file
 */
function generateManifest() {
  const [,, docsPath, repository, commitSha] = process.argv;

  if (!docsPath || !repository || !commitSha) {
    console.error('Usage: node generate-manifest.js <docs_path> <repository> <commit_sha>');
    process.exit(1);
  }

  const resolvedDocsPath = resolve(docsPath);

  if (!existsSync(resolvedDocsPath)) {
    console.error(`Error: Documentation path does not exist: ${resolvedDocsPath}`);
    process.exit(1);
  }

  const generator = detectDocGenerator(docsPath);
  const timestamp = new Date().toISOString();

  const manifest = {
    generated: timestamp,
    generator: {
      tool: generator.tool,
      version: generator.version
    },
    metadata: {
      repository: repository,
      commit: commitSha
    }
  };

  const manifestPath = join(resolvedDocsPath, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log('Generated manifest.json:');
  console.log(JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written to: ${manifestPath}`);
}

generateManifest();
