"""Convert the eight inspected world illustrations without overwriting their originals.

Requires Python + Pillow with WebP support, not an application dependency.
"""
import argparse
from datetime import datetime
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
from PIL import Image, ImageChops, ImageOps, features

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    'mapa.jpeg': 'mapa-felinaria.webp',
    'aldea del sol.jpeg': 'aldea-del-sol.webp',
    'colonia de oleaje.jpeg': 'colonia-del-oleaje-detalle.webp',
    'frontera de la colonia.jpeg': 'frontera-de-la-colonia.webp',
    'sendero de murmullos.jpeg': 'sendero-de-los-murmullos.webp',
    'paso de inrusijada.jpeg': 'paso-de-la-encrucijada.webp',
    'el paso roto.jpeg': 'el-paso-roto.webp',
    'guarida del gran alfa.jpeg': 'guarida-del-gran-alfa.webp',
}
LOCATIONS = {'frontera-de-la-colonia', 'sendero-de-los-murmullos', 'paso-de-la-encrucijada', 'el-paso-roto'}
# Every level shown in "Niveles del mapa" needs a 768 px preview and a 240 px thumbnail.
LEVEL_STEMS = ['aldea-del-sol', 'colonia-del-oleaje-detalle', 'colonia-sol', 'frontera-de-la-colonia',
               'guarida-del-gran-alfa', 'paso-de-la-encrucijada', 'sendero-de-los-murmullos', 'el-paso-roto']

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def save_webp(image, path, quality):
    options = {'quality': quality, 'method': 6, 'exact': True}
    if image.info.get('icc_profile'):
        options['icc_profile'] = image.info['icc_profile']
    image.save(path, 'WEBP', **options)
    with Image.open(path) as check:
        assert check.format == 'WEBP' and check.size == image.size
        assert ImageChops.difference(image.convert('RGBA').getchannel('A'), check.convert('RGBA').getchannel('A')).getbbox() is None

def table(report):
    rows = report['images']
    lines = ['# Atlas de Felinaria: inventario y optimización', '',
             '| Original | Resolución | Antes (kB) | WebP | Después (kB) | Reducción |',
             '|---|---|---:|---|---:|---:|']
    for r in rows:
        lines.append(f"| `{r['original']}` | {r['width']}×{r['height']} | {r['originalBytes']/1000:.2f} | `{r['optimized']}` | {r['optimizedBytes']/1000:.2f} | {r['reductionPercent']:.2f} % |")
    before = sum(r['originalBytes'] for r in rows)
    after = sum(r['optimizedBytes'] for r in rows)
    variants = sum(v['bytes'] for r in rows for v in r['variants'])
    previews = sum(1 for r in rows for v in r['variants'] if v['width'] == 768)
    thumbs = sum(1 for r in rows for v in r['variants'] if v['width'] == 240)
    lines += ['', f'Originales: **{before/1000000:.3f} MB**. Ocho WebP completos: **{after/1000000:.3f} MB** ({100*(1-after/before):.2f} % menos).', '',
              f'{previews} versiones de 768 px y {thumbs} miniaturas de 240 px de estas ilustraciones añaden **{variants/1000:.2f} kB**. La Colonia del Sol aporta además sus propias variantes de 768 y 240 px. No se crean versiones ampliadas ni derivados del mapa pequeño.', '',
              f"Respaldo: `{report['backup']}/`. Incluye los ocho JPEG con SHA-256, copia del código inspeccionado y build inicial para pruebas de actualización.", '',
              'Se verificaron decodificación, formato real, dimensiones, orientación EXIF y canal alfa. No se añadieron marcos ni se retocó el contenido del arte. Los hashes de píxeles y archivos no presentan duplicados exactos entre las ocho imágenes.', '',
              'Los rótulos integrados en el mapa, el campamento y El Paso Roto se conservan en español. La interfaz, las descripciones, la leyenda externa y los textos alternativos sí tienen ES/EN.', '',
              'La pertenencia de la guarida a la Manada se apoya en sus emblemas caninos y en los rótulos de la Guarida del Colmillo del arte suministrado. Los niveles 2, 3, 5 y 7 no reciben coordenadas ni una región inferida.', '']
    (ROOT / 'reports' / 'WORLD_IMAGES.md').write_text('\n'.join(lines), encoding='utf8')

