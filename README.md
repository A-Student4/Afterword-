# Afterword: replication-aware search for psychology findings

*README prose: about 1300 words (code, commands, tables of file paths and the commit list are not counted).*

Afterword lets a student or researcher look up a psychology finding or theory by name or plain description (from ego depletion to the Oedipus complex or Jung's shadow) and see, before they cite it, what later research found. It is the developed system for Intelligent Interactive Systems Assignment 2. It continues the Assignment 1 question: does showing uncertainty at the moment of search change what readers conclude?

**Live demo:** open `index.html` in any browser, or enable GitHub Pages on this repository (Settings → Pages → Deploy from branch → `main` / root).
**Submitted version:** tag `a2-submission` *(create this tag on the commit you submit)*.

## Project status

| Part | State |
|---|---|
| Collection of 34 entries: 21 experimental findings with replication records, and 13 classic theories (Freud, Jung, Adler, Maslow, CBT and others) with the best direct tests found or marked as having none | Implemented (hand-curated, checked 17–18 Nov 2026) |
| Search by name or description: BM25 ranking, typo correction, match-strength decision | Implemented |
| Response states: record card, clarify (ambiguous), weak match, decline (not covered) | Implemented |
| Four verdicts, worded by type: replicated/supported, mixed, did not replicate/not supported, and no direct test | Implemented |
| Dated evidence timeline and "why this matched" line on each card | Implemented |
| Citation nudge: copying a non-replicated finding offers to add the replication | Implemented |
| Draft checker: flags sentences that name or cite a finding; reports what it did not check | Implemented |
| Report a problem | **Simulated**: composes a report to copy; nothing is sent |
| Sync with the FLoRA Replication Atlas (4,400+ records) | Planned |
| Dense (embedding) retrieval beside BM25 | Planned |
| LLM claim finder for paraphrased claims in drafts | Planned |
| User study comparing the interface with and without badges | Planned |

Known limits: the collection is small and English-only; outcome labels compress nuanced papers into four categories; "no direct test" means none was found in my searches, not that none exists; 6 DOIs (Strack 1988, Bargh 1996, Dijksterhuis & van Knippenberg 1998, Shoda 1990, Stroop 1935, Cristea et al. 2017) were not individually checked, and the interface marks them "DOI not yet checked". Books and chapters have no DOI and are labelled as such. Only an entry's original author is searchable by name; authors of later replications and critiques are not.

## Technology stack

- **HTML, CSS and plain JavaScript**, with no framework and no build dependencies. The whole app is one file (`index.html`) so it runs offline and can be marked without setup.
- **`src/search.js`**: the matching engine. Field-weighted BM25 over each finding's name, aliases, keywords, claim and authors; edit-distance typo correction; a coverage score (the IDF-weighted share of the query that matched) compared with a criterion (strong ≥ 0.6, weak ≥ 0.3). The same file runs in Node for testing.
- **Node.js ≥ 18** to rebuild `index.html` and run the test cases.
- **Python + Playwright** (optional) only to regenerate screenshots, storyboards and the diagram PNG.
- **AI tools:** Claude (Anthropic, Opus 5.5) helped with development; see *AI assistance*. The running system makes no model calls.
- **Undecided:** which embedding model to use for dense retrieval, which LLM provider to use for the planned claim finder, and whether to use FLoRA's export or its Zotero plugin's data route for syncing.

## Running or inspecting the work

```bash
# run the app
open index.html                 # or double-click it

# rebuild index.html after editing src/ or data/
node scripts/build.js

# run the fixed test cases (43 search and draft cases)
node tests/run-cases.js

# optional: regenerate storyboards and the diagram PNG (needs: pip install playwright)
python3 scripts/storyboard_panels.py && python3 scripts/storyboard_compose.py
python3 scripts/render_svg.py docs/system-diagram.svg docs/system-diagram.png 1200 820
```

Things to try in Search: `willpower runs out` (alias match), `oedipal complex` and `shadow work` (theories with no direct test), `freud` or `priming` (clarify), `growth mindset` (decline), `marshmellow test` (typo correction), then **Copy reference** on *Power posing* (citation nudge).

| Path | What it is |
|---|---|
| `index.html` | the built app (generated; do not edit by hand) |
| `src/app.template.html` | interface: layout, styles, rendering, interaction |
| `src/search.js` | matching engine and draft checker |
| `data/findings.json` | the collection, with `doi_checked` flags and the date checked |
| `tests/cases.json`, `tests/run-cases.js` | 43 fixed test cases and runner |
| `docs/system-diagram.svg/.png` | system diagram |
| `docs/storyboard-1..3.png`, `docs/panels/` | storyboards and their source screenshots |

## Development record

Each item says who did what. "Claude" means Claude (Anthropic), used in the Claude app; see *AI assistance*.

1. **Change of domain** (my decision, before the first commit). Assignment 1 reviewed OCR-degraded newspaper archives, where readers wrongly conclude material is absent. I dropped my first plan (Gurmukhi archives) and chose psychology, because I want to build on this project beyond the module. The interaction problem stayed the same: a reader draws a confident conclusion that the system's output does not support, because the system hides how far its answer can be trusted.
2. **Choosing the idea** (my decision). I asked Claude for project ideas in psychology or philosophy and AI, and chose replication-aware search from the options it gave.
3. **Prior art narrowed the claim.** Claude's verification searches turned up FORRT's FLoRA Replication Atlas, which already records replication outcomes for 4,400+ findings and has a Zotero plugin. So the contribution is not a database. It is the interaction: getting replication status in front of someone at the moment they search or cite, by everyday name rather than DOI, with honest behaviour when the collection has no answer.
4. **Collection and verification** (`6addf47`, Claude). Claude chose 21 findings to include failed, mixed and robust cases, so the badge is not always red, checked each outcome against the replication paper's abstract or record, and checked DOIs by web search. Where sources disagreed (the Mozart effect), it recorded "mixed" with a note. DOIs it could not check are flagged in the data and in the interface.
5. **Search engine and fixed cases** (`6addf47` → `694896e`, Claude). Claude wrote 26 test cases before tuning (Lecture 09's fixed-case loop). The first run passed 22 of 26:
   - Sentence splitting broke "et al. (1998)", so citations were never detected. Fixed.
   - Filler words ("get", "used") counted as unmatched and lowered match strength. Fixed.
   - Two expectations were wrong: "self-control in children" should find the marshmallow test. Revised with a note in `cases.json`.
   - "priming" matched six findings equally. This became a new **ambiguous** state with a clarify turn, rather than a ranked list.

   After the fixes, all 26 pass.
6. **Interface** (`bc380bb`, Claude). This added the four response states, the evidence timeline, the "why this matched" line, the citation nudge, the draft checker and the collection view. Claude's screenshot review led to fixes: matched words were shown as stems ("pos"); the mixed-evidence icon did not render; only some replication years were labelled; author lists like "Vohs, Schmeichel et al." were abbreviated wrongly.
7. **Diagram, storyboards, README** (`dd59d2e`, Claude). The first diagram was redrawn because its arrows crossed and labels collided. The storyboards are built from real screenshots of the running app.
8. **Rename** (`b17d615`; my decision). I asked for a different name than HoldsUp and chose Afterword from Claude's suggestions. Claude updated the code, interface, diagram, storyboards and report; behaviour is unchanged and all 26 cases still pass.
9. **Classic theories and a fourth verdict** (`980ddec`; my requirement, Claude's implementation). I asked for Freud, Jung, Adler, CBT and similar theories, so that searches like "oedipal complex" or "shadow work" return a record whether or not the theory was ever verified. That requirement showed the three-level verdict could not say "never tested", so Claude added a fourth verdict, **no direct test**, with theory-specific wording ("supported" rather than "replicated"). It separates a claim the collection doesn't cover (decline) from one it covers that nobody has tested. Contested records (repression; the CBT decline debate) show both sides. Claude wrote 15 test cases before running them; all 41 pass.
10. **Oedipus record corrected** (`fbacb7f`; my challenge). The record said Popper used the Oedipus complex as an example of an unfalsifiable claim. I questioned that, because I thought evidence could be found for or against it. Claude checked: Popper's critique was of psychoanalysis in general, and Grünbaum (1984) argued against him that Freud's claims are testable. Claude added Grünbaum as a counter-critique and Bereczkei et al. (2004) on sexual imprinting as indirect evidence, and marked the record contested. A new test case expected a search for "grunbaum" to find the record; it didn't, because only original authors are indexed. That is kept as a documented limit rather than widening the index just before submission. 43/43 pass.

## AI assistance

I used **Claude (Anthropic)** in the Claude app throughout.

- **What Claude did:** proposed project ideas and names; searched for and summarised the replication records; checked DOIs by web search; wrote `search.js`, the interface, the build script and the test cases; ran the tests and screenshot reviews; drew the diagram and storyboards; drafted this README and the report.
- **What I decided:** the domain, the project idea, the name, the requirement that untested theories still appear, and the report's argument from my Assignment 1 review.
- **Where I changed Claude's output:** the theories requirement (item 9) changed the verdict design; my challenge to the Oedipus record (item 10) corrected a claim Claude had written.
- **Checks I did myself (19 Nov 2026):** Ran `node tests/run-cases.js` (43/43 passed), then rebuilt with `node scripts/build.js` and reran the tests (43/43 passed). In the browser I tried eight searches beyond the example buttons, including the typo `marshmellow`, the Oedipus theory, and out-of-collection topics. The typo found the marshmallow record and the theory search found its record; an unrepresented question sometimes returned no card, while `does meditation improve memory` produced a weak, unrelated precognition match. A pasted two-sentence ego-depletion paragraph correctly flagged its named finding but left the paraphrased second sentence unchecked. I checked the title, author list and year for all six previously flagged DOIs on APA PsycNet; all matched, so I marked them checked in the data. I also spot-checked the verdicts and one-line summaries for ego depletion, power posing, birth order, CBT for depression, and the Oedipus complex against the relevant papers' abstracts. These were sample checks, not a comprehensive review of the collection.

## Additional files

There are no ZIP files. `docs/` holds the diagram and storyboards used in the report; `docs/panels/` holds the raw screenshots behind them.

## Sources for the data

Replication outcomes come from the papers cited in `data/findings.json` (each linked by DOI). The FLoRA Replication Atlas (https://forrt.org/flora-replication-atlas/) is linked as the hand-over for findings outside this collection; none of its data is copied here.
