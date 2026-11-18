// Builds the single-file app (index.html) from the template, the search engine and the data.
// Usage: node scripts/build.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const data = JSON.parse(read('data/findings.json'));
const html = read('src/app.template.html')
  .replace('/*__DATA__*/', () => 'window.AFTERWORD_DATA = ' + JSON.stringify(data).replace(/</g, '\\u003c') + ';')
  .replace('/*__SEARCH__*/', () => read('src/search.js'));
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log(`Built index.html (${(html.length / 1024).toFixed(1)} KB, ${data.findings.length} findings)`);
