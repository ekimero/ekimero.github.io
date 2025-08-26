// station.js
// This script loads all melodies for the current station and displays them with audio players.

// Get station name from the page (from the <h1> text)
const stationName = document.querySelector('.station-hero h1').textContent.replace('駅の発車メロディー', '').trim();

fetch('/stations.json')
  .then(res => res.json())
  .then(data => {
    // Filter melodies for this station
    const melodies = data.filter(st => st.station === stationName);
    const melodyList = document.getElementById('melody-list');
    if (melodies.length === 0) {
      melodyList.innerHTML = '<div style="color:#888;font-size:1.1em;">メロディー情報がありません。</div>';
      return;
    }
    melodyList.innerHTML = melodies.map(st => {
      let audioSrc = '';
      if (st.file) {
        if (st.file.match(/^https?:\/\//)) {
          audioSrc = st.file;
        } else {
          audioSrc = '//audio/' + st.file.replace(/^\/?audio\//, '');
        }
      }
      const stationLink = `<a href="/stations/${encodeURIComponent(st.station)}.html" style="color:#1976d2;text-decoration:underline;font-weight:700;">${st.station}</a>`;
      return `<div style="padding:18px 0;border-bottom:1px solid #eee;display:flex;align-items:center;gap:18px;">
        <span style="font-size:1.1em;min-width:120px;">${st.melody}</span>
        ${audioSrc ? `<audio controls src="${audioSrc}" style="width:180px;min-width:120px;"></audio>` : '<span style="color:#888;">音源なし</span>'}
        <span style="font-size:0.95em;color:#555;">${stationLink} / ${st.company} / ${st.line}</span>
      </div>`;
    }).join('');
  });
