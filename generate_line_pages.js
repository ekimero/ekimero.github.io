const fs = require('fs');
const path = require('path');

// Load HTML template
const template = fs.readFileSync('line-template.html', 'utf8');

// Load station data
const stations = JSON.parse(fs.readFileSync('stations.json', 'utf8'));

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
    // Get stations on this line
    const lineStations = stations
      .filter(st => st.company === company && st.line === line)
      .map(st => st.name)
      .join('<br>\n'); // HTML line breaks

    // Fill template
    let html = template.replace(/\{\{line\}\}/g, line);
    html = html.replace(/\{\{basePath\}\}/g, folderName);
    html = html.replace(/\{\{stations\}\}/g, lineStations);

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
