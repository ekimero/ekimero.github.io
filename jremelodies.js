const fs = require('fs');

// Load stations.json
const stations = JSON.parse(fs.readFileSync('stations.json', 'utf8'));

stations.forEach(station => {
  if (station.melody && station.melody.startsWith('JRE-IKST')) {
    // Extract text inside parentheses
    const match = station.melody.match(/\(([^)]+)\)/);
    if (match) {
      const newName = match[1];
      station.melody = newName;
      station.file = `audio/${newName}.mp3`;
    }
  }
});

// Save back to stations.json (or to a new file)
fs.writeFileSync('stations-new.json', JSON.stringify(stations, null, 2), 'utf8');

console.log('Updated melodies successfully!');
