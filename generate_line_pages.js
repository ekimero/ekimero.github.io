const fs = require('fs');
const path = require('path');

// Load HTML template
const template = fs.readFileSync('line-template.html', 'utf8');

// Load station data
const stations = JSON.parse(fs.readFileSync('stations.json', 'utf8'));

function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, function (s) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]);
  });
}

// Function to generate pages for a given company
function generateLinePages(company, folderName) {
  // Get unique lines for this company
  const lines = [...new Set(stations.filter(st => st.company === company).map(st => st.line))];

  // Output directory
  const outputDir = path.join(__dirname, folderName);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Generate an HTML page for each line
  lines.forEach(line => {
    // Get stations on this line for this company
    const lineStations = stations.filter(s =>
      s.company === company && s.line === line
    );

    if (!lineStations.length) {
      return;
    }

    // Group by station
    const stationsMap = {};
    lineStations.forEach(s => {
      if (!stationsMap[s.station]) stationsMap[s.station] = [];
      stationsMap[s.station].push(s);
    });

    // Pre-render stations HTML
    const stationsHTML = Object.entries(stationsMap).map(([station, melodies]) => {
      const stationUrl = `/stations/${encodeURIComponent(station)}.html`;
      return `
        <div class="station-card" style="background:#fff; border-radius:16px; padding:20px; margin-bottom:20px; box-shadow:0 3px 12px rgba(0,0,0,0.08);">
          <div class="station-title" style="font-size:1.3em; font-weight:700; margin-bottom:12px;">
            <a href="${stationUrl}" style="color:#1976d2; text-decoration:underline;">
              ${escapeHtml(station)}駅
            </a>
          </div>
          ${melodies.map(m => {
            const melodyUrl = `/melodies/${encodeURIComponent(m.melody)}.html`;
            const audioSrc = m.file ? (m.file.startsWith('/') ? m.file : `/${m.file}`) : '';
            return `
              <div class="melody-item" style="margin-bottom:16px; padding:16px; background:#fafafa; border-radius:12px;">
                <div class="melody-name" style="font-weight:600; margin-bottom:4px;">
                  <a href="${melodyUrl}" style="color:#333; text-decoration:underline;">${escapeHtml(m.melody || '発車メロディーなし')}</a>
                </div>
                <div class="melody-line" style="font-size:0.9em; color:#666; margin-bottom:8px;">${escapeHtml(m.line)}</div>
                ${audioSrc ? `
                  <div style="display:flex; align-items:center; gap:8px;">
                    <audio class="melody-audio" controls controlsList="nodownload" src="${escapeHtml(audioSrc)}" style="flex:1;"></audio>
                    <label style="font-size:0.85em; cursor:pointer; display:flex; align-items:center; gap:4px;">
                      <input type="checkbox" class="loop-checkbox"> ループ
                    </label>
                  </div>
                ` : '<span style="color:#888;">音源なし</span>'}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }).join('');

    // Determine base path for canonical/OG URLs
    let basePath = folderName;
    
    // Fill template
    let html = template.replace(/\{\{line\}\}/g, escapeHtml(line));
    html = html.replace(/\{\{basePath\}\}/g, basePath);
    
    // Replace the stations-container with pre-rendered HTML
    html = html.replace(
      /<div id="stations-container"[^>]*><\/div>/,
      `<div id="stations-container" style="text-align:left;">${stationsHTML}</div>`
    );

    // Save file
    const filename = path.join(outputDir, `${line}.html`);
    fs.writeFileSync(filename, html, 'utf8');
    console.log(`✅ Generated line page: ${company} - ${line}`);
  });
}

// Generate pages for JR East and Tokyo Metro
generateLinePages('JR東日本', 'jr-east');
generateLinePages('東京メトロ', 'tokyo-metro');
generateLinePages('都営地下鉄', 'toei');