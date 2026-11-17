import asyncio
from playwright.async_api import async_playwright
import os; APP='file://'+os.path.abspath('index.html'); D='docs/panels/'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 720, 'height': 1000}, device_scale_factor=2)
        await pg.goto(APP); await pg.wait_for_timeout(500)
        async def search(q):
            await pg.fill('#q', q); await pg.press('#q','Enter'); await pg.wait_for_timeout(250)
        # SB1
        await pg.fill('#q', 'willpower runs out'); await pg.evaluate("document.getElementById('results').innerHTML=''")
        await pg.locator('header').evaluate("e=>e")
        await pg.screenshot(path=D+'1a.png', clip={'x':0,'y':0,'width':720,'height':440})
        await search('willpower runs out')
        await pg.locator('#results').screenshot(path=D+'1b.png')
        await pg.click('article[data-id=ego-depletion] details.ev summary'); await pg.wait_for_timeout(150)
        await pg.locator('article[data-id=ego-depletion]').screenshot(path=D+'1c.png')
        await pg.click('article[data-id=ego-depletion] details.ev summary')
        await pg.click('article[data-id=ego-depletion] button[data-act=copy]'); await pg.wait_for_timeout(150)
        await pg.locator('article[data-id=ego-depletion]').screenshot(path=D+'1d.png')
        # SB2
        await search('growth mindset'); await pg.locator('#results').screenshot(path=D+'2a.png')
        await search('priming'); await pg.locator('#results').screenshot(path=D+'2b.png')
        await pg.click('button[data-open=professor-priming]'); await pg.wait_for_timeout(150)
        await pg.locator('#results').screenshot(path=D+'2c.png')
        # SB3
        await pg.click('#tab-draft'); await pg.wait_for_timeout(100)
        await pg.locator('#view-draft').screenshot(path=D+'3a.png')
        await pg.click('#check'); await pg.wait_for_timeout(200)
        await pg.locator('#draft-out').screenshot(path=D+'3b.png')
        await pg.click('#draft-out button[data-open=power-posing]'); await pg.wait_for_timeout(150)
        await pg.click('article[data-id=power-posing] button[data-act=copy]'); await pg.wait_for_timeout(150)
        await pg.locator('#results').screenshot(path=D+'3c.png')
        await b.close()
asyncio.run(main())
