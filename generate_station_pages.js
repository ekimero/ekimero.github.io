const fs = require('fs');
const path = require('path');

// Load template
const template = fs.readFileSync('station-template.html', 'utf8');
// Load station data
const stations = JSON.parse(fs.readFileSync('stations.json', 'utf8'));

// Get unique station names
const stationNames = [...new Set(stations.map(st => st.station))];

// Generate a page for each station
const outputDir = path.join(__dirname, 'stations');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, function (s) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]);
  });
}

stationNames.forEach(station => {
  // Get all melodies for this station
  const stationMelodies = stations.filter(s => s.station === station);
  
  if (stationMelodies.length === 0) {
    return; // Skip stations with no melodies
  }

  // Get all unique lines for this station
  const stationLines = [...new Set(stationMelodies.map(s => s.line))];

  // Build line logos HTML
  const lineLogosHTML = stationLines.map(line => 
    `<img src="/images/${escapeHtml(line)}.png" alt="${escapeHtml(line)}ロゴ" style="max-width:48px; height:auto; margin-right:8px; border-radius:8px;">`
  ).join('');

  // Group melodies by company
  const companies = [
    { id: 'jr', name: 'JR東日本' },
    { id: 'metro', name: '東京メトロ' },
    { id: 'toei', name: '都営地下鉄' },
    { id: 'archive', name: '過去のメロディ' }
  ];

  // Pre-render company sections HTML
  const companySectionsHTML = companies.map(company => {
    const companyMelodies = stationMelodies.filter(m => 
      m.company === company.name || (company.id === 'archive' && (m.company === '過去のメロディ' || m.status === '過去'))
    );
    
    if (!companyMelodies.length) return '';

    // Group by line
    const linesMap = {};
    companyMelodies.forEach(m => {
      if (!linesMap[m.line]) linesMap[m.line] = [];
      linesMap[m.line].push(m);
    });

    return `
      <section style="margin-bottom:32px;">
        <h2 style="color:#1976d2; margin-bottom:16px;">${escapeHtml(company.name)}</h2>
        ${Object.entries(linesMap).map(([line, melodies]) => {
          const logoSrc = `/images/${escapeHtml(line)}.png`;
          let basePath = '';
          if (company.id === 'jr') basePath = '/jr-east';
          else if (company.id === 'metro') basePath = '/tokyo-metro';
          else if (company.id === 'toei') basePath = '/toei';
          else basePath = '/archive';
          const lineUrl = `${basePath}/${encodeURIComponent(line)}.html`;
          
          return `
            <div style="border:1px solid #ddd; border-radius:16px; background:#fafafa; padding:20px; margin-bottom:28px;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                <img src="${logoSrc}" alt="${escapeHtml(line)}ロゴ" style="max-width:24px; height:auto;">
                <h3 style="margin:0; font-size:1.2em;">
                  <a href="${lineUrl}" style="color:#1976d2; text-decoration:underline;">${escapeHtml(line)}</a>
                </h3>
              </div>
              ${melodies.map(m => {
                const audioSrc = m.file ? (m.file.startsWith('/') ? m.file : `/${m.file}`) : '';
                const melodyUrl = `/melodies/${encodeURIComponent(m.melody)}.html`;
                return `
                  <div class="melody-item" style="margin-bottom:16px; padding:24px; border-radius:16px; background:#fff; box-shadow:0 3px 12px rgba(0,0,0,0.08); display:flex; flex-direction:column; gap:12px; align-items:flex-start;">
                    <div class="melody-name" style="font-weight:600; font-size:1.15em; text-align:left;">
                      <a href="${melodyUrl}" style="color:#333; text-decoration:underline;">${escapeHtml(m.melody || '発車メロディーなし')}</a> ${m.direction ? `(${escapeHtml(m.direction)}方面)` : ''}
                    </div>
                    ${audioSrc ? `
                      <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
                        <audio controls controlsList="nodownload" src="${audioSrc}" style="width:100%;"></audio>
                        <label style="font-size:0.9em; cursor:pointer; display:flex; align-items:center; gap:4px;">
                          <input type="checkbox" class="loop-checkbox"> ループ
                        </label>
                      </div>
                    ` : '<span style="color:#888;">音源なし</span>'}
                  </div>
                `;
              }).join('')}
            </div>
          `;
        }).join('')}
      </section>
    `;
  }).join('');

  // Replace placeholders in template
  let html = template.replace(/\{\{station\}\}/g, escapeHtml(station));
  html = html.replace(/\{\{lineLogos\}\}/g, lineLogosHTML);
  
  // Replace the company-sections container with pre-rendered HTML
  html = html.replace(
    /<div id="company-sections"><\/div>/,
    `<div id="company-sections">${companySectionsHTML}</div>`
  );

  // Remove or comment out the JavaScript that fetches and renders (keep only filtering)
  // We'll keep the filter functionality but remove the fetch/render logic

  // Save as stations/[station].html
  const filename = path.join(outputDir, `${station}.html`);
  fs.writeFileSync(filename, html, 'utf8');
  console.log(`Generated: ${filename}`);
});