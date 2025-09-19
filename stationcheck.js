const fs = require('fs');

// Read the original stations.json file
const stationsData = JSON.parse(fs.readFileSync('stations.json', 'utf8'));

// Create a map to count occurrences of each line-station pair
const lineStationCount = {};

// First pass: count how many melodies exist for each line-station pair
stationsData.forEach(entry => {
  const key = `${entry.line}|${entry.station}`;
  lineStationCount[key] = (lineStationCount[key] || 0) + 1;
});

// Second pass: duplicate entries that have only one melody
const newStationsData = [];
stationsData.forEach(entry => {
  const key = `${entry.line}|${entry.station}`;
  newStationsData.push(entry);
  
  // If there's only one melody for this line-station pair, duplicate it
  if (lineStationCount[key] === 1) {
    newStationsData.push({...entry}); // Create a shallow copy
  }
});

// Write the new datsa to station.json
fs.writeFileSync('station.json', JSON.stringify(newStationsData, null, 2), 'utf8');

console.log('Created station.json with duplicated single-melody entries');