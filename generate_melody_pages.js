const fs = require('fs');
const path = require('path');

// Load template
const templatePath = path.join(__dirname, 'melody-template.html');
const template = fs.readFileSync(templatePath, 'utf8');

// Load stations data
const stations = JSON.parse(fs.readFileSync(path.join(__dirname, 'stations.json'), 'utf8'));

// Group by melody file if available, otherwise by melody name
const melodiesMap = new Map();

stations.forEach(s => {
  const key = (s.file && s.file.trim()) ? s.file.trim() : (s.melody ? s.melody.trim() : '__unknown__');
  if (!melodiesMap.has(key)) melodiesMap.set(key, []);
  melodiesMap.get(key).push(s);
});

// Output directory
const outDir = path.join(__dirname, 'melodies');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, function (s) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]);
  });
}

melodiesMap.forEach((entries, key) => {
  let melodyName = '';
  let audioSrc = '';

  if (key === '__unknown__') {
    melodyName = '未指定のメロディー';
  } else if (/\.[a-z0-9]{2,5}$/i.test(key)) {
    const firstEntry = entries.find(e => e.melody && e.melody.trim());
    melodyName = firstEntry ? firstEntry.melody.trim() : path.basename(key).replace(/\.[^.]+$/, '');
    audioSrc = key.startsWith('/') ? key : `/${key}`;
  } else {
    melodyName = key;
  }

  // Get unique lines for logo display
  const uniqueLines = [...new Set(entries.map(e => e.line).filter(Boolean))];
  const lineLogosHTML = uniqueLines.map(line => 
    `<img src="/images/${escapeHtml(line)}.png" alt="${escapeHtml(line)}ロゴ" style="max-height:48px; height:auto; margin-right:8px; border-radius:6px;">`
  ).join('');

  // audio block
  const audioBlock = audioSrc ? `<div style="margin-top:12px; display:flex; gap:8px; align-items:center; justify-content:center;"><audio id="melodyAudio" controls controlsList="nodownload" src="${escapeHtml(audioSrc)}" style="width:100%;max-width:420px;"></audio><label style="font-size:0.95em;color:#fff;"><input id="melodyLoop" type="checkbox" style="margin-left:6px;"> ループ</label></div>` : '<div style="color:#888; margin-top:12px;">音源なし</div>';

  // Group by company then by line
  const companies = [
    { id: 'jr', name: 'JR東日本' },
    { id: 'metro', name: '東京メトロ' },
    { id: 'toei', name: '都営地下鉄' },
    { id: 'archive', name: '過去のメロディ' }
  ];

  // Pre-render stations HTML
  const stationsHTML = companies.map(company => {
    const companyEntries = entries.filter(e => 
      e.company === company.name || (company.id === 'archive' && (e.company === '過去のメロディ' || e.status === '過去'))
    );
    
    if (!companyEntries.length) return '';

    // Group by line
    const linesMap = {};
    companyEntries.forEach(m => {
      const lineKey = m.line || 'その他';
      if (!linesMap[lineKey]) linesMap[lineKey] = [];
      linesMap[lineKey].push(m);
    });

    return `
      <section style="margin-bottom:28px;">
        <h2 style="color:#1976d2; margin-bottom:12px; text-align:center;">${escapeHtml(company.name)}</h2>
        ${Object.entries(linesMap).map(([line, list]) => {
          const logoSrc = `/images/${escapeHtml(line)}.png`;
          let basePath = '';
          if (company.id === 'jr') basePath = '/jr-east';
          else if (company.id === 'metro') basePath = '/tokyo-metro';
          else if (company.id === 'toei') basePath = '/toei';
          else basePath = '/archive';
          const lineUrl = `${basePath}/${encodeURIComponent(line)}.html`;

          return `
            <div style="border:1px solid #ddd; border-radius:16px; background:#fafafa; padding:18px; margin-bottom:20px;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                <img src="${logoSrc}" alt="${escapeHtml(line)}ロゴ" style="max-width:24px; height:auto;">
                <h3 style="margin:0; font-size:1.1em;"><a href="${lineUrl}" style="color:#1976d2; text-decoration:underline;">${escapeHtml(line)}</a></h3>
              </div>
              ${list.map(st => `
                <div style="padding:10px 12px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                  <div style="text-align:left;">
                    <a href="/stations/${encodeURIComponent(st.station)}.html" style="font-weight:700; color:#1976d2; text-decoration:underline;">${escapeHtml(st.station)}</a>
                    <div style="font-size:0.95em; color:#666;">${escapeHtml(st.melody || '')}${st.direction ? ` (${escapeHtml(st.direction)})` : ''}</div>
                  </div>
                  <div style="font-size:0.9em; color:#888;">${escapeHtml(st.company || '')}</div>
                </div>
              `).join('')}
            </div>
          `;
        }).join('')}
      </section>
    `;
  }).join('');

  // Fill template
  let outHtml = template.replace(/\{\{melody\}\}/g, escapeHtml(melodyName));
  outHtml = outHtml.replace('{{audioBlock}}', audioBlock);
  
  // Replace the melody-stations-container with pre-rendered HTML
  outHtml = outHtml.replace(
    /<div id="melody-stations-container"[^>]*><\/div>/,
    `<div id="melody-stations-container" style="text-align:left; max-width:1052px; margin:0 auto;">${stationsHTML}</div>`
  );
  
  // Add line logos to the header
  outHtml = outHtml.replace(
    /<div id="station-line-logos"[^>]*><\/div>/,
    `<div id="station-line-logos" style="margin-bottom:16px; display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">${lineLogosHTML}</div>`
  );

  // Set background image from a random line (if we have lines)
  if (uniqueLines.length > 0) {
    const randomLine = uniqueLines[Math.floor(Math.random() * uniqueLines.length)];
    const bgImageUrl = `url("/images/${escapeHtml(randomLine)}.jpg")`;
    // Set the CSS custom property on the melody-header div
    outHtml = outHtml.replace(
      /(<div class="station-header melody-header"[^>]*)(>)/,
      `$1 style="--station-bg-image: ${bgImageUrl};"$2`
    );
  }

  // Filename
  const fileNameSafe = melodyName.replace(/[\/]+/g, '_');
  const outPath = path.join(outDir, `${fileNameSafe}.html`);
  fs.writeFileSync(outPath, outHtml, 'utf8');
  console.log(`Generated melody page: ${outPath}`);
});