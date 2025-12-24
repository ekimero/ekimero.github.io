#!/usr/bin/env node
// generate_sitemap.js
// Scans the workspace for .html files and writes sitemap.xml (+ sitemap.xml.gz)

const fs = require('fs').promises;
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname);
const OUT = path.join(ROOT, 'sitemap.xml');
const OUT_GZ = path.join(ROOT, 'sitemap.xml.gz');
const SITE_URL = process.env.SITE_URL || 'https://ekimero.github.io';

// directories to include in sitemap
const INCLUDE_DIRS = new Set(['jr-east', 'tokyo-metro', 'toei', 'stations', 'lines', 'melodies']);
// directories to skip while scanning
const SKIP_DIRS = new Set(['node_modules', '.git', 'audio', 'images', 'analytics', 'node_modules1', 'docs']);
// files to skip
const SKIP_FILES = new Set(['sitemap.xml', 'sitemap.xml.gz']);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const res = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      files.push(...await walk(res));
    } else if (e.isFile()) {
      files.push(res);
    }
  }
  return files;
}

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

function toUrl(root, file) {
  let rel = path.relative(root, file).replace(/\\/g, '/');
  // skip files in root that are not site pages
  if (rel === 'index.html') return SITE_URL + '/';
  // encode each path segment to preserve unicode & spaces
  const parts = rel.split('/').map(p => encodeURIComponent(p));
  return SITE_URL.replace(/\/$/, '') + '/' + parts.join('/');
}

(async () => {
  try {
    console.log('Scanning for HTML files under', ROOT);
    const all = await walk(ROOT);
    const htmlFiles = all.filter(f => f.toLowerCase().endsWith('.html'))
      .filter(f => !SKIP_FILES.has(path.basename(f)))
      .filter(f => !f.includes('/.git/'));

    // remove potential sitemap or very large non-site html
    // Optionally, filter out some top-level files (like 404 pages) by adding checks here

    const urls = [];
    for (const f of htmlFiles) {
      const rel = path.relative(ROOT, f);
      const parts = rel.split(path.sep);
      
      // Skip files in skipped folders (defensive)
      if (parts.some(p => SKIP_DIRS.has(p))) continue;
      
      // Only include files from allowed directories or root index.html
      const isRootIndex = rel === 'index.html';
      const isInAllowedDir = parts.some(p => INCLUDE_DIRS.has(p));
      
      if (!isRootIndex && !isInAllowedDir) continue;
      
      const st = await fs.stat(f);
      const lastmod = formatDate(st.mtime);
      const loc = toUrl(ROOT, f);
      urls.push({ loc, lastmod });
    }

    // build sitemap xml
    const header = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    const footer = '\n</urlset>\n';
    const body = urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`).join('\n');

    await fs.writeFile(OUT, header + body + footer, 'utf8');
    console.log('Wrote', OUT, 'with', urls.length, 'entries');

    // also write gzipped version
    const xml = await fs.readFile(OUT);
    const gz = zlib.gzipSync(xml);
    await fs.writeFile(OUT_GZ, gz);
    console.log('Wrote', OUT_GZ);

    // done
  } catch (err) {
    console.error('Error generating sitemap:', err);
    process.exit(1);
  }
})();
