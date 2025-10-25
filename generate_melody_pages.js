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
  // prefer file as key when present
  const key = (s.file && s.file.trim()) ? s.file.trim() : (s.melody ? s.melody.trim() : '__unknown__');
  if (!melodiesMap.has(key)) melodiesMap.set(key, []);
  melodiesMap.get(key).push(s);
});

// Output directory
const outDir = path.join(__dirname, 'melodies');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

melodiesMap.forEach((entries, key) => {
  // Derive melody display name and audio src
  let melodyName = key;
  let audioSrc = '';

  if (key === '__unknown__') {
    melodyName = '未指定のメロディー';
  } else if (/\.[a-z0-9]{2,5}$/i.test(key)) {
    // key looks like filename
    melodyName = path.basename(key).replace(/\.[^.]+$/, '');
    audioSrc = key.startsWith('/') ? key : `/${key}`;
  } else {
    // treat key as melody name
    melodyName = key;
  }

  // Build station list HTML
  const stationListHtml = entries.map(e => {
    const stationUrl = `/stations/${encodeURIComponent(e.station)}.html`;
    const lineInfo = e.line ? `・${e.line}` : '';
    const company = e.company ? ` (${e.company})` : '';
    return `<div style="padding:8px 12px; border-bottom:1px solid #eee;"><a href=\"${stationUrl}\" style=\"color:#1976d2;text-decoration:underline;font-weight:700;\">${e.station}</a> ${lineInfo}${company} <div style=\"font-size:0.95em;color:#666;\">${e.melody || ''}</div></div>`;
  }).join('\n');

  // audio block
  const audioBlock = audioSrc ? `<div style="margin-top:12px; display:flex; gap:8px; align-items:center; justify-content:center;"><audio id=\"melodyAudio\" controls controlsList=\"nodownload\" src=\"${audioSrc}\" style=\"width:100%;max-width:420px;\"></audio><label style=\"font-size:0.95em;color:#fff;\"><input id=\"melodyLoop\" type=\"checkbox\" style=\"margin-left:6px;\"> ループ</label></div>` : '<div style="color:#888; margin-top:12px;">音源なし</div>';

  // Fill template
  let outHtml = template.replace(/\{\{melody\}\}/g, escapeHtml(melodyName));
  outHtml = outHtml.replace('{{audioBlock}}', audioBlock);
  outHtml = outHtml.replace('{{stationList}}', stationListHtml);

  // Filename
  const fileNameSafe = melodyName.replace(/[\/]+/g, '_');
  const outPath = path.join(outDir, `${fileNameSafe}.html`);
  fs.writeFileSync(outPath, outHtml, 'utf8');
  console.log(`Generated melody page: ${outPath}`);
});

function escapeHtml(str) {
  return String(str).replace(/[&<>\"]/g, function (s) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[s]);
  });
}
