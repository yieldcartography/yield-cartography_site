#!/usr/bin/env python3
"""Build dist/data/search_index.json for the site-wide search overlay.

Walks every dist/**/index.html, splits each page into records at h1/h2/h3
headings, strips tags and scripts, and stores {t: title, p: page title,
u: url, s: snippet}. Run standalone or from build.py after the pages exist.
"""
from __future__ import annotations
import json
import re
from html import unescape
from pathlib import Path

HERE = Path(__file__).resolve().parent
DIST = HERE / 'dist'
OUT = DIST / 'data' / 'search_index.json'

SKIP_DIRS = {'assets', 'data', 'dist', 'landing', 'dns', 'lt'}
MAX_SNIPPET = 380


def _strip(html: str) -> str:
    html = re.sub(r'<script\b.*?</script>', ' ', html, flags=re.S | re.I)
    html = re.sub(r'<style\b.*?</style>', ' ', html, flags=re.S | re.I)
    html = re.sub(r'<[^>]+>', ' ', html)
    return re.sub(r'\s+', ' ', unescape(html)).strip()


def _page_records(path: Path, url: str) -> list[dict]:
    html = path.read_text(encoding='utf-8')
    m = re.search(r'<title>(.*?)</title>', html, re.S)
    page_title = _strip(m.group(1)).split(' — ')[0] if m else url
    body_m = re.search(r'<main\b.*?>(.*)</main>', html, re.S)
    body = body_m.group(1) if body_m else html
    # split at headings, keep the heading text with the chunk that follows it
    parts = re.split(r'(<h[123]\b[^>]*>.*?</h[123]>)', body, flags=re.S)
    recs = []
    # page-level record from the meta description
    dm = re.search(r'<meta name="description" content="([^"]*)"', html)
    if dm:
        recs.append({'t': page_title, 'p': page_title, 'u': url,
                     's': _strip(dm.group(1))[:MAX_SNIPPET]})
    heading = None
    for part in parts:
        if re.match(r'<h[123]\b', part or ''):
            heading = _strip(part)
            continue
        text = _strip(part or '')
        if heading and len(text) > 60:
            recs.append({'t': heading, 'p': page_title, 'u': url,
                         's': text[:MAX_SNIPPET]})
        heading = None
    return recs


def main() -> int:
    records = []
    for path in sorted(DIST.rglob('index.html')):
        rel = path.relative_to(DIST).parent
        if rel.parts and rel.parts[0] in SKIP_DIRS:
            continue
        url = '/' if not rel.parts else '/' + '/'.join(rel.parts) + '/'
        try:
            records.extend(_page_records(path, url))
        except Exception as e:
            print(f'WARN: {path}: {type(e).__name__}: {e}')
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(records, separators=(',', ':'), ensure_ascii=False),
                   encoding='utf-8')
    print(f'wrote {OUT} ({OUT.stat().st_size / 1024:.1f} kB, {len(records)} records)')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
