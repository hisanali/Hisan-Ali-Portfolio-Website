"""Reproduce the runtime CC0 ambientCG Grass004 maps (offline preparation only)."""
from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen
from zipfile import ZipFile
from PIL import Image

url = 'https://ambientcg.com/get?file=Grass004_1K-JPG.zip'
archive = ZipFile(BytesIO(urlopen(Request(url, headers={'User-Agent': 'FootballAssetPreparation/1.0'})).read()))
out = Path(__file__).resolve().parents[1] / 'assets'
for source, target, size, quality in [
    ('Color', 'color', 1024, 85),
    ('NormalGL', 'normal', 512, 82),
    ('Roughness', 'roughness', 256, 82),
]:
    im = Image.open(BytesIO(archive.read(f'Grass004_1K-JPG_{source}.jpg'))).convert('RGB')
    im.thumbnail((size, size), Image.Resampling.LANCZOS)
    im.save(out / f'pitch-{target}.webp', quality=quality)
