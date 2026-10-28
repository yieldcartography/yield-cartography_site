#!/usr/bin/env python3
"""The 1-Nov-2026 flip. RUN ON 31 OCT (evening) OR 1 NOV, then deploy.
access.js v1 (already live, date-gated) takes over automatically at the cut:
delayed banners, fetch interceptor, registered wall. This script does the
pieces that are NOT date-gated:
  1. des leaves beta: des_publish.py gains PUBLIC=True (inline gate +
     noindex off: access.js's registered wall becomes the only gate),
     page republished;
  2. nav gains "des" after debt on every page + the generator templates;
  3. betagate.js v8: BETA_TABS emptied (no starred tabs remain), the
     footer code box reports the beta program closed;
  4. landing cards: des card un-hidden, and the five reserved-tab cards
     (vols, oracle, LT, debt, des) relabelled "Dashboard · registered".
Idempotent. After running: make_search_index (des stays in SKIP_DIRS: the
page content is behind a wall, no point indexing), git add/commit/push."""
from __future__ import annotations

import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent
DIST = SITE / "dist"
YIELDS = Path("/sessions/kind-dreamy-heisenberg/mnt/YIELDS")
if not YIELDS.exists():
    YIELDS = Path.home() / "YIELDS"

TIP = "One bond under the microscope: schedule, auctions, turnover, rich/cheap, bid-ask (registered)"
LINK = f'<a href="/des/" data-tip="{TIP}">des</a>'
DEBT_RE = re.compile(r'(\n[ \t]*)(<a href="/debt/"[^>]*>debt</a>)')


def sweep(s: str, active: bool) -> str | None:
    if re.search(r'<a href="/des/"[^>]*>des</a>', s.split("</nav>")[0]):
        return None
    m = DEBT_RE.search(s)
    if not m:
        return None
    link = LINK.replace('href="/des/"', 'href="/des/" class="active"') if active else LINK
    return s[:m.end()] + m.group(1) + link + s[m.end():]


def main() -> int:
    # 1. des publisher public mode (mirrors debt_publish's 10-20 change)
    pub = YIELDS / "des_publish.py"
    s = pub.read_text()
    if "PUBLIC = True" not in s:
        anchor = 'SITE = Path.home() / "Documents" / "YC_site"'
        assert anchor in s
        s = s.replace(anchor,
                      "PUBLIC = True   # 2026-11-01: access.js registered wall "
                      "replaces the beta gate\n" + anchor, 1)
        old = '    head = ref.split("</head>")[0]\n    head = head.replace("<title>", GATE + "<title>", 1) + "</head>\\n"'
        assert old in s, "gate-injection block not found in des_publish"
        s = s.replace(old,
                      '    head = ref.split("</head>")[0]\n'
                      '    if not PUBLIC:\n'
                      '        head = head.replace("<title>", GATE + "<title>", 1)\n'
                      '    head = head + "</head>\\n"')
        # mark its own tab active like debt_publish does
        strip = "    header = header.replace(' class=\"active\"', '')"
        assert strip in s
        s = s.replace(strip, strip + "\n    header = header.replace('<a href=\"/des/\" data-tip',\n                            '<a href=\"/des/\" class=\"active\" data-tip', 1)")
        pub.write_text(s)
        print("des_publish.py: PUBLIC mode added")

    # 2. nav sweep
    changed = 0
    for p in sorted(DIST.rglob("index.html")):
        rel = str(p.relative_to(DIST))
        out = sweep(p.read_text(), rel.startswith("des/"))
        if out:
            p.write_text(out)
            changed += 1
    print(f"nav swept on {changed} pages")
    for gen in (YIELDS / "oracle_build.py", YIELDS / "wrap_tr_dashboard_for_site.py"):
        s = gen.read_text()
        out = sweep(s, False)
        if out:
            gen.write_text(out)
            print(f"{gen.name}: nav template updated")

    # 3. betagate v8: beta program closed
    bg = DIST / "assets" / "betagate.js"
    s = bg.read_text()
    if "'/des/'" in s:
        s = re.sub(r"\s*\{ href: '/des/',[^\n]*\n", "\n", s, count=1)
        assert "'/des/'" not in s
        bg.write_text(s)
        print("betagate.js: des dropped, BETA_TABS empty (v8)")
    for p in list(DIST.rglob("index.html")):
        t = p.read_text()
        if "betagate.js?v=7" in t:
            p.write_text(t.replace("betagate.js?v=7", "betagate.js?v=8"))
    for extra in (YIELDS / "oracle_build.py", YIELDS / "wrap_tr_dashboard_for_site.py",
                  YIELDS / "debt_publish.py", YIELDS / "des_publish.py",
                  YIELDS / "alerts_publish.py"):
        t = extra.read_text()
        if "betagate.js?v=7" in t:
            extra.write_text(t.replace("betagate.js?v=7", "betagate.js?v=8"))

    # 4. landing cards
    land = DIST / "index.html"
    s = land.read_text()
    if '<a class="card" href="/des/" data-beta-card style="display:none">' in s:
        s = s.replace('<a class="card" href="/des/" data-beta-card style="display:none">',
                      '<a class="card" href="/des/">')
        print("landing: des card un-hidden")
    if '<h3>des &mdash; one-bond view *</h3>' in s:
        s = s.replace('<h3>des &mdash; one-bond view *</h3>',
                      '<h3>des &mdash; one-bond view</h3>')
    # reserved chip on the five cards: label swap where still plain
    for href in ("/vols/", "/oracle/", "/lt/", "/debt/", "/des/"):
        pat = re.compile(r'(<a class="card" href="' + href +
                         r'">\s*<div class="card-head">\s*<div class="card-label">)Dashboard(?: &middot; beta)?(</div>)')
        s = pat.sub(r"\g<1>Dashboard &middot; registered\g<2>", s)
    land.write_text(s)
    print("landing: reserved chips set")

    # 5. republish the donor-fed pages with the new chrome
    import subprocess
    for script in ("debt_publish.py", "des_publish.py", "alerts_publish.py"):
        subprocess.call([sys.executable, str(YIELDS / script)])
    return 0


if __name__ == "__main__":
    sys.exit(main())
