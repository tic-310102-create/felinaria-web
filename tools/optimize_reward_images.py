"""Convert the three reward illustrations to WebP without overwriting their originals.

Requires Python + Pillow with WebP support, not an application dependency.
Writes reports/rewards-image-optimization.json (separate from the untouched
18-row reports/image-optimization.json checked by tests/content.test.js).
"""
import hashlib
import json
import shutil
from datetime import datetime
from pathlib import Path
from PIL import Image, ImageChops, ImageOps, features

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    'dagas de rosa.png': 'espada-de-rosa.webp',
    'moral.png': 'barra-de-moral.webp',
    'pocion de curacion.png': 'pocion-de-curacion.webp',
}
QUALITY = 85


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_webp(image, path, quality):
    options = {'quality': quality, 'method': 6, 'exact': True}
    if image.info.get('icc_profile'):
        options['icc_profile'] = image.info['icc_profile']
    image.save(path, 'WEBP', **options)
    with Image.open(path) as check:
        assert check.format == 'WEBP' and check.size == image.size
        source_alpha = image.convert('RGBA').getchannel('A')
        check_alpha = check.convert('RGBA').getchannel('A')
        assert ImageChops.difference(source_alpha, check_alpha).getbbox() is None


def convert():
    assert features.check('webp')
    missing = [name for name in SOURCES if not (ROOT / 'images' / name).is_file()]
    if missing:
        raise FileNotFoundError(', '.join(missing))
    backup = ROOT / 'originales-locales' / ('rewards-' + datetime.now().strftime('%Y%m%d-%H%M%S'))
    (backup / 'images').mkdir(parents=True)
    metadata = json.loads((ROOT / 'src/image-metadata.json').read_text(encoding='utf8'))
    rows = []
    for original, output in SOURCES.items():
        source = ROOT / 'images' / original
        target = ROOT / 'images' / output
        assert not target.exists(), f'Refusing to overwrite {target}'
        dest = backup / 'images' / original
        shutil.copy2(source, dest)
        assert sha(source) == sha(dest)
        with Image.open(source) as check:
            check.verify()
        with Image.open(source) as source_image:
            assert source_image.format == 'PNG'
            image = ImageOps.exif_transpose(source_image)
            if image.mode != 'RGBA':
                image = image.convert('RGBA')
            image.info.update(source_image.info)
            save_webp(image, target, QUALITY)
            width, height = image.size
            metadata[output] = {'width': width, 'height': height}
            row = {'original': 'images/' + original,
                   'optimized': 'images/' + output, 'format': 'PNG', 'width': width, 'height': height,
                   'originalBytes': source.stat().st_size, 'optimizedBytes': target.stat().st_size,
                   'quality': QUALITY, 'sha256Original': sha(source),
                   'sha256Pixels': hashlib.sha256(image.tobytes()).hexdigest(),
                   'backup': dest.relative_to(ROOT).as_posix()}
            row['reductionPercent'] = round(100 * (1 - row['optimizedBytes'] / row['originalBytes']), 2)
            rows.append(row)
            print(f'{original}: {width}x{height} alpha, {row["originalBytes"]} -> {row["optimizedBytes"]} bytes ({row["reductionPercent"]}%)')
    assert len({r['sha256Original'] for r in rows}) == 3
    (ROOT / 'src/image-metadata.json').write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf8')
    (ROOT / 'reports/rewards-image-optimization.json').write_text(json.dumps(rows, indent=2, ensure_ascii=False) + '\n', encoding='utf8')
    print('BACKUP:', backup)


if __name__ == '__main__':
    convert()
