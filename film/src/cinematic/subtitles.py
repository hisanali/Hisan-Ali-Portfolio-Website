"""Burns subtle Arabic subtitles into the English cinematic cut.

Usage: python3 subtitles.py <in.mp4> <out.mp4> <workdir>
Each line is drawn with the browser (so Arabic shapes correctly) as a
transparent image, then faded in and out over the picture's lower letterbox."""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
src, out, work = sys.argv[1:4]
os.makedirs(work, exist_ok=True)

# (start, end, text) in seconds of the finished film, following the English narration.
SUBS = [
    (1.8, 6.0, 'مسقط. في كل ليلة، هذه المدينة تطرح أسئلتها.'),
    (9.4, 13.1, 'أين نأكل؟ بمن نتصل؟ بمن نثق؟'),
    (17.0, 20.4, 'ومعظم الأعمال... لا تسمعها أبداً.'),
    (23.3, 25.7, 'لم أدخل عالم التسويق من باب المسمّى الوظيفي.'),
    (25.8, 28.0, 'دخلته من باب العمل نفسه.'),
    (30.5, 34.5, 'تدير الإعلانات، تصمّم المحتوى، تقرأ الأرقام...'),
    (34.6, 36.4, 'فتتوقف عن رؤية القنوات.'),
    (37.6, 41.0, 'وترى عميلاً واحداً. رحلة واحدة.'),
    (41.1, 44.3, 'ومواضع قليلة يتسرّب منها العملاء بهدوء.'),
    (45.7, 48.9, 'فأجد مواضع التسرّب، وأصلحها بالترتيب الصحيح،'),
    (48.9, 51.1, 'وأشرحها بلغة بسيطة.'),
    (52.8, 55.6, 'ومع الصباح، تعود المدينة لتسأل من جديد.'),
    (56.4, 58.7, 'وهذه المرة... هناك من يجيب.'),
]
FADE = 0.3

page = f"""<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face {{ font-family: "Plex Arabic"; font-weight: 400 500;
  src: url(file://{HERE}/fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2); }}
html, body {{ margin: 0; width: 1920px; height: 1080px; background: transparent; }}
p {{ position: absolute; left: 0; right: 0; top: 968px; margin: 0; text-align: center;
  font: 500 30px/1.5 "Plex Arabic"; color: rgba(242, 239, 231, 0.78); letter-spacing: 0; }}
</style></head><body><p id="t"></p></body></html>"""
html = os.path.join(work, 'sub.html')
open(html, 'w', encoding='utf8').write(page)
shot = os.path.join(work, 'shot.cjs')
open(shot, 'w', encoding='utf8').write("""
const { chromium } = require('playwright');
(async () => {
  const [html, dir, json] = process.argv.slice(2);
  const lines = JSON.parse(json);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await p.goto('file://' + html);
  for (let i = 0; i < lines.length; i++) {
    await p.evaluate(t => { document.getElementById('t').textContent = t; }, lines[i]);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `${dir}/sub${i}.png`, omitBackground: true });
  }
  await b.close();
})();
""")
subprocess.run(['node', shot, html, work, json.dumps([s[2] for s in SUBS], ensure_ascii=False)], check=True)

cmd = ['ffmpeg', '-loglevel', 'error', '-y', '-i', src]
chain, last = [], '0:v'
for i, (a, b, _) in enumerate(SUBS):
    cmd += ['-loop', '1', '-framerate', '24', '-t', f'{b + 0.1:.2f}', '-i', os.path.join(work, f'sub{i}.png')]
    chain.append(f'[{i + 1}:v]format=rgba,fade=t=in:st={a}:d={FADE}:alpha=1,'
                 f'fade=t=out:st={b - FADE}:d={FADE}:alpha=1[s{i}]')
    chain.append(f"[{last}][s{i}]overlay=0:0:enable='between(t,{a},{b})'[o{i}]")
    last = f'o{i}'
cmd += ['-filter_complex', ';'.join(chain), '-map', f'[{last}]', '-map', '0:a', '-c:v', 'libx264', '-preset', 'slow',
        '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', out]
subprocess.run(cmd, check=True)
print('wrote', out)
