#!/usr/bin/env python3
"""Debt tab go-live, 2026-10-20. The Treasury-debt maturity-profile-and-
simulator tab leaves the beta program and joins the public nav after LT.
(1) YIELDS/debt_publish.py gains PUBLIC = True: gate and noindex no longer
    injected. dist/debt/index.html republished by that script separately.
(2) Nav sweep on every dist page and the generator templates: debt inserted
    between LT and EH with its tooltip, active on /debt/.
(3) Footer dashboards list gains "Treasury debt" after Long-term curve.
(4) betagate.js v7: debt dropped from BETA_TABS (only des stays starred).
(5) account.js v4: profile-icon beta selector keys on /des/ only.
(6) Landing: debt card un-hidden.
(7) sitemap gains /debt/, make_search_index SKIP_DIRS drops 'debt'.
Idempotent, guard is a regex that also matches the active variant
(lesson from the LT go-live duplicate)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent
DIST = SITE / "dist"
YIELDS = Path("/sessions/kind-dreamy-heisenberg/mnt/YIELDS")
if not YIELDS.exists():
    YIELDS = Path.home() / "YIELDS"

TIP = "Treasury wholesale bonds: maturity profile since 2005 and a ten-year rollover simulator"
LINK = f'<a href="/debt/" data-tip="{TIP}">debt</a>'
EH_RE = re.compile(r'(\n[ \t]*)(<a href="/eh-tests/"[^>]*>EH</a>)')
FOOT_OLD = '<li><a href="/lt/">Long-term curve</a></li>'
FOOT_NEW = '<li><a href="/lt/">Long-term curve</a></li><li><a href="/debt/">Treasury debt</a></li>'


def sweep(s: str, active: bool) -> str | None:
    if re.search(r'<a href="/debt/"[^>]*>debt</a>', s.split("</nav>")[0]):
        return None
    m = EH_RE.search(s)
    if not m:
        return None
    link = LINK.replace('href="/debt/"', 'href="/debt/" class="active"') if active else LINK
    s = s[:m.start()] + m.group(1) + link + m.group(1) + m.group(2) + s[m.end():]
    if FOOT_OLD in s and "Treasury debt" not in s:
        s = s.replace(FOOT_OLD, FOOT_NEW)
    s = s.replace("betagate.js?v=6", "betagate.js?v=7")
    s = s.replace("account.js?v=3", "account.js?v=4")
    return s


def main() -> int:
    # 1. publisher public mode
    pub = YIELDS / "debt_publish.py"
    s = pub.read_text()
    if "PUBLIC = True" not in s:
        anchor = "HERE = Path(__file__).resolve().parent"
        assert anchor in s
        s = s.replace(anchor, "PUBLIC = True   # 2026-10-20 go-live: no gate, no noindex\n" + anchor, 1)
        old = '    head = ref.split("</head>")[0]\n    head = head.replace("<title>", GATE + "<title>", 1) + "</head>\\n"'
        assert old in s, "gate-injection block not found"
        s = s.replace(old,
                      '    head = ref.split("</head>")[0]\n'
                      '    if not PUBLIC:\n'
                      '        head = head.replace("<title>", GATE + "<title>", 1)\n'
                      '    head = head + "</head>\\n"')
        pub.write_text(s)
        print("debt_publish.py: PUBLIC mode added")

    # 2+3. nav + footer sweep
    changed = 0
    for p in sorted(DIST.rglob("index.html")):
        rel = str(p.relative_to(DIST))
        out = sweep(p.read_text(), rel.startswith("debt/"))
        if out:
            p.write_text(out)
            changed += 1
    print(f"nav swept on {changed} pages")

    # 4. betagate v7
    bg = DIST / "assets" / "betagate.js"
    s = bg.read_text()
    if "'/debt/'" in s:
        s = re.sub(r"\s*\{ href: '/debt/',[^\n]*\n", "\n", s, count=1)
        assert "'/debt/'" not in s
        bg.write_text(s)
        print("betagate.js: debt dropped (v7)")

    # 5. account.js v4
    ac = DIST / "assets" / "account.js"
    s = ac.read_text()
    old = "nav.querySelector('a[href=\"/debt/\"], a[href=\"/des/\"]')"
    if old in s:
        s = s.replace(old, "nav.querySelector('a[href=\"/des/\"]')")
        ac.write_text(s)
        print("account.js: beta selector = des only (v4)")

    # 6. landing card
    land = DIST / "index.html"
    s = land.read_text()
    if '<a class="card" href="/debt/" data-beta-card style="display:none">' in s:
        s = s.replace('<a class="card" href="/debt/" data-beta-card style="display:none">',
                      '<a class="card" href="/debt/">')
        land.write_text(s)
        print("landing: debt card un-hidden")

    # 7. sitemap + search index
    sm = DIST / "sitemap.xml"
    s = sm.read_text()
    if "/debt/</loc>" not in s:
        anchor = "<url><loc>https://yieldcartography.com/lt/</loc>"
        s = s.replace(anchor,
                      "<url><loc>https://yieldcartography.com/debt/</loc><lastmod>2026-10-20</lastmod>"
                      "<changefreq>daily</changefreq><priority>0.8</priority></url>\n  " + anchor, 1)
        sm.write_text(s)
        print("sitemap: /debt/ added")
    msi = SITE / "make_search_index.py"
    s = msi.read_text()
    if "'debt'," in s or "'debt'}" in s or ", 'debt'" in s:
        s = s.replace(", 'debt', 'des'}", ", 'des'}")
        msi.write_text(s)
        print("make_search_index: 'debt' un-skipped")

    # 8. generator templates
    for gen in (YIELDS / "oracle_build.py", YIELDS / "wrap_tr_dashboard_for_site.py"):
        s = gen.read_text()
        out = sweep(s, False)
        if out:
            gen.write_text(out)
            print(f"{gen.name}: nav template updated")
    return 0


if __name__ == "__main__":
    sys.exit(main())
