"""Renders the Play Store screenshots (1080x1920 PNG): python3 promo/shots.py --lang uk --outdir DIR"""
import argparse, base64, os, subprocess, sys, time
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument('--lang', default='uk')
ap.add_argument('--outdir', default='.')
ap.add_argument('--port', type=int, default=8795)
a = ap.parse_args()
os.makedirs(a.outdir, exist_ok=True)
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(a.port)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_context(viewport={'width': 1000, 'height': 600}, device_scale_factor=2).new_page()
        pg.on('pageerror', lambda e: print('PAGEERROR', e, flush=True))
        pg.goto(f'http://localhost:{a.port}/promo/shots.html?lang={a.lang}')
        pg.wait_for_function('window.__ready === true', timeout=30000)
        for i in range(6):
            path = os.path.join(a.outdir, f'{a.lang}_{i + 1:02d}.png')
            open(path, 'wb').write(base64.b64decode(pg.evaluate('i => window.shot(i)', i)))
            print(path, flush=True)
        b.close()
finally:
    srv.terminate()
