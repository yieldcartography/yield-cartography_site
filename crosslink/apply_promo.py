#!/usr/bin/env python3
"""Add the FinAcademy rail to every page of yieldcartography.com.

Run from the yc_site folder (the one containing dist/):
    python3 apply_promo.py
It copies assets/promo.js into dist/assets/, inserts one <script> tag before
</head> in every dist/**/index.html (skipping the stray dist/dist copy), and adds
a "FinAcademy" link to the footer's Project list. Safe to run again: pages that
already have the tag are left alone. Nothing else in the pages is touched.
"""
import os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.getcwd()
DIST = os.path.join(ROOT, 'dist')
if not os.path.isdir(DIST):
    sys.exit('run this from the yc_site folder (dist/ not found in ' + ROOT + ')')

TAG = '<script src="/assets/promo.js?v=2" defer></script>'
FOOT = '<li><a href="https://learn.finacademy.ai/?ref=yc-footer">FinAcademy (free courses)</a></li>'

src = os.path.join(HERE, 'assets', 'promo.js')
os.makedirs(os.path.join(DIST, 'assets'), exist_ok=True)
shutil.copy(src, os.path.join(DIST, 'assets', 'promo.js'))
print('copied assets/promo.js')

n_tag = n_foot = n_skip = 0
for dp, dn, fn in os.walk(DIST):
    if os.path.join(DIST, 'dist') in dp:      # stray duplicate folder, leave it
        continue
    for f in fn:
        if f != 'index.html':
            continue
        path = os.path.join(dp, f)
        s = open(path, encoding='utf-8').read()
        orig = s
        if 'promo.js' not in s and '</head>' in s:
            s = s.replace('</head>', TAG + '\n</head>', 1); n_tag += 1
        if 'yc-footer' not in s and '<li><a href="/about/">About</a></li>' in s:
            s = s.replace('<li><a href="/about/">About</a></li>', '<li><a href="/about/">About</a></li>\n        ' + FOOT, 1); n_foot += 1
        if s != orig:
            open(path, 'w', encoding='utf-8').write(s)
        else:
            n_skip += 1
print('script tag added to %d pages, footer link to %d, %d already done' % (n_tag, n_foot, n_skip))
