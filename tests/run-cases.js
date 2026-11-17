// Runs the fixed test cases and prints a scored table.
// Usage: node tests/run-cases.js        (exit code 1 if any case fails)
const fs = require('fs');
const path = require('path');
const S = require('../src/search.js');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/findings.json'), 'utf8'));
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'cases.json'), 'utf8'));
const index = S.buildIndex(data.findings);

let pass = 0;
let total = 0;
console.log('SEARCH CASES');
for (const c of cases.search) {
  const r = S.search(index, c.q);
  const top = r.results[0] ? r.results[0].finding.id : null;
  const okVerdict = r.verdict === c.expect_verdict;
  const okTop = c.expect_top === null || top === c.expect_top;
  const ok = okVerdict && okTop;
  total++; if (ok) pass++;
  const detail = r.results.slice(0, 3).map(x => `${x.finding.id}(${x.strength},${x.coverage.toFixed(2)})`).join(' ');
  console.log(`${ok ? 'PASS' : 'FAIL'}  "${c.q}"  verdict=${r.verdict} (want ${c.expect_verdict})  top=${top}  | ${detail}`);
}
console.log('\nDRAFT CASES');
for (const c of cases.draft) {
  const r = S.checkDraft(index, c.text);
  const got = [...new Set(r.sentences.flatMap(s => s.hits.map(h => h.finding.id)))].sort();
  const want = [...c.expect].sort();
  const ok = JSON.stringify(got) === JSON.stringify(want);
  total++; if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  "${c.text.slice(0, 60)}…"  got=[${got}] want=[${want}]`);
}
console.log(`\n${pass}/${total} cases pass`);
process.exitCode = pass === total ? 0 : 1;
