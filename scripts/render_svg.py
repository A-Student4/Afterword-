import asyncio, sys
from playwright.async_api import async_playwright
async def main(svg, png, w, h):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=2)
        await pg.goto('file://' + svg); await pg.wait_for_timeout(300)
        await pg.screenshot(path=png, clip={'x':0,'y':0,'width':w,'height':h})
        await b.close()
asyncio.run(main(sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])))
