#!/usr/bin/env node
// Copy src/resources/* to dist/resources preserving structure.
// Removes the destination directory first to avoid stale files.

const fs = require('fs');
const path = require('path');

const srcRoot = path.resolve(process.cwd(), 'src', 'resources');
const destRoot = path.resolve(process.cwd(), 'dist', 'resources');

function rimrafSync(target) {
  if (!fs.existsSync(target)) return;
  const stat = fs.lstatSync(target);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(target)) {
      rimrafSync(path.join(target, entry));
    }
    fs.rmdirSync(target);
  } else {
    fs.unlinkSync(target);
  }
}

function ensureDirSync(dir) {
  if (fs.existsSync(dir)) return;
  ensureDirSync(path.dirname(dir));
  try {
    fs.mkdirSync(dir);
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
  }
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDirSync(dest);
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    ensureDirSync(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

if (!fs.existsSync(srcRoot)) {
  console.warn(`[copy-resources] Source not found: ${srcRoot}`);
  process.exit(0);
}

rimrafSync(destRoot);
ensureDirSync(destRoot);
copyRecursive(srcRoot, destRoot);
console.log(`[copy-resources] Copied resources -> ${destRoot}`);

