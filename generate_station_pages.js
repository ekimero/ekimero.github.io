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

stationNames.forEach(station => {
  // Get all unique lines for this station
  const stationLines = [...new Set(
    stations.filter(s => s.station === station).map(s => s.line)
  )];

  // Build line logos HTML
  const lineLogosHTML = stationLines.map(line => 
    `<img src="/images/${line}.png" alt="${line}ロゴ" class="line-logo" style="max-height:48px; height:auto; margin-right:8px;">`
  ).join('');

  // Replace placeholders in template
  let html = template.replace(/\{\{station\}\}/g, station);
  html = html.replace(/\{\{lineLogos\}\}/g, lineLogosHTML);

  // Save as stations/[station].html
  const filename = path.join(outputDir, `${station}.html`);
  fs.writeFileSync(filename, html, 'utf8');
  console.log(`Generated: ${filename}`);
});
