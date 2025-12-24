import fs from "fs";

const data = JSON.parse(fs.readFileSync("stations.json", "utf-8"));

let html = `<html><body><ul>`;
for (const s of data) {
  html += `<li><a href="/station/${s.slug}.html">${s.name}</a></li>`;
}
html += `</ul></body></html>`;

fs.writeFileSync("stations.html", html);
