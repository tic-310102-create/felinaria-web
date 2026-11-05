"""Back up original game art and create full-resolution, alpha-preserving WebP assets.

Run with Python + Pillow, independently of the React build. PNG installation icons
in public/icons are intentionally excluded. Source originals are never deleted here.
"""
from datetime import datetime
import argparse
import hashlib
import json
from pathlib import Path
import shutil
from PIL import Image, ImageChops, features

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    **{f'aprendiz{i}.png': f'aprendiz{i}.webp' for i in range(1, 5)},
    **{f'{name}.png': f'{name}.webp' for name in [
        'maestro', 'rastrojo', 'rosa', 'perros-salvajes', 'colonia-sol',
        'colonia-de-la-luna', 'colonia-del-oleaje', 'manada-del-colmillo',
        'icono_felinaria', 'combate', 'crear-protagonista', 'moral']},
    'dialogos_narrativos.png': 'dialogos-narrativos.webp',
    'interactualr con npc.png': 'interaccion-npc.webp',
}

def write_table(rows):
    before = sum(r['originalBytes'] for r in rows)
    after = sum(r['optimizedBytes'] for r in rows)
    lines = [
        '# Inventario y optimización de imágenes', '',
        'WebP a calidad 86, sin reducir resolución. El canal alfa se comprobó píxel por píxel; los perfiles ICC presentes se conservaron.', '',
        '| Original | Formato | Antes (kB) | Optimizada | Después (kB) | Reducción |',
        '|---|---|---:|---|---:|---:|',
    ]
    for r in rows:
        lines.append(f"| `{r['original']}` | {r['format']} | {r['originalBytes']/1000:.2f} | `{r['optimized']}` | {r['optimizedBytes']/1000:.2f} | {r['reductionPercent']:.2f} % |")
    lines += ['', f'**Total:** {before/1000000:.2f} MB → {after/1000000:.2f} MB; reducción de **{100*(1-after/before):.2f} %**.', '',
              '## Originales y recursos técnicos', '',
              f"Respaldos originales: `{Path(rows[0]['backup']).parent.as_posix()}/`. Las rutas y los SHA-256 de cada original están en `image-optimization.json`.", '',
              '`originales-locales/` está excluido de Git y del build. Los originales no se publican. `public/icons/icon-192.png` y `public/icons/icon-512.png` siguen siendo PNG y no se han convertido. Los SVG existentes se conservan.', '',
              '## Asignación de capturas a mecánicas', '',
              '- Exploración e interacción: `dialogos-narrativos.webp` (investigación de huellas junto al río).',
              '- Diálogos y personajes: `interaccion-npc.webp` (conversación con el mentor en el campamento).',
              '- Decisiones y moral: `moral.webp` (tres respuestas y sus consecuencias).',
              '- Combate y supervivencia: `combate.webp` (ataque durante un enfrentamiento).',
              '- Creación: `crear-protagonista.webp` y las cuatro ilustraciones `aprendiz1.webp` a `aprendiz4.webp`.', '',
              'Las capturas conservan sus rótulos originales en español. Los textos HTML que las acompañan, sus alternativas accesibles y las instrucciones para ampliarlas están traducidos. No se ha alterado el texto dibujado en las imágenes.', '']
    (ROOT / 'reports' / 'OPTIMIZACION_IMAGENES.md').write_text('\n'.join(lines), encoding='utf8')

def archive_originals():
    rows = json.loads((ROOT / 'reports' / 'image-optimization.json').read_text(encoding='utf8'))
    # Verify every recovery copy before removing any redundant source PNG.
    for row in rows:
        backup = ROOT / row['backup']
        assert hashlib.sha256(backup.read_bytes()).hexdigest() == row['sha256Original']
        source = ROOT / row['original']
        if source.exists():
            assert hashlib.sha256(source.read_bytes()).hexdigest() == row['sha256Original']
        with Image.open(ROOT / row['optimized']) as optimized:
            assert optimized.size == (row['width'], row['height'])
        if source.exists():
            with Image.open(source) as original, Image.open(ROOT / row['optimized']) as optimized:
                assert ImageChops.difference(original.convert('RGBA').getchannel('A'), optimized.convert('RGBA').getchannel('A')).getbbox() is None
    for row in rows:
        source = ROOT / row['original']
        if source.exists():
            source.unlink()  # The byte-identical original remains in originales-locales/.
    write_table(rows)
    print('Original PNGs preserved in verified local backups; redundant images/ PNG copies removed.')

def main():
    assert features.check('webp'), 'Pillow needs WebP support'
    stamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    backup = ROOT / 'originales-locales' / stamp
    backup.mkdir(parents=True)
    # Preserve the inspected implementation as well as the original artwork.
    for name in ['src/App.jsx', 'src/main.jsx', 'css/style.css', 'vite.config.js',
                 'sw.js', 'index.html', 'public/manifest.webmanifest']:
        dest = backup / 'project-snapshot' / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / name, dest)
    rows = []
    for original, optimized in SOURCES.items():
        source = ROOT / 'images' / original
        if not source.exists():
            candidates = sorted((ROOT / 'originales-locales').glob(f'*/images/{original}'))
            if not candidates:
                raise FileNotFoundError(original)
            source = candidates[-1]
        dest = backup / 'images' / original
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, dest)
        assert source.read_bytes() == dest.read_bytes()
        target = ROOT / 'images' / optimized
        with Image.open(source) as image:
            rgba = image.convert('RGBA')
            alpha = rgba.getchannel('A')
            transparent = alpha.getextrema()[0] < 255
            render = rgba if transparent else image.convert('RGB')
            options = {'quality': 86, 'method': 6, 'exact': True}
            if image.info.get('icc_profile'):
                options['icc_profile'] = image.info['icc_profile']
            render.save(target, 'WEBP', **options)
            with Image.open(target) as webp:
                assert webp.size == image.size
                assert ImageChops.difference(alpha, webp.convert('RGBA').getchannel('A')).getbbox() is None
            before, after = source.stat().st_size, target.stat().st_size
            rows.append({
                'original': 'images/' + original, 'optimized': 'images/' + optimized,
                'format': image.format, 'width': image.width, 'height': image.height,
                'originalBytes': before, 'optimizedBytes': after,
                'reductionPercent': round(100 * (1 - after / before), 2),
                'transparent': transparent,
                'sha256Original': hashlib.sha256(source.read_bytes()).hexdigest(),
                'backup': dest.relative_to(ROOT).as_posix(),
            })
    reports = ROOT / 'reports'
    reports.mkdir(exist_ok=True)
    (reports / 'image-optimization.json').write_text(json.dumps(rows, indent=2, ensure_ascii=False) + '\n', encoding='utf8')
    metadata = {Path(r['optimized']).name: {'width': r['width'], 'height': r['height']} for r in rows}
    (ROOT / 'src' / 'image-metadata.json').write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf8')
    total_before = sum(r['originalBytes'] for r in rows)
    total_after = sum(r['optimizedBytes'] for r in rows)
    print(f'BACKUP: {backup}')
    for r in rows:
        print(f"{r['original']} -> {r['optimized']}: {r['originalBytes']} -> {r['optimizedBytes']} bytes ({r['reductionPercent']}% smaller); alpha exact")
    print(f'TOTAL: {total_before} -> {total_after} bytes ({100 * (1-total_after/total_before):.2f}% smaller)')
    write_table(rows)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive-originals', action='store_true', help='Verify existing backups, then remove only redundant source PNG copies from images/.')
    args = parser.parse_args()
    if args.archive_originals:
        archive_originals()
    else:
        main()
