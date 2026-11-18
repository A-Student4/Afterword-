import asyncio, base64, html
from playwright.async_api import async_playwright
P='docs/panels/'
def img(n): return 'data:image/png;base64,'+base64.b64encode(open(P+n,'rb').read()).decode()
SB = [
 ("storyboard-1", "Storyboard 1 · Checking a finding before citing it",
  "Sam, a psychology undergraduate (fictional), is writing an essay on self-control and remembers that “willpower runs out”.",
  [("1a.png","Sam types the idea in their own words, not the technical term.","Search box accepts plain descriptions; example chips show what works."),
   ("1b.png","Sam reads the result.","Matched via an alias to Ego depletion. Badge: Did not replicate. Timeline dates the evidence; the match line says why it matched."),
   ("1c.png","Sam opens the evidence.","The original and both multi-lab replications, each with a one-line summary and a DOI link."),
   ("1d.png","Sam clicks Copy reference.","Because the finding did not replicate, the system asks once, inline, whether to copy the replication too. Cancel is as easy as confirm.")]),
 ("storyboard-2", "Storyboard 2 · When the collection cannot answer",
  "Sam searches for two things the collection does not settle.",
  [("2a.png","Sam searches “growth mindset”.","Decline: nothing matches. The system states its scope (21 findings, date checked), says a missing result is not evidence either way, and hands over to the FLoRA Replication Atlas."),
   ("2b.png","Sam searches “priming”.","Clarify: six findings match about equally, so the system asks which one rather than ranking one as the answer."),
   ("2c.png","Sam picks Professor priming.","The record opens with its verdict and the 40-lab replication date.")]),
 ("storyboard-3", "Storyboard 3 · Checking a draft paragraph",
  "Sam pastes a paragraph from the essay before submitting it.",
  [("3a.png","Sam pastes the paragraph and clicks Check draft.","Plain text in, nothing stored."),
   ("3b.png","Sam reads the check.","Two sentences are flagged: one cites Baumeister et al. (1998), one names power posing. The other two are labelled “not recognised”, with a note that this is not a sign they are well supported."),
   ("3c.png","Sam opens the power posing record and copies the reference.","Mixed evidence: hormones and risk-taking did not replicate; feelings of power did. The copy nudge offers to add Ranehill et al. (2015).")]),
]
CSS='''body{margin:0;font:15px/1.45 Inter,Helvetica,Arial,sans-serif;color:#16181b;background:#fff}
.w{padding:28px 30px 34px}h1{font-size:24px;margin:0}.sc{color:#454b52;margin:6px 0 20px}
.row{display:grid;gap:22px;align-items:start}
.p{border:1px solid #d9dcd8;border-radius:10px;padding:12px;background:#fafaf9}
.n{display:inline-block;background:#16181b;color:#fff;border-radius:50%;width:24px;height:24px;text-align:center;line-height:24px;font-weight:700;font-size:13px;margin-right:6px}
.p img{width:100%;border:1px solid #e3e5e2;border-radius:6px;background:#fff;display:block;margin:8px 0 10px}
.d{font-weight:600}.s{color:#454b52;margin-top:4px;font-size:14px}
.k{font-size:12px;color:#6b7178;margin-top:18px}'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--no-sandbox'])
        for name,title,scene,panels in SB:
            cols=len(panels); width=430*cols+60
            body=''.join(f'<div class="p"><div class="d"><span class="n">{i+1}</span>{html.escape(a)}</div><img src="{img(f)}"><div class="s"><b>System:</b> {html.escape(s)}</div></div>' for i,(f,a,s) in enumerate(panels))
            doc=f'<html><head><style>{CSS} .row{{grid-template-columns:repeat({cols},1fr)}}</style></head><body><div class="w"><h1>{html.escape(title)}</h1><p class="sc">{html.escape(scene)}</p><div class="row">{body}</div><p class="k">Screenshots of the working prototype (index.html), captured 18 Nov 2026. The user is fictional.</p></div></body></html>'
            pg = await b.new_page(viewport={'width': width, 'height': 200}, device_scale_factor=2)
            await pg.set_content(doc); await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'docs/{name}.png', full_page=True)
            await pg.close()
        await b.close()
asyncio.run(main())
