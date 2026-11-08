"""Production UI checks. Requires Python Playwright and an already running preview.

Example: npm run preview -- --host 127.0.0.1 --port 4200
         python tools/test_world_browser.py
Screenshots stay outside the repository; no browser dependency is added to the app.
"""
import argparse
import json
from pathlib import Path
import tempfile
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
WIDTHS = [320, 360, 375, 390, 414, 430, 600, 768, 820, 900, 1024, 1280, 1366, 1440, 1536, 1600, 1920, 2560, 3840]
NAV_LINKS = [('home','#inicio'),('story','#historia'),('characters','#personajes'),('world','#galeria'),('niveles','#mundo-lugares'),('mechanics','#mecanicas'),('rewards','#recompensas'),('controls','#controles'),('downloads','#descargables'),('team','#equipo')]
REWARD_KEYS = ['sword','morality','potion']
OVERFLOW = '''() => ({page:document.documentElement.scrollWidth>innerWidth+1, internal:[...document.querySelectorAll('body *')].filter(e=>e.clientWidth>0&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&e.scrollWidth>e.clientWidth+2&&!['auto','scroll','hidden'].includes(getComputedStyle(e).overflowX)).map(e=>e.tagName+'.'+e.className)})'''

def switch(page, code):
    if page.locator('html').get_attribute('lang') == code:
        return
    modal = page.locator('dialog[open]')
    if modal.count():
        modal.locator(f'.selector-idioma button[lang={code}]').click()
    else:
        toggle = page.locator('#botonMenu')
        if toggle.is_visible() and toggle.get_attribute('aria-expanded') == 'false':
            toggle.click()
        page.locator(f'#navPrincipal button[lang={code}]').click()
    assert page.locator('html').get_attribute('lang') == code

def decoded(locator):
    try:
        locator.evaluate('i=>i.decode()')
    except Exception as exc:
        state=locator.evaluate('i=>({src:i.currentSrc,complete:i.complete,naturalWidth:i.naturalWidth})')
        raise AssertionError(f'Image failed to decode: {state}') from exc
    assert locator.evaluate('i=>i.naturalWidth>0')

def geometry(page):
    result = page.evaluate(OVERFLOW)
    assert not result['page'] and not result['internal'], result

def scan_reflow(page):
    widths=sorted(set(range(320,1921,23)) | {600,601,671,672,680,681,700,701,900,901,991,992,1100,1101,1240,1241,1327,1328,1440,1441,1760,1920})
    for code in ['es','en']:
        switch(page,code)
        for width in widths:
            page.set_viewport_size({'width':width,'height':900})
            geometry(page)
            check_map_layout(page,width)
            if width >= 1241:
                rows=page.locator('.nav-principal ul').evaluate('e=>new Set([...e.children].map(li=>Math.round(li.getBoundingClientRect().y))).size')
                assert rows==1,(code,width,rows)
            reading = page.locator('.atlas-map__reading').bounding_box()
            atlas = page.locator('.atlas-map').bounding_box()
            assert reading and atlas and reading['y'] + reading['height'] <= atlas['y'] + atlas['height'] + 2, (width, reading, atlas)
            columns=page.locator('.levels-grid').evaluate('e=>getComputedStyle(e).gridTemplateColumns.split(" ").filter(Boolean).length')
            assert columns==expected_columns(width),(width,columns)
    print(f'Continuous reflow: {len(widths)} intermediate widths per language, 320..1920px, levels columns OK',flush=True)
    return len(widths)

def expected_columns(width):
    return 4 if width>=1328 else (3 if width>=992 else (2 if width>=701 else 1))

def check_map_layout(page, width):
    """Map on the left with the chronicle on the right; stacked title→map→chronicle when narrow."""
    columns = page.locator('.atlas-map').evaluate('e=>getComputedStyle(e).gridTemplateColumns.split(" ").filter(Boolean).length')
    title = page.locator('.atlas-map__title').bounding_box()
    art = page.locator('.atlas-map__art').bounding_box()
    reading = page.locator('.atlas-map__reading').bounding_box()
    assert title and art and reading
    if width >= 901:
        assert columns == 2, (width, columns)
        assert title['x'] >= art['x'] + art['width'] * 0.45, (width, title, art)
        assert reading['x'] >= art['x'] + art['width'] * 0.45, (width, reading, art)
        assert title['y'] < reading['y'], (width, title, reading)
    else:
        assert columns == 1, (width, columns)
        assert title['y'] + title['height'] <= art['y'] + 2, (width, title, art)
        assert art['y'] + art['height'] <= reading['y'] + 2, (width, art, reading)
        assert abs(title['x'] - reading['x']) <= 2, (width, title, reading)

