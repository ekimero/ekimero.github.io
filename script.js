let stationData = [];

const companyFilter = document.getElementById('company-filter');
const lineFilter = document.getElementById('line-filter');
const stationFilter = document.getElementById('station-filter');
const melodyFilter = document.getElementById('melody-filter');
const container = document.getElementById('station-list');

fetch('stations.json')
  .then(res => res.json())
  .then(data => {
    stationData = data;
    populateFilters(data);
    render(data);
  })
  .catch(err => {
    container.innerHTML = '<p>データの読み込み中にエラーが発生しました。</p>';
    console.error(err);
  });

function populateFilters(data) {
  fillSelectOrdered(companyFilter, getUniqueOrdered(data, "company"));
  fillSelectOrdered(lineFilter, getUniqueOrdered(data, "line"));
  fillSelectOrdered(stationFilter, getUniqueOrdered(data, "station"));
  fillSelectOrdered(melodyFilter, getUniqueOrdered(data, "melody"));

  [companyFilter, lineFilter, stationFilter, melodyFilter].forEach(select => {
    select.addEventListener('change', filterAndRender);
  });
}

function getUniqueOrdered(data, key) {
  const seen = new Set();
  return data
    .map(item => item[key])
    .filter(x => {
      if (seen.has(x)) return false;
      seen.add(x);
      return true;
    });
}

function fillSelectOrdered(select, items) {
  while (select.options.length > 1) select.remove(1);
  items.forEach(item => {
    const option = document.createElement('option');
    option.value = item;
    option.textContent = item;
    select.appendChild(option);
  });
}

function filterAndRender() {
  const companyVal = companyFilter.value;
  const lineVal = lineFilter.value;
  const stationVal = stationFilter.value;
  const melodyVal = melodyFilter.value;

  const filteredData = stationData.filter(entry =>
    (!companyVal || entry.company === companyVal) &&
    (!lineVal || entry.line === lineVal) &&
    (!stationVal || entry.station === stationVal) &&
    (!melodyVal || entry.melody === melodyVal)
  );

  updateFilters(filteredData, {companyVal, lineVal, stationVal, melodyVal});
  render(filteredData);
}

function updateFilters(filteredData, currentVals) {
  updateSelectOptions(companyFilter, getUniqueOrdered(filteredData, "company"), currentVals.companyVal);
  updateSelectOptions(lineFilter, getUniqueOrdered(filteredData, "line"), currentVals.lineVal);
  updateSelectOptions(stationFilter, getUniqueOrdered(filteredData, "station"), currentVals.stationVal);
  updateSelectOptions(melodyFilter, getUniqueOrdered(filteredData, "melody"), currentVals.melodyVal);
}

function updateSelectOptions(select, items, currentVal) {
  while (select.options.length > 1) select.remove(1);
  items.forEach(item => {
    const option = document.createElement('option');
    option.value = item;
    option.textContent = item;
    select.appendChild(option);
  });

  select.value = currentVal && items.includes(currentVal) ? currentVal : "";
}

function render(data) {
  container.innerHTML = '';

  if (data.length === 0) {
    container.innerHTML = '<p>該当する結果がありません。</p>';
    return;
  }

  data.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'station';

    let audioSrc = entry.audio || entry.file || '';
    if (audioSrc && !audioSrc.match(/^https?:\/\//) && !audioSrc.startsWith('audio/')) {
      audioSrc = 'audio/' + audioSrc;
    }

    const stationLink = `<a href="stations/${encodeURIComponent(entry.station)}.html" style="color:#1976d2;text-decoration:underline;font-weight:700;">${entry.station}</a>`;

    div.innerHTML = `
      <strong>${stationLink}</strong>（${entry.line}、${entry.company}）<br>
      <em>${entry.melody}</em><br>
      ${audioSrc ? `
        <div style="display:flex; flex-direction:column; gap:4px; margin-top:4px;">
          <label style="font-size:0.85em; display:flex; align-items:center; gap:4px; cursor:pointer;">
            <input type="checkbox" class="loop-checkbox">
            ループ
          </label>
          <audio controls controlsList="nodownload" src="${audioSrc}" class="station-audio"></audio>
        </div>
      ` : '<span style="color:#888;">音声ファイルなし</span>'}
    `;

    container.appendChild(div);
  });

  // Set loop on page load and update when checkbox changes
  container.querySelectorAll('.station').forEach(stationDiv => {
    const checkbox = stationDiv.querySelector('.loop-checkbox');
    const audio = stationDiv.querySelector('.station-audio');
    if (checkbox && audio) {
      audio.loop = checkbox.checked;
      checkbox.addEventListener('change', () => {
        audio.loop = checkbox.checked;
      });
    }
  });
}
