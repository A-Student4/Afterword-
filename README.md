# Afterword: replication-aware search for psychology findings

*README prose: about 920 words (code, commands, tables of file paths and the commit list are not counted).*

Afterword lets a student or researcher look up a psychology finding by name or plain description and see, before they cite it, whether later and larger studies found the same thing. It is the developed system for Intelligent Interactive Systems Assignment 2. It continues the Assignment 1 question: does showing uncertainty at the moment of search change what readers conclude?

**Live demo:** open `index.html` in any browser, or enable GitHub Pages on this repository (Settings → Pages → Deploy from branch → `main` / root).
**Submitted version:** tag `a2-submission` *(create this tag on the commit you submit)*.

## Project status

| Part | State |
|---|---|
| Collection of 21 findings, each with original paper, replication record, outcome, one-line summary and DOI | Implemented (hand-curated, checked 17 Nov 2026) |
| Search by name or description: BM25 ranking, typo correction, match-strength decision | Implemented |
| Response states: record card, clarify (ambiguous), weak match, decline (not covered) | Implemented |
| Dated evidence timeline and "why this matched" line on each card | Implemented |
| Citation nudge: copying a non-replicated finding offers to add the replication | Implemented |
| Draft checker: flags sentences that name or cite a finding; reports what it did not check | Implemented |
| Report a problem | **Simulated**: composes a report to copy; nothing is sent |
| Sync with the FLoRA Replication Atlas (4,400+ records) | Planned |
| Dense (embedding) retrieval beside BM25 | Planned |
| LLM claim finder for paraphrased claims in drafts | Planned |
| User study comparing the interface with and without badges | Planned |

Known limits: the collection is small and English-only; outcome labels compress nuanced papers into three categories; 5 of 35 DOIs (Strack 1988, Bargh 1996, Dijksterhuis & van Knippenberg 1998, Shoda 1990, Stroop 1935) were not individually checked, and the interface marks them "DOI not yet checked".

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

# run the fixed test cases (26 search and draft cases)
node tests/run-cases.js

# optional: regenerate storyboards and the diagram PNG (needs: pip install playwright)
python3 scripts/storyboard_panels.py && python3 scripts/storyboard_compose.py
python3 scripts/render_svg.py docs/system-diagram.svg docs/system-diagram.png 1200 820
```

Things to try in Search: `willpower runs out` (alias match), `growth mindset` (decline), `priming` (clarify), `marshmellow test` (typo correction), then **Copy reference** on *Power posing* (citation nudge).

| Path | What it is |
|---|---|
| `index.html` | the built app (generated; do not edit by hand) |
| `src/app.template.html` | interface: layout, styles, rendering, interaction |
| `src/search.js` | matching engine and draft checker |
| `data/findings.json` | the collection, with `doi_checked` flags and the date checked |
| `tests/cases.json`, `tests/run-cases.js` | fixed test cases and runner |
| `docs/system-diagram.svg/.png` | system diagram |
| `docs/storyboard-1..3.png`, `docs/panels/` | storyboards and their source screenshots |

## Development record

1. **Change of domain** (before the first commit). Assignment 1 reviewed OCR-degraded newspaper archives, where readers wrongly conclude material is absent. I moved to psychology research tools because I want to build on this beyond the module. The interaction problem stayed the same: a reader draws a confident conclusion that the system's output does not support, because the system hides how far its answer can be trusted.
2. **Prior art narrowed the claim.** While verifying data I found FORRT's FLoRA Replication Atlas, which already records replication outcomes for 4,400+ findings and has a Zotero plugin. So the contribution is not a database. It is the interaction: getting replication status in front of someone at the moment they search or cite, by phenomenon name rather than DOI, with honest behaviour when the collection has no answer.
3. **Collection and verification** (`6addf47`). 21 findings were chosen to include failed, mixed and robust cases, so the badge is not always red. Each outcome was checked against the replication paper's own abstract or record. DOIs were checked by search, and the 5 I could not check are flagged in the data and in the interface.
4. **Search engine and fixed cases** (`6addf47` → `694896e`). I wrote 26 test cases before tuning (Lecture 09's fixed-case loop). The first run passed 22 of 26:
   - Sentence splitting broke "et al. (1998)", so citations were never detected. Fixed.
   - Filler words ("get", "used") counted as unmatched and lowered match strength. Fixed.
   - Two expectations were wrong: "self-control in children" should find the marshmallow test. Revised with a note in `cases.json`.
   - "priming" matched six findings equally. This became a new **ambiguous** state with a clarify turn, rather than a ranked list.

   After the fixes, all 26 pass.
5. **Interface** (`bc380bb`). This added the four response states, the evidence timeline, the "why this matched" line, the citation nudge, the draft checker and the collection view. Reviewing screenshots led to further fixes: matched words were shown as stems ("pos"); the mixed-evidence icon did not render; only some replication years were labelled; and author lists like "Vohs, Schmeichel et al." were abbreviated wrongly.
6. **Diagram, storyboards, README.** I redrew the first diagram because its arrows crossed and the labels collided. The storyboards are built from real screenshots of the running app.
7. **Renamed HoldsUp to Afterword** (18 Nov). The new name frames replications as the later part of a finding's story rather than as a takedown, which fits the system's calm, non-alarmist wording. I updated the code identifiers, interface text, diagram, storyboards and report; behaviour is unchanged and all 26 cases still pass.

## AI assistance

I used **Claude (Anthropic)** in the Claude app throughout. A few examples:
- **Choosing and scoping the idea:** I asked for project ideas at the psychology/philosophy and AI intersection and chose replication-aware search from four options. The decision and the A1 link are mine.
- **Data:** Claude searched the web for each finding's replication record and drafted the paraphrased summaries. I checked each outcome against the cited paper's abstract, kept the 5 unverified DOIs visibly flagged, and changed the Mozart effect from "did not replicate" to "mixed" when sources disagreed.
- **Code:** Claude drafted `search.js`, the interface and the build script. I ran the fixed test cases and screenshot reviews; the failures and fixes are listed in the development record.
- **Documents:** Claude drafted this README, the diagram and storyboard captions, and a first report draft, which I then reviewed and reworded.

*Before submitting, replace or confirm these lines so they describe exactly what you checked or changed yourself.*

## Additional files

There are no ZIP files. `docs/` holds the diagram and storyboards used in the report; `docs/panels/` holds the raw screenshots behind them.

## Sources for the data

Replication outcomes come from the papers cited in `data/findings.json` (each linked by DOI). The FLoRA Replication Atlas (https://forrt.org/flora-replication-atlas/) is linked as the hand-over for findings outside this collection; none of its data is copied here.