def convert():
    assert features.check('webp')
    sources = ROOT / 'images' / 'niveles del mapa'
    missing = [name for name in SOURCES if not (sources / name).is_file()]
    if missing:
        raise FileNotFoundError(', '.join(missing))
    backup = ROOT / 'originales-locales' / ('world-' + datetime.now().strftime('%Y%m%d-%H%M%S'))
    backup.mkdir(parents=True)
    for name in ['src', 'css', 'vite.config.js', 'sw.js', 'package.json', 'tests']:
        src = ROOT / name
        dest = backup / 'project-snapshot' / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        if src.is_dir():
            shutil.copytree(src, dest)
        else:
            shutil.copy2(src, dest)
    if (ROOT / 'dist').is_dir():
        shutil.copytree(ROOT / 'dist', backup / 'baseline-dist')
    metadata = json.loads((ROOT / 'src/image-metadata.json').read_text(encoding='utf8'))
    rows = []
    for original, output in SOURCES.items():
        source = sources / original
        target = ROOT / 'images' / output
        assert not target.exists(), f'Refusing to overwrite {target}'
        dest = backup / 'originals' / original
        dest.parent.mkdir(exist_ok=True)
        shutil.copy2(source, dest)
        assert sha(source) == sha(dest)
        with Image.open(source) as check:
            check.verify()
        with Image.open(source) as source_image:
            assert source_image.format == 'JPEG'
            image = ImageOps.exif_transpose(source_image).convert('RGB')
            image.info.update(source_image.info)
            quality = 85 if original == 'mapa.jpeg' else (80 if original == 'el paso roto.jpeg' else 83)
            save_webp(image, target, quality)
            width, height = image.size
            metadata[output] = {'width': width, 'height': height}
            row = {'original': (Path('images/niveles del mapa') / original).as_posix(),
                   'optimized': 'images/' + output, 'format': 'JPEG', 'width': width, 'height': height,
                   'originalBytes': source.stat().st_size, 'optimizedBytes': target.stat().st_size,
                   'quality': quality, 'sha256Original': sha(source),
                   'sha256Pixels': hashlib.sha256(image.tobytes()).hexdigest(),
                   'backup': dest.relative_to(ROOT).as_posix(), 'variants': []}
            row['reductionPercent'] = round(100 * (1 - row['optimizedBytes']/row['originalBytes']), 2)
            if target.stem in LOCATIONS:
                for size in [768, 240]:
                    variant = target.with_name(f'{target.stem}-{size}.webp')
                    resized = image.resize((size, round(height * size/width)), Image.Resampling.LANCZOS)
                    save_webp(resized, variant, 82 if size == 768 else 78)
                    metadata[variant.name] = {'width': resized.width, 'height': resized.height}
                    row['variants'].append({'file': variant.name, 'width': resized.width, 'height': resized.height, 'bytes': variant.stat().st_size})
            rows.append(row)
            print(f'{original}: {width}x{height}, {row["originalBytes"]} -> {row["optimizedBytes"]} bytes ({row["reductionPercent"]}%)')
    assert len({r['sha256Original'] for r in rows}) == 8
    assert len({r['sha256Pixels'] for r in rows}) == 8
    baseline_sw = (backup / 'baseline-dist/sw.js').read_text(encoding='utf8')
    cache = re.search(r"const CACHE_NAME = '([^']+)'", baseline_sw).group(1)
    report = {'backup': backup.relative_to(ROOT).as_posix(),
              'baselineCommit': subprocess.check_output(['git','rev-parse','HEAD'], cwd=ROOT, text=True).strip(),
              'baselineTests': '4/4 passed', 'baselineCache': cache, 'images': rows}
    (ROOT / 'src/image-metadata.json').write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf8')
    (ROOT / 'reports/world-image-optimization.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf8')
    table(report)
    print('BACKUP:', backup)

def ensure_variants():
    """Create the missing 768 px previews and 240 px thumbnails used by the level cards."""
    assert features.check('webp')
    metadata = json.loads((ROOT / 'src/image-metadata.json').read_text(encoding='utf8'))
    report = json.loads((ROOT / 'reports/world-image-optimization.json').read_text(encoding='utf8'))
    rows_by_file = {row['optimized'].split('/')[-1]: row for row in report['images']}
    created = []
    for stem in LEVEL_STEMS:
        full = ROOT / 'images' / f'{stem}.webp'
        assert full.is_file(), f'Missing level artwork: {full.name}'
        with Image.open(full) as opened:
            image = opened.copy()
            width, height = image.size
        for size, quality in [(768, 82), (240, 78)]:
            variant = full.with_name(f'{stem}-{size}.webp')
            if variant.is_file():
                metadata.setdefault(variant.name, {'width': 0, 'height': 0})
                with Image.open(variant) as check:
                    metadata[variant.name] = {'width': check.width, 'height': check.height}
                continue
            resized = image.resize((size, round(height * size / width)), Image.Resampling.LANCZOS)
            save_webp(resized, variant, quality)
            metadata[variant.name] = {'width': resized.width, 'height': resized.height}
            record = {'file': variant.name, 'width': resized.width, 'height': resized.height, 'bytes': variant.stat().st_size}
            row = rows_by_file.get(variant.name.rsplit('-', 1)[0] + '.webp')
            if row is not None and not any(v['file'] == variant.name for v in row['variants']):
                row['variants'].append(record)
                row['variants'].sort(key=lambda v: -v['width'])
            created.append(variant.name)
    (ROOT / 'src/image-metadata.json').write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf8')
    (ROOT / 'reports/world-image-optimization.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf8')
    table(report)
    for stem in LEVEL_STEMS:
        for size in (768, 240):
            name = f'{stem}-{size}.webp'
            assert (ROOT / 'images' / name).is_file() and metadata[name]['width'] > 0, name
    print('Created:', ', '.join(created) if created else '(none, all level variants already present)')

def archive():
    report = json.loads((ROOT / 'reports/world-image-optimization.json').read_text(encoding='utf8'))
    for row in report['images']:
        assert sha(ROOT / row['backup']) == row['sha256Original']
        if (ROOT / row['original']).exists():
            assert sha(ROOT / row['original']) == row['sha256Original']
        with Image.open(ROOT / row['optimized']) as image:
            assert image.format == 'WEBP' and image.size == (row['width'], row['height'])
    for row in report['images']:
        if (ROOT / row['original']).exists():
            (ROOT / row['original']).unlink()  # Exact recovery copies remain outside the published assets.
    print('Eight original JPEGs retained in the verified, Git-ignored backup; only redundant source copies archived.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive-originals', action='store_true')
    parser.add_argument('--ensure-variants', action='store_true',
                        help='Generate any missing 768/240 level previews and thumbnails')
    args = parser.parse_args()
    if args.archive_originals:
        archive()
    elif args.ensure_variants:
        ensure_variants()
    else:
        convert()
