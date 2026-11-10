"""Measure card geometry in the production preview across desktop, mobile and zoom-equivalent widths.

Run against a preview on port 4200. --audit prints the current layout without
assertions so design changes can be grounded in measured browser geometry.
"""
import argparse
import json
from pathlib import Path
import tempfile
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
WIDTHS = [320, 360, 375, 390, 414, 430, 600, 768, 900, 1024, 1280, 1366,
          1440, 1536, 1600, 1920, 2560, 3840]
ZOOM_CASES = [(1440, 1.25), (1440, 1.5), (1440, 2), (1920, 2), (3840, 2)]
GROUPS = {
    'rewards': ('.recompensas .recompensa', '.recompensa__nombre', '.recompensa__lamina img'),
    'levels': ('.levels-grid .level-card', '.level-card__body h4', '.level-card__media img'),
    'characters': ('.personajes .tarjeta-personaje', '.tarjeta-personaje__nombre', '.tarjeta-personaje__retrato img, .tarjeta-personaje__slide'),
    'mechanics': ('.mecanicas .mecanica:not(.mecanica--creacion)', '.mecanica__texto h3', '.mecanica__captura img'),
    'downloads': ('.descargables .descargables__tarjeta', '.descargables__cabecera h3', '.descargables__icono'),
}
COUNTS = {'rewards': 3, 'levels': 8, 'characters': 5, 'mechanics': 4, 'downloads': 2}
DESCRIPTIONS = {
    'rewards': '.recompensa__texto',
    'levels': '.level-card__body > p:not(.level-card__meta)',
    'characters': '.tarjeta-personaje__descripcion',
    'mechanics': '.mecanica__texto p',
    'downloads': ':scope > p:not(.descargables__compatibilidad)',
}


def measure(page, selector, title, image):
    return page.locator(selector).evaluate_all('''(cards, selectors) => cards.map(card => {
      const box = card.getBoundingClientRect();
      const heading = card.querySelector(selectors.title)?.getBoundingClientRect();
      const photo = card.querySelector(selectors.image);
      const art = photo?.getBoundingClientRect();
      return {x: box.x, y: box.y, width: box.width, height: box.height,
        titleY: heading?.y - box.y, imageWidth: art?.width, imageHeight: art?.height,
        naturalWidth: photo?.naturalWidth, naturalHeight: photo?.naturalHeight,
        objectFit: photo ? getComputedStyle(photo).objectFit : null};
    })''', {'title': title, 'image': image})


def rows(cards):
    grouped = []
    for card in cards:
        match = next((row for row in grouped if abs(row[0]['y'] - card['y']) < 2), None)
        if match is None:
            grouped.append([card])
        else:
            match.append(card)
    return grouped


def decoded(image):
    try:
        image.evaluate('''async i => {
          if (i.complete && !i.naturalWidth) throw new Error('Image failed to load');
          if (!i.complete) await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Image load timed out')), 8000);
            i.addEventListener('load', () => { clearTimeout(timer); resolve(); }, {once: true});
            i.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Image failed to load')); }, {once: true});
          });
          await i.decode();
        }''')
    except Exception as exc:
        raise AssertionError(f'Cannot decode {image.get_attribute("src")}') from exc


def switch(page, language):
    if page.locator('html').get_attribute('lang') == language:
        return
    menu = page.locator('#botonMenu')
    if menu.is_visible() and menu.get_attribute('aria-expanded') == 'false':
        menu.click()
    page.locator(f'#navPrincipal button[lang={language}]').click()
    assert page.locator('html').get_attribute('lang') == language


