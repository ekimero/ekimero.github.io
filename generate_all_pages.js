const fs = require('fs').promises;
const path = require('path');

// Configuration
const ROOT = path.resolve(__dirname);
const OUT_FILE = path.join(ROOT, 'all-pages.html');
const SITE_PREFIX = '/'; // links will be generated as /path/to/file.html

// Directories to skip while scanning (common asset or large folders)
const SKIP_DIRS = new Set([
  'node_modules', 'node_modules1', 'audio', 'images', 'analytics', '.git'
]);

async function walk(dir) {
  let results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    // Skip configured directories
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;

    if (entry.isDirectory()) {
      const sub = await walk(full);
      results = results.concat(sub);
      continue;
    }

    // Collect only HTML files
    if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.html') {
      // Skip the generated file itself so re-running is idempotent
      if (path.relative(ROOT, full).replace(/\\/g, '/') === path.basename(OUT_FILE)) continue;
      results.push(full);
    }
  }
  return results;
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function build() {
  const files = await walk(ROOT);
  files.sort((a, b) => a.localeCompare(b));

  // Group by directory for nicer output
  const groups = new Map();
  for (const f of files) {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    const dir = path.dirname(rel);
    const stat = await fs.stat(f);
    const date = formatDate(stat.mtime);
    const name = path.basename(rel);
    const display = rel === 'index.html' ? '/' : `/${rel}`;
    if (!groups.has(dir)) groups.set(dir, []);
    groups.get(dir).push({ rel: display, name, date });
  }

  // Build HTML page that fits the site's theme (links to /index.css and logo)
  const title = 'サイト内の全ページ一覧 | どこでも駅メロ';
  const header = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/index.css">
  <link rel="icon" href="/images/new-logo.png" type="image/png">
  <style>
    /* Local styles to make the listing clean and fit the site theme */
    .hero { text-align:center; padding:40px 18px 24px; }
    .hero h1 { color: #1976d2; font-size:2.2em; margin:0 0 8px; font-weight:800; }
    .hero p { color:#333; max-width:900px; margin:0 auto 20px; font-size:1.05em; }
    .group-card { border:1px solid #e6e9ef; border-radius:12px; background:#fff; padding:16px; margin-bottom:18px; box-shadow:0 2px 6px rgba(0,0,0,0.03); }
    .group-title { color:#1976d2; margin:0 0 12px; font-size:1.05em; }
    .pages-grid { display:grid; grid-template-columns: repeat(auto-fill,minmax(260px,1fr)); gap:10px; }
    .page-card { display:flex; flex-direction:column; gap:6px; padding:12px; border-radius:10px; background:#f7fbff; text-decoration:none; color:inherit; border:1px solid rgba(25,118,210,0.06); }
    .page-name { font-weight:700; color:#1976d2; }
    .page-meta { color:#666; font-size:0.92em; }
    @media (max-width:600px){ .pages-grid { grid-template-columns: repeat(auto-fill,minmax(160px,1fr)); } }
  </style>
</head>
<body>
  <header style="padding:18px 20px;display:flex;align-items:center;gap:12px;">
    <a href="/index.html" class="title-link" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit;">
      <img src="/logo.png" alt="どこでも駅メロ" style="height:48px;">
      <div>
        <div style="font-weight:700;font-size:1.2rem;">どこでも駅メロ</div>
        <div style="font-size:0.9rem;color:#666;">サイト内の全ページ一覧</div>
      </div>
    </a>
  </header>
  <main style="max-width:1100px;margin:18px auto;padding:0 18px;">
    <section class="hero">
      <h1>サイト内の全ページ一覧</h1>
      <p>このページはクローラーや検索用に、サイト内に存在する HTML ページを一覧化した静的ページです。自動生成されます。最新化するにはリポジトリで <code>generate_all_pages.js</code> を実行してください。</p>
    </section>
    <section style="margin-bottom:28px;">
`;

  let body = '';
  // For top-level files (dir === '.') show first in a compact card
  const topKey = '.';
  if (groups.has(topKey)) {
    body += '      <div class="group-card">\n        <h3 class="group-title">/ (ルート)</h3>\n        <div class="pages-grid">\n';
    for (const item of groups.get(topKey)) {
      body += `          <a class="page-card" href="${escapeHtml(item.rel)}">\n            <div class="page-name">${escapeHtml(item.name)}</div>\n            <div class="page-meta">${escapeHtml(item.date)}</div>\n          </a>\n`;
    }
    body += '        </div>\n      </div>\n';
  }

  // Other directories: render each directory as its own card with a responsive grid of page cards
  const sortedDirs = [...groups.keys()].filter(k => k !== topKey).sort();
  for (const dir of sortedDirs) {
    const displayDir = dir === '.' ? '/' : `/${dir}`;
    body += `      <div class="group-card">\n        <h3 class="group-title">${escapeHtml(displayDir)}</h3>\n        <div class="pages-grid">\n`;
    for (const item of groups.get(dir)) {
      body += `          <a class="page-card" href="${escapeHtml(item.rel)}">\n            <div class="page-name">${escapeHtml(item.name)}</div>\n            <div class="page-meta">${escapeHtml(item.date)}</div>\n          </a>\n`;
    }
    body += '        </div>\n      </div>\n';
  }

  const footer = `    </section>\n  </main>\n  <footer style="text-align:center;color:#666;padding:28px 12px;">\n    © ${new Date().getFullYear()} どこでも駅メロ — 静的な全ページ一覧\n  </footer>\n</body>\n</html>`;

  const out = header + body + footer;
  await fs.writeFile(OUT_FILE, out, 'utf8');
  console.log(`Wrote ${OUT_FILE} (${files.length} pages)`);
}

build().catch(err => {
  console.error('Error building all-pages:', err);
  process.exit(1);
});
