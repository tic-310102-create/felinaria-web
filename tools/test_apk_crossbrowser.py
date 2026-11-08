"""APK download + core UI smoke in every Playwright engine (Chromium, Firefox, WebKit).

Example: npm run preview -- --host 127.0.0.1 --port 4200
         python tools/test_apk_crossbrowser.py
Verifies that the real APK download returns the identical file (not an error page)
and that the map/levels interface works in engines beyond Chromium.
"""
import argparse
import hashlib
import json
from pathlib import Path
import tempfile
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_SHA = '8a9d768a2d8f4bd239f9d09576fd31cd8e9d1300281838fee81c48d30786a90b'
EXPECTED_SIZE = 38371606
LEVEL_KEYS = ['apprenticeCamp', 'borderCrossing', 'crossroadsPass', 'sunColonyActTwo',
              'whispersPath', 'tideColony', 'brokenPass', 'greatAlphaDen']


def check(page, base, engine, copies, download_dir):
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(base, wait_until='networkidle')
    assert page.locator('.atlas-map').count() == 1, engine
    assert page.locator('#mundo-regiones').count() == 0, engine
    assert page.locator('.level-card').count() == 8, engine
    titles = [page.locator('.level-card h4').nth(i).inner_text() for i in range(8)]
    assert titles == [copies['es']['world']['levels'][k]['title'] for k in LEVEL_KEYS], (engine, titles)

    opener = page.locator('#nivel-1 .level-card__media')
    opener.click()
    modal = page.locator('.world-viewer[open]')
    assert modal.count() == 1, engine
    assert modal.locator('.world-viewer__caption span').inner_text() == \
        copies['es']['world']['levels']['apprenticeCamp']['description'], engine
    page.keyboard.press('Escape')
    assert opener.evaluate('e=>e===document.activeElement'), engine

    page.locator('.descargables__tarjeta--android').scroll_into_view_if_needed()
    link = page.locator('.descargables__tarjeta--android a[download]')
    assert link.count() == 1, engine
    with page.expect_download() as info:
        link.click()
    download = info.value
    assert download.suggested_filename == 'felinaria-android.apk', download.suggested_filename
    target = Path(download_dir) / f'{engine}-felinaria-android.apk'
    download.save_as(str(target))
    data = target.read_bytes()
    assert len(data) == EXPECTED_SIZE, (engine, len(data))
    assert data[:2] == b'PK', (engine, data[:16])
    assert hashlib.sha256(data).hexdigest() == EXPECTED_SHA, engine
    assert not errors, (engine, errors)
    print(f'{engine}: 8 levels + viewer + APK download OK ({len(data)} bytes, sha256 match)', flush=True)


def run(base, download_dir):
    copies = {code: json.loads((ROOT / f'src/i18n/{code}.json').read_text(encoding='utf8'))
              for code in ['es', 'en']}
    results = []
    with sync_playwright() as p:
        for engine in ['chromium', 'firefox', 'webkit']:
            browser = getattr(p, engine).launch(headless=True)
            page = browser.new_page(viewport={'width': 1440, 'height': 900})
            check(page, base, engine, copies, download_dir)
            results.append(engine)
            browser.close()
    report = {'engines': results, 'apkSha256': EXPECTED_SHA, 'apkBytes': EXPECTED_SIZE,
              'levels': 8, 'regionsRetired': True}
    (ROOT / 'reports/world-crossbrowser-validation.json').write_text(
        json.dumps(report, indent=2) + '\n', encoding='utf8')
    print('Cross-engine APK download and interface smoke: OK for', ', '.join(results), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://127.0.0.1:4200/')
    parser.add_argument('--downloads', type=Path,
                        default=Path(tempfile.gettempdir()) / 'opencode/felinaria-apk-downloads')
    args = parser.parse_args()
    args.downloads.mkdir(parents=True, exist_ok=True)
    run(args.url.rstrip('/') + '/', args.downloads)
