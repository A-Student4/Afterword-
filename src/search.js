/*
 * Afterword search engine.
 * Ranks findings with a field-weighted BM25, then decides how much to trust
 * each match. The decision rule (CRITERION) is the system's signal-detection
 * criterion: lowering it trades misses for false alarms.
 * Works in the browser (window.AfterwordSearch) and in Node (module.exports).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AfterwordSearch = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Coverage = share of the query's information (IDF-weighted) that matched.
  const CRITERION = { strong: 0.6, weak: 0.3 };
  const FIELD_WEIGHTS = { name: 3, aliases: 2.5, keywords: 1.5, claim: 1, authors: 1 };
  const K1 = 1.2;
  const B = 0.75;

  const STOPWORDS = new Set(('a an and are as at be been but by can do does did for from has have ' +
    'how i if in into is it its make makes me more most my no not of on or our people person ' +
    'than that the their them then there these they this those to was we were what when where ' +
    'which who why will with you your about after again also any because before being between both ' +
    'could during each few further here just less many much other over own same should so some ' +
    'such through too under until up very would study studies effect effects finding findings ' +
    'research psychology show shows showed shown get gets got use used really actually true ' +
    'real work works does').split(' '));

  function stem(t) {
    if (t.length > 5 && t.endsWith('ing')) return t.slice(0, -3);
    if (t.length > 4 && t.endsWith('ed')) return t.slice(0, -2);
    if (t.length > 4 && t.endsWith('es') && !t.endsWith('ses')) return t.slice(0, -2);
    if (t.length > 3 && t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1);
    return t;
  }

  function normalise(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/judgement/g, 'judgment')
      .replace(/colour/g, 'color')
      .replace(/behaviour/g, 'behavior')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function tokenize(text) {
    return normalise(text).split(' ').filter(t => t && !STOPWORDS.has(t)).map(stem);
  }

  function editDistance(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      let rowMin = i;
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        rowMin = Math.min(rowMin, cur[j]);
      }
      if (rowMin > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }

  function fieldsOf(f) {
    return {
      name: f.name,
      aliases: (f.aliases || []).join(' | '),
      keywords: (f.keywords || []).join(' '),
      claim: f.claim,
      authors: f.original ? f.original.authors : ''
    };
  }

  function buildIndex(findings) {
    const docs = findings.map(f => {
      const fields = fieldsOf(f);
      const tf = new Map();
      let length = 0;
      for (const [field, text] of Object.entries(fields)) {
        const w = FIELD_WEIGHTS[field];
        for (const tok of tokenize(text)) {
          tf.set(tok, (tf.get(tok) || 0) + w);
          length += w;
        }
      }
      const phraseText = [f.name, ...(f.aliases || [])];
      const phrases = phraseText.map(p => tokenize(p).join(' ')).filter(Boolean);
      const phraseOf = Object.fromEntries(phraseText.map(p => [tokenize(p).join(' '), p]));
      return { finding: f, tf, length, phrases, phraseOf };
    });
    const df = new Map();
    for (const d of docs) for (const tok of d.tf.keys()) df.set(tok, (df.get(tok) || 0) + 1);
    const N = docs.length;
    const idf = tok => Math.log(1 + (N - (df.get(tok) || 0) + 0.5) / ((df.get(tok) || 0) + 0.5));
    const avgLen = docs.reduce((s, d) => s + d.length, 0) / N;
    return { docs, df, idf, avgLen, N, vocab: [...df.keys()] };
  }

  // Map each query token to index tokens: exact, or a close spelling (typo tolerance).
  function resolveTokens(index, qTokens) {
    return qTokens.map(tok => {
      if (index.df.has(tok)) return { query: tok, match: tok, fuzzy: false };
      if (tok.length < 5) return { query: tok, match: null, fuzzy: false };
      const max = tok.length >= 8 ? 2 : 1;
      let best = null;
      let bestD = max + 1;
      for (const v of index.vocab) {
        const d = editDistance(tok, v, max);
        if (d < bestD) { bestD = d; best = v; }
      }
      return best ? { query: tok, match: best, fuzzy: true } : { query: tok, match: null, fuzzy: false };
    });
  }

  function search(index, query, opts = {}) {
    const criterion = Object.assign({}, CRITERION, opts.criterion || {});
    const qTokens = [...new Set(tokenize(query))];
    const shown = {};
    for (const w of normalise(query).split(' ')) if (w && !STOPWORDS.has(w)) shown[stem(w)] = shown[stem(w)] || w;
    if (qTokens.length === 0) return { query, tokens: [], results: [], verdict: 'empty', criterion, corrections: [] };

    const resolved = resolveTokens(index, qTokens);
    const maxIdf = Math.log(1 + (index.N + 0.5) / 0.5);
    const qWeight = r => (r.match ? index.idf(r.match) : maxIdf);
    const totalWeight = resolved.reduce((s, r) => s + qWeight(r), 0);
    const qPhrase = qTokens.join(' ');

    const results = [];
    for (const d of index.docs) {
      let score = 0;
      let covered = 0;
      const matched = [];
      for (const r of resolved) {
        if (!r.match) continue;
        const tf = d.tf.get(r.match) || 0;
        if (!tf) continue;
        const idf = index.idf(r.match);
        const norm = tf * (K1 + 1) / (tf + K1 * (1 - B + B * d.length / index.avgLen));
        score += idf * norm * (r.fuzzy ? 0.8 : 1);
        covered += qWeight(r) * (r.fuzzy ? 0.9 : 1);
        matched.push(shown[r.query] || r.query);
      }
      if (!matched.length) continue;
      const phraseHit = qTokens.length > 0 && d.phrases.some(p => p === qPhrase || (qTokens.length > 1 && p.includes(qPhrase)) || (qPhrase.includes(p) && p.split(' ').length > 1));
      if (phraseHit) score += 3;
      const coverage = Math.min(1, covered / totalWeight);
      const strength = (phraseHit || coverage >= criterion.strong) ? 'strong' : coverage >= criterion.weak ? 'weak' : 'below';
      results.push({ finding: d.finding, score, coverage, strength, matched, phraseHit });
    }
    const rank = { strong: 0, weak: 1, below: 2 };
    results.sort((a, b) => rank[a.strength] - rank[b.strength] || b.score - a.score);
    const kept = results.filter(r => r.strength !== 'below');
    const strong = kept.filter(r => r.strength === 'strong');
    let verdict = strong.length ? 'strong' : kept.length ? 'weak' : 'none';
    // Ambiguous: several findings match equally well (e.g. "priming"). The interface
    // should ask which one, not pretend the first is the answer (L07 clarify turn).
    if (strong.length >= 3 && strong[0].score < 1.3 * strong[2].score) verdict = 'ambiguous';
    const corrections = resolved.filter(r => r.fuzzy).map(r => ({ from: r.query, to: r.match }));
    const unknown = resolved.filter(r => !r.match).map(r => r.query);
    return { query, tokens: qTokens, results: kept, below: results.filter(r => r.strength === 'below'), verdict, criterion, corrections, unknown };
  }

  // Draft checking: find sentences that name a finding (name or alias phrase)
  // or cite its original paper (first author + year).
  function splitSentences(text) {
    // Protect abbreviations common in academic prose so "et al. (1998)" stays in one sentence.
    const protectedText = String(text || '')
      .replace(/\s+/g, ' ')
      .replace(/\b(et al|e\.g|i\.e|cf|vs|approx|Fig|No)\./g, (m, a) => a + '\u2024');
    return protectedText
      .split(/(?<=[.!?])\s+(?=[A-Z("'])/)
      .map(s => s.replace(/\u2024/g, '.').trim())
      .filter(Boolean);
  }

  function firstAuthor(f) {
    return normalise(String(f.original.authors).split(/[,&]/)[0]).split(' ').pop();
  }

  function checkDraft(index, text) {
    const sentences = splitSentences(text);
    const out = sentences.map(sentence => {
      const sTok = tokenize(sentence).join(' ');
      const sNorm = ' ' + normalise(sentence) + ' ';
      const hits = [];
      for (const d of index.docs) {
        const f = d.finding;
        const phrase = d.phrases.filter(p => p.split(' ').length >= 1 && (' ' + sTok + ' ').includes(' ' + p + ' '))
          .sort((a, b) => b.length - a.length)[0];
        const author = firstAuthor(f);
        const cites = author && sNorm.includes(' ' + author + ' ') && sNorm.includes(' ' + f.original.year + ' ');
        if (phrase || cites) {
          hits.push({ finding: f, how: cites ? 'cites' : 'names', evidence: cites ? `${f.original.authors.split(/[,&]/)[0].trim()} (${f.original.year})` : d.phraseOf[phrase] });
        }
      }
      return { sentence, hits };
    });
    return {
      sentences: out,
      flagged: out.filter(s => s.hits.length).length,
      unmatched: out.filter(s => !s.hits.length).length
    };
  }

  return { buildIndex, search, checkDraft, tokenize, CRITERION, splitSentences };
});
