let stationData = [];

const container = document.getElementById('station-list');
const filtersDiv = document.getElementById('filters');

fetch('stations.json')
  .then(res => res.json())
  .then(data => {
    // Filter for JR東日本 only
    stationData = data.filter(entry => entry.company === "JR東日本");
    setupFilters(stationData);
    render(stationData);
  });

function setupFilters(data) {
  filtersDiv.innerHTML = `
    <label for="line-filter">路線名：</label>
    <select id="line-filter"><option value="">すべて</option></select>
    <label for="station-filter">駅名：</label>
    <select id="station-filter"><option value="">すべて</option></select>
    <label for="melody-filter">メロディ名：</label>
    <select id="melody-filter"><option value="">すべて</option></select>
  `;
  const lineFilter = document.getElementById('line-filter');
  const stationFilter = document.getElementById('station-filter');
  const melodyFilter = document.getElementById('melody-filter');

  fillSelectOrdered(lineFilter, getUniqueOrdered(data, "line"));
  fillSelectOrdered(stationFilter, getUniqueOrdered(data, "station"));
  fillSelectOrdered(melodyFilter, getUniqueOrdered(data, "melody"));

  [lineFilter, stationFilter, melodyFilter].forEach(select => {
    select.addEventListener('change', () => {
      filterAndRender(data, lineFilter.value, stationFilter.value, melodyFilter.value);
    });
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

function filterAndRender(data, lineVal, stationVal, melodyVal) {
  const filtered = data.filter(entry =>
    (!lineVal || entry.line === lineVal) &&
    (!stationVal || entry.station === stationVal) &&
    (!melodyVal || entry.melody === melodyVal)
  );
  render(filtered);
}

function render(data) {
  container.innerHTML = '';
  if (data.length === 0) {
    container.innerHTML = '<p>該当する結果がありません。</p>';
    return;
  }
  // Group by line
  const lines = {};
  data.forEach(entry => {
    if (!lines[entry.line]) lines[entry.line] = [];
    lines[entry.line].push(entry);
  });
  Object.keys(lines).forEach(line => {
    const section = document.createElement('section');
    section.className = 'line-section';
    section.innerHTML = `<h2>${line}</h2>`;
    lines[line].forEach(entry => {
      const div = document.createElement('div');
      div.className = 'station';
      div.innerHTML = `
        <strong>${entry.station}</strong><br>
        <em>${entry.melody}</em><br>
        <audio controls controlsList="nodownload" src="${entry.file}"></audio>
      `;
      section.appendChild(div);
    });
    container.appendChild(section);
  });
}