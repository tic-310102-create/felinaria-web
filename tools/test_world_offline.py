"""Test an actual PWA update, existing clients and the complete offline atlas.

Serves a baseline and the new build under /atlas/ on localhost. No deployed route
or production code is added. Requires Python Playwright and a completed Vite build.
"""
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import tempfile
from threading import Thread
from urllib.parse import unquote, urlsplit
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
REPORT=json.loads((ROOT/'reports/world-image-optimization.json').read_text(encoding='utf8'))
METADATA=json.loads((ROOT/'src/image-metadata.json').read_text(encoding='utf8'))
REWARD_IMAGES=['espada-de-rosa.webp','barra-de-moral.webp','pocion-de-curacion.webp']
REWARD_KEYS=['sword','morality','potion']
BASELINE=ROOT/REPORT['backup']/'baseline-dist'
CURRENT=ROOT/'dist'
assert (CURRENT/'sw.js').is_file(), 'Run npm run build first'
assert (BASELINE/'sw.js').is_file(), 'The private baseline backup is required for the old-client update test'

class Handler(SimpleHTTPRequestHandler):
    served_root=BASELINE
    def translate_path(self,path):
        url=unquote(urlsplit(path).path)
        if url.startswith('/atlas/'):
            relative=Path(url[len('/atlas/'):])
            if '..' in relative.parts:
                return str(self.served_root/'__invalid')
            return str(self.served_root/relative)
        return str(self.served_root/'__invalid')
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        super().end_headers()
    def log_message(self,*args):
        pass

def decoded(page,selector):
    image=page.locator(selector)
    image.evaluate('i=>i.decode()')
    assert image.evaluate('i=>i.naturalWidth>0')

def decode_with_retry(image):
    """A request interrupted by the offline switch can retry from the SW cache."""
    image.scroll_into_view_if_needed()
    last=''
    for attempt in range(3):
        try:
            image.evaluate('i=>i.decode()')
            if image.evaluate('i=>i.naturalWidth>0'):
                return
            last='naturalWidth=0'
        except Exception as exc:
            last=str(exc).splitlines()[0]
        image.evaluate("i=>{const s=i.getAttribute('src');i.removeAttribute('src');i.setAttribute('src',s)}")
        image.evaluate("i=>i.complete?0:new Promise(r=>{const done=()=>r(0);i.addEventListener('load',done,{once:true});i.addEventListener('error',done,{once:true});setTimeout(done,15000)})")
    raise AssertionError(f'Image never decoded offline: {image.get_attribute("src")} ({last})')

def language(page,code):
    modal=page.locator('dialog[open]')
    if modal.count():modal.locator(f'.selector-idioma button[lang={code}]').click()
    else:
        toggle=page.locator('#botonMenu')
        if toggle.is_visible() and toggle.get_attribute('aria-expanded')=='false':toggle.click()
        page.locator(f'#navPrincipal button[lang={code}]').click()
    assert page.locator('html').get_attribute('lang')==code

COPIES={code: json.loads((ROOT/f'src/i18n/{code}.json').read_text(encoding='utf8')) for code in ['es','en']}
LEVEL_KEYS=['apprenticeCamp','borderCrossing','crossroadsPass','sunColonyActTwo','whispersPath','tideColony','brokenPass','greatAlphaDen']
copies_for=lambda code: COPIES[code]

