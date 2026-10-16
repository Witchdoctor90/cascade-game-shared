"""Plays the demo for many seeds without drawing and prints when each turn starts and how long its chain gets.

    python3 promo/seedscan.py [seed ...]        # default: seeds 1..200, results in promo/scan.json
"""
import json, os, subprocess, sys, time
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
seeds = [int(x) for x in sys.argv[1:]] or list(range(1, 201))
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8791'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page()
        pg.goto('http://localhost:8791/promo/seedscan.html')
        res = [pg.evaluate('([s, t]) => scan(s, t)', [s, 34]) for s in seeds]
        json.dump(res, open(os.path.join(ROOT, 'promo', 'scan.json'), 'w'))
        for r in res:
            print(r['seed'], [(round(x['start'], 2), round(x['end'], 2), x['max']) for x in r['turns']][:8])
        b.close()
finally:
    srv.terminate()