def check_layout(page, language, width):
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), (language, width, 'page overflow')
    title = page.locator('.hero__titulo').evaluate('e=>({visible:e.clientWidth,content:e.scrollWidth})')
    assert title['content'] <= title['visible'] + 2, (language, width, 'hero title clipped', title)
    summary = {'language': language, 'width': width, 'rows': {}}
    for name, selectors in GROUPS.items():
        cards = measure(page, *selectors)
        assert len(cards) == COUNTS[name], (language, width, name, len(cards))
        grouped = rows(cards)
        summary['rows'][name] = list(map(len, grouped))
        for row in grouped:
            assert max(c['width'] for c in row) - min(c['width'] for c in row) < 1.5, (language, width, name, 'width')
            assert max(c['height'] for c in row) - min(c['height'] for c in row) < 1.5, (language, width, name, 'height')
            assert max(c['titleY'] for c in row) - min(c['titleY'] for c in row) < 1.5, (language, width, name, 'title')
            assert max(c['imageHeight'] for c in row) - min(c['imageHeight'] for c in row) < 1.5, (language, width, name, 'image')
            ordered = sorted(row, key=lambda c: c['x'])
            for previous, current in zip(ordered, ordered[1:]):
                assert previous['x'] + previous['width'] <= current['x'] + 1, (language, width, name, 'overlap')
        for card in cards:
            assert card['x'] >= -1 and card['x'] + card['width'] <= width + 1, (language, width, name, 'viewport')
            assert card['width'] > 250 and card['height'] > 0, (language, width, name, 'legibility')
        for card in page.locator(selectors[0]).all():
            frame = card.bounding_box()
            text = card.locator(DESCRIPTIONS[name]).first
            assert text.inner_text().strip(), (language, width, name, 'description')
            box = text.bounding_box()
            assert box and box['x'] >= frame['x'] - 1 and box['x'] + box['width'] <= frame['x'] + frame['width'] + 1, (language, width, name, 'text width')
            assert box['y'] + box['height'] <= frame['y'] + frame['height'] + 1, (language, width, name, 'text clipped')

    rewards = summary['rows']['rewards']
    if width <= 700:
        assert rewards == [1, 1, 1], (language, width, rewards)
    if width in [768, 900, 1024]:
        assert rewards == [2, 1], (language, width, rewards)
    if width >= 1280:
        assert rewards == [3], (language, width, rewards)
    if rewards == [2, 1]:
        grid = page.locator('.recompensas').bounding_box()
        last = page.locator('.recompensa').last.bounding_box()
        assert abs(last['x'] + last['width'] / 2 - (grid['x'] + grid['width'] / 2)) < 2, (language, width, 'last reward not centered')
        assert abs(last['width'] - page.locator('.recompensa').first.bounding_box()['width']) < 2, (language, width, 'last reward too wide')
    for card in page.locator('.recompensa').all():
        image = card.locator('.recompensa__lamina img')
        frame = card.locator('.recompensa__lamina').bounding_box()
        box = image.bounding_box()
        assert image.evaluate('i=>getComputedStyle(i).objectFit') == 'contain'
        assert box and box['x'] >= frame['x'] - 1 and box['x'] + box['width'] <= frame['x'] + frame['width'] + 1, (language, width, 'reward art width')
        assert box['y'] >= frame['y'] - 1 and box['y'] + box['height'] <= frame['y'] + frame['height'] + 1, (language, width, 'reward art height')
    expected_level_columns = 4 if width >= 1328 else (3 if width >= 992 else (2 if width >= 701 else 1))
    assert max(summary['rows']['levels']) == expected_level_columns, (language, width, summary['rows']['levels'])
    for card in page.locator('.level-card').all():
        assert card.locator('.level-card__media img').evaluate('i=>getComputedStyle(i).objectFit') == ('contain' if width <= 700 else 'cover')
    for card in page.locator('.tarjeta-personaje').all():
        images = card.locator('.tarjeta-personaje__retrato img, .tarjeta-personaje__slide')
        assert images.count() > 0
        assert images.evaluate_all('images=>images.every(image=>getComputedStyle(image).objectFit === "contain")')
    for card in page.locator('.mecanica:not(.mecanica--creacion)').all():
        assert card.locator('.mecanica__captura img').evaluate('i=>getComputedStyle(i).objectFit') == 'contain'
    creation = page.locator('.mecanica--creacion')
    assert creation.count() == 1 and creation.locator('.creacion__variantes button').count() == 4
    if width >= 1920:
        for group, maximum in [('rewards', 420), ('levels', 420), ('characters', 430), ('mechanics', 650), ('downloads', 620)]:
            assert max(c['width'] for c in measure(page, *GROUPS[group])) <= maximum, (language, width, group, 'oversized')
    return summary


def run(audit, screenshots):
    out = Path(tempfile.gettempdir()) / 'opencode' / 'felinaria-card-qa'
    if screenshots:
        out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        page.goto('http://127.0.0.1:4200/', wait_until='networkidle')
        page.evaluate('document.fonts.ready')
        results = []
        for language in (['es'] if audit else ['es', 'en']):
            switch(page, language)
            for width in WIDTHS:
                page.set_viewport_size({'width': width, 'height': 900})
                if audit:
                    details = []
                    for name, selectors in GROUPS.items():
                        cards = measure(page, *selectors)
                        grouped = rows(cards)
                        widths = [round(card['width']) for card in cards]
                        heights = [round(card['height']) for card in cards]
                        title_spread = [round(max(card['titleY'] for card in row) - min(card['titleY'] for card in row)) for row in grouped]
                        details.append(f'{name}:rows={list(map(len,grouped))} width={min(widths)}..{max(widths)} height={min(heights)}..{max(heights)} title-diff={title_spread}')
                    print(f'{language} {width}: ' + ' | '.join(details), flush=True)
                else:
                    result = check_layout(page, language, width)
                    results.append(result)
                    print(f'{language.upper()} {width}px: equal cards, contained artwork, legible text, no overflow OK', flush=True)
                if screenshots and width in [390, 1024, 1440, 2560]:
                    for selector, name in [('#recompensas', 'rewards'), ('#personajes', 'characters'), ('#mecanicas', 'mechanics'), ('.atlas-levels', 'levels')]:
                        for image in page.locator(selector+' img:not([aria-hidden="true"]):visible').all():
                            image.scroll_into_view_if_needed()
                            decoded(image)
                        page.locator(selector).screenshot(path=str(out / f'{"baseline" if audit else "final"}-{language}-{width}-{name}.png'),
                            style='.cabecera,.cabecera * {visibility:hidden !important}', animations='disabled')
        if not audit:
            for physical, zoom in ZOOM_CASES:
                css_width = round(physical / zoom)
                context = browser.new_context(viewport={'width': css_width, 'height': round(900 / zoom)}, device_scale_factor=zoom)
                zoom_page = context.new_page()
                zoom_page.goto('http://127.0.0.1:4200/', wait_until='networkidle')
                zoom_page.evaluate('document.fonts.ready')
                for language in ['es', 'en']:
                    switch(zoom_page, language)
                    check_layout(zoom_page, language, css_width)
                    print(f'{language.upper()} {physical}px @ {round(zoom * 100)}% (viewport {css_width}px CSS, DPR {zoom}): OK', flush=True)
                context.close()
            report = {'widths': WIDTHS, 'languages': ['es', 'en'],
                      'zoomEquivalent': [{'physicalWidth': physical, 'scale': zoom, 'cssWidth': round(physical / zoom)} for physical, zoom in ZOOM_CASES],
                      'layout': results, 'screenshots': str(out) if screenshots else None}
            (ROOT / 'reports' / 'card-layout-validation.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf8')
        browser.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--audit', action='store_true', help='Print geometry only')
    parser.add_argument('--screenshots', action='store_true', help='Capture rewards, characters, mechanics and levels')
    args = parser.parse_args()
    run(args.audit, args.screenshots)