def close(page, opener):
    page.keyboard.press('Escape')
    assert page.locator('dialog[open]').count() == 0
    assert opener.evaluate('e=>e===document.activeElement')
    assert page.evaluate("document.body.style.overflowY !== 'hidden'")

def run(base, out):
    copies = {code: json.loads((ROOT / f'src/i18n/{code}.json').read_text(encoding='utf8')) for code in ['es', 'en']}
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width':1440,'height':900}, device_scale_factor=1)
        page = context.new_page()
        errors, bad, warnings = [], [], []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('response', lambda r: bad.append(f'{r.status}: {r.url}') if r.status>=400 and r.url.startswith(base) else None)
        page.on('console', lambda m: warnings.append(m.text) if m.type in ['warning','error'] else None)
        page.goto(base, wait_until='networkidle')
        page.evaluate('document.fonts.ready')
        page.add_style_tag(content='html {scroll-behavior:auto !important}')
        assert page.locator('html').get_attribute('lang') == 'es'
        assert page.locator('main > section').evaluate_all('sections=>sections.map(section=>section.id)') == ['inicio','historia','personajes','galeria','mecanicas','recompensas','controles','descargables']
        assert page.locator('#galeria').count() == 1
        # The four-region presentation is retired: no section, cards, legend or dead links.
        assert page.locator('#mundo-regiones').count() == 0
        assert page.locator('.atlas-regions').count() == 0
        assert page.locator('.atlas-region').count() == 0
        assert page.locator('.atlas-map__legend').count() == 0
        assert page.locator('a[href="#mundo-regiones"]').count() == 0
        assert page.locator('.level-card__region').count() == 0
        assert page.locator('.atlas-stage').count() == 0
        assert page.locator('.level-card').count() == 8
        # Retired copy is gone: chronicle label, caption and technical illustration note.
        assert page.locator('.atlas-map__tagline, .atlas-map__caption, .atlas-map__note, .world-viewer__note').count() == 0
        assert page.locator('#navPrincipal a').count() == 10
        assert page.locator('#recompensas .recompensa').count() == 3
        assert page.locator('.mecanica').count() == 5
        assert page.locator('.tarjeta-personaje').count() == 5

        for code in ['es','en']:
            switch(page, code)
            nav=page.locator('#navPrincipal a')
            assert nav.evaluate_all('links=>links.map(link=>link.getAttribute("href"))')==[href for _,href in NAV_LINKS]
            assert nav.all_inner_texts()==[copies[code]['nav'][key] for key,_ in NAV_LINKS]
            rewards=page.locator('#recompensas .recompensa')
            assert rewards.locator('.recompensa__nombre').all_inner_texts()==[copies[code]['rewards'][key]['name'] for key in REWARD_KEYS]
            for image in rewards.locator('img').all():
                image.scroll_into_view_if_needed(); decoded(image)
            for width in WIDTHS:
                page.set_viewport_size({'width':width,'height':900})
                if page.locator('#botonMenu').is_visible() and page.locator('#botonMenu').get_attribute('aria-expanded')=='true':
                    page.keyboard.press('Escape')
                assert page.evaluate('innerWidth===visualViewport.width && visualViewport.scale===1 && devicePixelRatio===1')
                if width in [390,1440]:
                    for selector,label in [('#inicio','hero'),('#historia','story'),('#personajes','characters'),('#recompensas','rewards')]:
                        for image in page.locator(selector+' img:visible').all():
                            if label != 'hero':
                                image.scroll_into_view_if_needed()
                            decoded(image)
                        if label == 'hero':
                            page.locator(selector).evaluate('e=>{e.scrollLeft=0;e.scrollTop=0}')
                        page.locator(selector).screenshot(path=str(out/f'{code}-{width}-{label}.png'),style='.cabecera,.cabecera * {visibility:hidden !important}')
                for selector, label in [('.atlas-map','map'),('.atlas-levels','levels')]:
                    for image in page.locator(selector+' img:visible').all():
                        image.scroll_into_view_if_needed(); decoded(image)
                    page.locator(selector).screenshot(path=str(out/f'{code}-{width}-{label}.png'),style='.cabecera,.cabecera * {visibility:hidden !important}',animations='disabled')
                geometry(page)
                check_map_layout(page, width)
                image = page.locator('.atlas-map__open img')
                assert image.evaluate('i=>i.getBoundingClientRect().width<=i.naturalWidth+1')
                assert image.evaluate('i=>Math.abs(i.width/i.height-i.naturalWidth/i.naturalHeight)<.01')
                if width <= 1240:
                    toggle=page.locator('#botonMenu')
                    toggle.focus(); page.keyboard.press('Enter')
                    assert toggle.get_attribute('aria-expanded')=='true'
                    page.locator(f'#navPrincipal button[lang={code}]').scroll_into_view_if_needed()
                    page.keyboard.press('Escape')
                    assert toggle.evaluate('e=>e===document.activeElement')

                opener=page.locator('.atlas-map__open')
                opener.click()
                modal=page.locator('.world-viewer[open]')
                assert modal.count()==1
                photo=modal.locator('.world-viewer__canvas img'); decoded(photo)
                assert photo.evaluate('i=>i.getBoundingClientRect().width<=i.naturalWidth+1')
                for _ in range(3): modal.get_by_role('button', name=copies[code]['world']['viewer']['zoomIn'], exact=True).click()
                geometry(page)
                stage=modal.locator('.world-viewer__stage')
                assert stage.evaluate('e=>e.scrollWidth>e.clientWidth || e.scrollHeight>e.clientHeight')
                stage.focus()
                axis=stage.evaluate('e=>e.scrollWidth>e.clientWidth ? "x" : "y"')
                page.keyboard.press('ArrowRight' if axis=='x' else 'ArrowDown'); page.wait_for_timeout(120)
                assert stage.evaluate('(e,axis)=>axis==="x"?e.scrollLeft>0:e.scrollTop>0',axis)
                if width==1440:
                    stage.scroll_into_view_if_needed(); stage.evaluate('e=>e.scrollTo(0,0)')
                    box=stage.bounding_box(); x=box['x']+box['width']*.65; y=box['y']+min(120,box['height']/2)
                    page.mouse.move(x,y);page.mouse.down();page.mouse.move(x-80,y-30,steps=5);page.mouse.up()
                    assert stage.evaluate('e=>e.scrollLeft>0 || e.scrollTop>0')
                value=modal.locator('output').inner_text()
                handle=modal.element_handle()
                switch(page,'en' if code=='es' else 'es')
                assert handle.evaluate('e=>e.isConnected && e.open')
                assert modal.locator('output').inner_text()==value
                switch(page,code)
                modal.get_by_role('button',name=copies[code]['world']['viewer']['fit'],exact=True).click()
                geometry(page)
                if width in [320,768,1440]: modal.screenshot(path=str(out/f'{code}-{width}-map-viewer.png'))
                close(page,opener)

                level_keys = ['apprenticeCamp','borderCrossing','crossroadsPass','sunColonyActTwo','whispersPath','tideColony','brokenPass','greatAlphaDen']
                expected_titles = [copies[code]['world']['levels'][key]['title'] for key in level_keys]
                expected_descriptions = [copies[code]['world']['levels'][key]['description'] for key in level_keys]
                cards = page.locator('.level-card')
                assert cards.count() == 8
                titles = [cards.nth(i).locator('h4').inner_text() for i in range(8)]
                assert titles == expected_titles, (code, width, titles)
                descriptions = [cards.nth(i).locator('.level-card__body > p:not(.level-card__meta)').inner_text() for i in range(8)]
                assert descriptions == expected_descriptions, (code, width, descriptions)
                boxes = [cards.nth(i).bounding_box() for i in range(8)]
                columns = len({round(box['x']) for box in boxes})
                assert columns == expected_columns(width), (code, width, columns)
                rows = {}
                for box in boxes: rows.setdefault(round(box['y']), []).append(box)
                assert len(rows) == {4:2, 3:3, 2:4, 1:8}[expected_columns(width)], (code, width, len(rows))
                for row in rows.values():
                    # Fractional grid tracks can shift each card by ~1/64 px: allow 1 px of slack.
                    heights = [box['height'] for box in row]
                    widths = [box['width'] for box in row]
                    assert max(heights)-min(heights) <= 1, (code, width, row)
                    assert max(widths)-min(widths) <= 1, (code, width, row)
                for i in range(8):
                    image = cards.nth(i).locator('.level-card__media img')
                    # Cover crops proportionally: the box stays 4/3 and the artwork is never stretched.
                    assert image.evaluate('i=>getComputedStyle(i).objectFit') == ('contain' if width<=700 else 'cover')
                    assert image.evaluate('i=>Math.abs(i.width/i.height-4/3)<.02'), (code, width, i, image.evaluate('i=>({w:i.width,h:i.height})'))
                    src = image.evaluate('i=>i.currentSrc')
                    assert '-240' not in src and src.endswith('.webp'), src
                    # At DPR 1 every card box is narrower than the 768 px preview it loads.
                    assert image.evaluate('i=>i.clientWidth<=768'), (code, width, i, image.evaluate('i=>i.clientWidth'))

                # The panoramic stage is retired: directly 8 level cards.
                assert page.locator('.atlas-stage').count() == 0

                opener = page.locator('#nivel-1 .level-card__media')
                opener.click(); modal = page.locator('.world-viewer[open]')
                viewer_title = lambda number, name: copies[code]['world']['levels']['viewerTitle'].replace('{number}', str(number)).replace('{name}', name)
                assert modal.locator('#world-viewer-title').inner_text() == viewer_title(1, expected_titles[0])
                assert modal.locator('.world-viewer__caption span').inner_text() == expected_descriptions[0]
                for i in range(8):
                    modal.locator('.world-viewer__thumbnails button').nth(i).click()
                    decoded(modal.locator('.world-viewer__canvas img'))
                    assert modal.locator('.world-viewer__count').inner_text() == copies[code]['world']['viewer']['viewCount'].replace('{index}', str(i+1)).replace('{count}', str(8))
                current = modal.locator('img').first.get_attribute('src')
                switch(page,'en' if code=='es' else 'es'); switch(page,code)
                assert modal.locator('img').first.get_attribute('src') == current
                close(page, opener)
                opener = page.locator('#nivel-1 .level-card__media')
                opener.click(); modal = page.locator('.world-viewer[open]')
                page.keyboard.press('ArrowRight')
                assert modal.locator('#world-viewer-title').inner_text() == viewer_title(2, expected_titles[1]), (code, width, modal.locator('#world-viewer-title').inner_text(), page.evaluate('document.activeElement.outerHTML.slice(0,120)'))
                close(page, opener)

                # No region chips remain on the cards; the last level still opens in the viewer with its text.
                assert cards.locator('.level-card__region').count() == 0
                opener = page.locator('#nivel-8 .level-card__media')
                opener.click(); modal = page.locator('.world-viewer[open]')
                assert modal.locator('#world-viewer-title').inner_text() == viewer_title(8, expected_titles[7])
                assert modal.locator('.world-viewer__caption span').inner_text() == expected_descriptions[7]
                decoded(modal.locator('.world-viewer__canvas img'))
                close(page, opener)
                results.append({'language':code,'width':width,'overflow':False,'mapZoom':True,'mapColumns':2 if width>=901 else 1,'levels':8,'levelColumns':expected_columns(width)})
                print(f'{code.upper()} {width}px: map+chronicle ({2 if width>=901 else 1} col), zoom, 8 levels ({expected_columns(width)} cols), exact descriptions, focus/menu OK',flush=True)

        # Existing behaviors remain intact after extracting shared media helpers.
        page.set_viewport_size({'width':1440,'height':900}); switch(page,'en')
        page.locator('#botonHistoria').click(); assert page.locator('#historiaCompleta').is_visible()
        assert page.locator('#historiaCompleta p').count()==43
        for summary in page.locator('.controles__grupo summary').all():
            summary.focus(); page.keyboard.press('Enter'); assert summary.evaluate('e=>e.parentElement.open')
        for id in ['tutorialPwa','tutorialApk']:
            page.locator(f'button[aria-controls={id}]').click(); assert page.locator('#'+id).is_visible()
        page.locator('.creacion__variantes button').nth(2).click()
        opener=page.locator('.tarjeta-personaje__galeria'); opener.click(); page.keyboard.press('ArrowRight')
        assert page.locator('.galeria-personajes__contador').inner_text()=='2 / 4'
        switch(page,'es'); assert page.locator('.galeria-personajes__contador').inner_text()=='2 / 4'
        page.keyboard.press('Escape'); assert opener.evaluate('e=>e===document.activeElement')
        assert page.locator('.creacion__variantes button').nth(2).get_attribute('aria-pressed')=='true'
        for opener in page.locator('.mecanica__captura').all():
            opener.click(); assert page.locator('.visor-mecanica[open]').count()==1
            page.keyboard.press('Escape'); assert opener.evaluate('e=>e===document.activeElement')
        # The real APK is published: state, enabled link and exact target file.
        lang = page.locator('html').get_attribute('lang')
        android = page.locator('.descargables__tarjeta--android')
        assert android.locator('.descargables__estado').inner_text() == copies[lang]['downloads']['available']
        assert android.locator('button:disabled').count() == 0
        link = android.locator('a[download]')
        assert link.count() == 1
        assert link.get_attribute('href').endswith('downloads/felinaria-android.apk'), link.get_attribute('href')
        assert link.get_attribute('download') == 'felinaria-android.apk'
        assert link.inner_text().strip() == copies[lang]['downloads']['downloadApk']
        apk = context.request.get(base + 'downloads/felinaria-android.apk')
        assert apk.status == 200, apk.status
        apk_body = apk.body()
        assert apk_body[:2] == b'PK', apk_body[:60]
        assert len(apk_body) == 38371606, len(apk_body)
        geometry(page)

        for w,h in [(568,320),(740,320),(844,390),(1024,600),(1920,500)]:
            page.set_viewport_size({'width':w,'height':h})
            opener=page.locator('.atlas-map__open'); opener.click()
            modal=page.locator('.world-viewer[open]')
            assert modal.evaluate('e=>e.scrollWidth<=e.clientWidth+1')
            for button in modal.locator('button:enabled').all():
                button.scroll_into_view_if_needed(); r=button.bounding_box()
                assert r['width']>=44 and r['height']>=44,(w,h,r)
                assert r['x']>=0 and r['x']+r['width']<=w+1,(w,h,r)
            modal.screenshot(path=str(out/f'landscape-{w}x{h}.png'))
            close(page,opener); geometry(page)
        page.emulate_media(reduced_motion='reduce')
        assert page.locator('.atlas-map__open').evaluate('e=>getComputedStyle(e).transitionDuration')=='0s'
        intermediate_count=scan_reflow(page)
        assert not errors and not bad and not warnings,(errors,bad,warnings)
        context.close()

        # Real touch events: all actions are independent of hover.
        touch=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,has_touch=True,is_mobile=True)
        tp=touch.new_page(); tp.goto(base,wait_until='networkidle')
        tp.locator('#botonMenu').tap(); tp.locator('#navPrincipal a[href="#galeria"]').tap()
        tp.locator('.atlas-map__open').tap(); tp.locator('.world-viewer .world-viewer__bar > button').tap()
        tp.locator('#nivel-3 .level-card__media').tap()
        assert tp.locator('.world-viewer[open]').count() == 1
        decoded(tp.locator('.world-viewer__canvas img'))
        tp.locator('.world-viewer__navigation > button').last.tap(); decoded(tp.locator('.world-viewer__canvas img'))
        tp.locator('.world-viewer__bar > button').tap()
        assert tp.locator('.level-card').count() == 8
        touch.close()
        failed=browser.new_context(viewport={'width':1440,'height':900},service_workers='block')
        failed.route('**/images/mapa-felinaria.webp',lambda route:route.abort())
        ep=failed.new_page();ep.goto(base,wait_until='networkidle')
        assert ep.locator('.atlas-map .atlas-image-error').inner_text()==copies['es']['world']['imageError']
        switch(ep,'en')
        assert ep.locator('.atlas-map .atlas-image-error').inner_text()==copies['en']['world']['imageError']
        failed.close();browser.close()
        print('Existing functionality, landscape dialogs, reduced motion, touch, mouse drag and localized error fallback: OK',flush=True)
    summary={'responsive':results,'landscape':[[568,320],[740,320],[844,390],[1024,600],[1920,500]],'intermediateWidthsPerLanguage':intermediate_count,'touch':True,'mousePan':True,'localizedErrorFallback':True,'regionsRetired':True,'apkPublished':True,'regressions':False,'consoleErrors':errors,'httpErrors':bad,'screenshots':str(out)}
    (ROOT/'reports/world-browser-validation.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf8')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url',default='http://127.0.0.1:4200/')
    parser.add_argument('--screenshots',type=Path,default=Path(tempfile.gettempdir())/'opencode/felinaria-world-qa')
    args=parser.parse_args(); args.screenshots.mkdir(parents=True,exist_ok=True)
    run(args.url.rstrip('/')+'/',args.screenshots)