def run():
    server=ThreadingHTTPServer(('127.0.0.1',4203),Handler)
    thread=Thread(target=server.serve_forever,daemon=True);thread.start()
    base='http://127.0.0.1:4203/atlas/'
    out=Path(tempfile.gettempdir())/'opencode/felinaria-world-qa'
    out.mkdir(parents=True,exist_ok=True)
    profile=out/('offline-profile-'+datetime.now().strftime('%Y%m%d-%H%M%S'))
    try:
        with sync_playwright() as p:
            context=p.chromium.launch_persistent_context(str(profile),headless=True,viewport={'width':1440,'height':900},device_scale_factor=1)
            old=context.new_page()
            errors=[]
            old.on('pageerror',lambda e:errors.append(str(e)))
            old.goto(base+'#galeria',wait_until='networkidle')
            old.wait_for_function('navigator.serviceWorker.controller!==null',timeout=60000)
            assert not old.locator('.atlas-map').count()
            language(old,'en')
            old.wait_for_function("localStorage.getItem('felinaria-language')==='en'")
            # A warm old client has the existing controllerchange reload listener enabled.
            page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(base+'#galeria',wait_until='networkidle')
            assert page.locator('html').get_attribute('lang')=='en'
            assert not page.locator('.atlas-map').count()
            old_cache=old.evaluate("async()=>(await caches.keys()).find(n=>n.startsWith('felinaria-'))")
            assert old_cache==REPORT['baselineCache'],old_cache
            Handler.served_root=CURRENT
            page.evaluate('async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update()}')
            page.wait_for_selector('.atlas-map',timeout=60000)
            page.wait_for_function('navigator.serviceWorker.controller!==null')
            assert page.locator('html').get_attribute('lang')=='en'
            names=page.evaluate('caches.keys()')
            assert old_cache not in names,names
            caches=[n for n in names if n.startswith('felinaria-')]
            assert len(caches)==1 and caches[0]!=old_cache,names
            urls=page.evaluate('''async()=>{const c=await caches.open((await caches.keys()).find(n=>n.startsWith('felinaria-')));return(await c.keys()).map(r=>r.url)}''')
            for row in REPORT['images']:
                assert base+row['optimized'] in urls,row['optimized']
                for variant in row['variants']:assert base+'images/'+variant['file'] in urls
            for name in REWARD_IMAGES:
                assert base+'images/'+name in urls,name
            cached_webp=len([url for url in urls if url.endswith('.webp')])
            assert cached_webp==len(METADATA),(cached_webp,len(METADATA))
            assert not any('originales-locales' in url or url.endswith('.jpeg') or url.endswith('.apk') for url in urls)
            cdp=context.new_cdp_session(page);cdp.send('Page.enable')
            installability=cdp.send('Page.getInstallabilityErrors')
            assert not installability['installabilityErrors'],installability
            cdp.send('Network.enable');cdp.send('Network.clearBrowserCache')
            context.set_offline(True)

            # The still-open cold baseline tab can request its original artwork from the new cache.
            assert not old.locator('.atlas-map').count()
            for image in old.locator('.tarjeta-personaje img, .galeria img').all():
                decode_with_retry(image)
            assert old.locator('.tarjeta-personaje').count()==5
            print('PWA update: warm client reloads to atlas; old cold client retains its artwork offline; current cache preserved',flush=True)

            responses=[]
            page.on('response',lambda r:responses.append(r.url) if r.from_service_worker and '/images/' in r.url else None)
            page.reload(wait_until='networkidle')
            assert page.locator('html').get_attribute('lang')=='en'
            assert 'Offline' in page.locator('.aviso-sin-conexion').inner_text()
            # The desktop panorama can preload a full-size file before mobile reflow;
            # Chromium may keep that already decoded candidate rather than downgrade.
            # Verify that the 768px preview remains offered and either candidate works offline.
            page.set_viewport_size({'width':390,'height':844})
            for i in range(8):
                image = page.locator('.level-card').nth(i).locator('.level-card__media img')
                image.scroll_into_view_if_needed()
                decode_with_retry(image)
                attrs=image.evaluate('i=>({cur:i.currentSrc,src:i.src,ss:i.srcset})')
                assert '-768.webp' in attrs['ss'], (i,attrs)
                assert '-768.webp' in attrs['cur'] or attrs['cur']==attrs['src'], (i,attrs)
            print('Small-screen 768px previews offered; cached full-size artwork also resolves offline: OK', flush=True)
            page.set_viewport_size({'width':1440,'height':900})
            for code in ['en','es']:
                language(page,code)
                rewards=page.locator('#recompensas .recompensa')
                assert rewards.count()==3
                assert rewards.locator('.recompensa__nombre').all_inner_texts()==[copies_for(code)['rewards'][key]['name'] for key in REWARD_KEYS]
                for image in rewards.locator('img').all():decode_with_retry(image)
                assert rewards.locator('.recompensa__valor').all_inner_texts()==[copies_for(code)['rewards'][key]['value'] for key in REWARD_KEYS[1:]]
                page.locator('.atlas-map__open').click();decoded(page,'.world-viewer__canvas img')
                other='es' if code=='en' else 'en'
                language(page,other);language(page,code)
                page.keyboard.press('Escape')
                # The four-region presentation no longer exists in the offline app either.
                assert page.locator('#mundo-regiones').count()==0
                assert page.locator('.atlas-region').count()==0
                assert page.locator('.atlas-map__legend').count()==0
                for i in range(8):
                    page.locator('.level-card__media').nth(i).click()
                    decoded(page,'.world-viewer__canvas img')
                    assert page.locator('.world-viewer__caption span').inner_text()==copies_for(code)['world']['levels'][LEVEL_KEYS[i]]['description']
                    page.keyboard.press('Escape')
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
                page.locator('.atlas-levels').screenshot(path=str(out/f'offline-{code}-levels.png'),style='.cabecera,.cabecera * {visibility:hidden !important}')
                print(f'{code.upper()} offline: map, eight levels and three rewards with their artwork OK',flush=True)
            # Small-screen srcSet and thumbnail variants also resolve offline under a non-root base.
            # After the captures above, assert the responsive contract on the attributes
            # (never mutated) plus offline availability of whatever candidate is active.
            page.set_viewport_size({'width':390,'height':844})
            page.wait_for_timeout(600)
            for i in range(8):
                image = page.locator('.level-card').nth(i).locator('.level-card__media img')
                image.scroll_into_view_if_needed()
                decode_with_retry(image)
                attrs = image.evaluate('i=>({ss:i.getAttribute("srcset"),cur:i.currentSrc})')
                assert '-768.webp' in attrs['ss'], attrs
                assert attrs['ss'].count('w,') == 1, attrs
                assert '-240' not in attrs['cur'] and attrs['cur'].endswith('.webp'), attrs
            # The retired carousel is really gone; its eight levels replace it.
            assert page.locator('.locations-editorial').count() == 0
            assert page.locator('.level-card').count() == 8
            language(page,'en')
            page.wait_for_function("localStorage.getItem('felinaria-language')==='en'")
            assert not errors,errors
            context.close()

            # Reopen a persisted profile with networking already disabled.
            reopened=p.chromium.launch_persistent_context(str(profile),headless=True,viewport={'width':1440,'height':900})
            reopened.set_offline(True)
            page=reopened.new_page();page.goto(base+'#galeria',wait_until='networkidle')
            assert page.locator('html').get_attribute('lang')=='en'
            page.locator('.atlas-map__open').click();decoded(page,'.world-viewer__canvas img');page.keyboard.press('Escape')
            language(page,'es');page.reload(wait_until='networkidle');assert page.locator('html').get_attribute('lang')=='es'
            reopened.close()
            summary={'subpath':'/atlas/','baselineCache':old_cache,'currentCache':caches[0], 'cachedWebP':cached_webp,'baselineClientArtworkOffline':True,'warmClientAutoUpdated':True,'mapOffline':True,'regionsRetired':True,'allLevelsOffline':True,'rewardsOffline':True,'languagesOffline':['es','en'],'responsiveVariantsOffline':True,'preferenceAfterRestart':True,'installability':installability,'serviceWorkerImageResponses':len(set(responses)),'consoleErrors':errors}
            (ROOT/'reports/world-offline-validation.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf8')
            print('Offline profile restart, language preference, 768px variants, /atlas/ base and installability configuration: OK')
    finally:
        server.shutdown();server.server_close();thread.join(timeout=5)

if __name__=='__main__':
    run()
