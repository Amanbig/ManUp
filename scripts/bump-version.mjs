#!/usr/bin/env node
// Bumps the ManUp release version everywhere it needs to stay in sync:
// root/client/server package.json + the version example in README.md.
// Does NOT commit, tag, or push — that stays a manual, reviewed step.

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const PACKAGE_JSON_PATHS = [
  path.join(rootDir, 'package.json'),
  path.join(rootDir, 'client', 'package.json'),
  path.join(rootDir, 'server', 'package.json'),
];
const README_PATH = path.join(rootDir, 'README.md');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function parseSemver(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`"${version}" is not a plain semver version (expected X.Y.Z)`);
  }
  const [, major, minor, patch] = match;
  return { major: Number(major), minor: Number(minor), patch: Number(patch) };
}

function bump(current, keyword) {
  const { major, minor, patch } = parseSemver(current);
  switch (keyword) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Unknown bump keyword "${keyword}" (expected major | minor | patch)`);
  }
}

function resolveNewVersion(arg, currentVersion) {
  if (!arg) {
    throw new Error('Usage: node scripts/bump-version.mjs <newVersion|major|minor|patch>');
  }
  if (['major', 'minor', 'patch'].includes(arg)) {
    return bump(currentVersion, arg);
  }
  parseSemver(arg); // validates the explicit version string
  return arg;
}

const rootPkg = readJson(PACKAGE_JSON_PATHS[0]);
const newVersion = resolveNewVersion(process.argv[2], rootPkg.version);

for (const pkgPath of PACKAGE_JSON_PATHS) {
  const pkg = readJson(pkgPath);
  pkg.version = newVersion;
  writeJson(pkgPath, pkg);
  console.log(`updated ${path.relative(rootDir, pkgPath)} -> ${newVersion}`);
}

const readme = readFileSync(README_PATH, 'utf8');
const updatedReadme = readme.replace(
  /procoder588\/manup:\d+\.\d+\.\d+/g,
  `procoder588/manup:${newVersion}`,
);
if (updatedReadme !== readme) {
  writeFileSync(README_PATH, updatedReadme);
  console.log(`updated README.md example tag -> procoder588/manup:${newVersion}`);
}

const docsPath = path.join(rootDir, 'docs', 'index.html');
try {
  const docsHtml = readFileSync(docsPath, 'utf8');
  const updatedDocs = docsHtml.replace(
    /(<span class="hero-badge">v)\d+\.\d+\.\d+/g,
    `$1${newVersion}`,
  );
  if (updatedDocs !== docsHtml) {
    writeFileSync(docsPath, updatedDocs);
    console.log(`updated docs/index.html badge -> v${newVersion}`);
  }
} catch {
  // Ignore if docs file doesn't exist
}

console.log('\nDone. Review the diff, then cut the release yourself:');
console.log(`  git add -A`);
console.log(`  git commit -m "chore: bump version to v${newVersion}"`);
console.log(`  git tag v${newVersion}`);
console.log(`  git push origin main --tags`);
