#!/usr/bin/env python3
"""LT tab go-live, 2026-10-08. The Smith-Wilson long-term-curve tab leaves the
beta program and joins the public nav between TR and EH.
(1) dist/lt/index.html: inline beta gate and the noindex meta removed.
(2) Nav sweep on every dist page and the two generator templates: LT inserted
    between TR and EH with its tooltip, active on /lt/.
(3) Footer dashboards list gains "Long-term curve".
(4) betagate.js v6: LT dropped from BETA_TABS (debt and des stay starred).
(5) account.js v3: profile-icon anchor no longer keys on /lt/ as a beta tab.
(6) Landing: LT card un-hidden (data-beta-card removed).
(7) debt_publish.py and des_publish.py now inject their OWN gate and noindex
    (previously inherited from the lt chrome, which is public from today).
(8) sitemap gains /lt/.
Idempotent: every step checks before changing."""
from __future__ import annotations

import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent
DIST = SITE / "dist"
YIELDS = Path("/sessions/kind-dreamy-heisenberg/mnt/YIELDS")
if not YIELDS.exists():
    YIELDS = Path.home() / "YIELDS"

LT_TIP = "Smith-Wilson extrapolation of the curve to 100 years under EIOPA Solvency II"
LT_LINK = f'<a href="/lt/" data-tip="{LT_TIP}">LT</a>'
EH_FRAG = '<a href="/eh-tests/" data-tip='
FOOT_OLD = '<li><a href="/eh-tests/">EH tests</a></li>'
FOOT_NEW = '<li><a href="/eh-tests/">EH tests</a></li><li><a href="/lt/">Long-term curve</a></li>'


def sweep(path_or_text, is_page: bool, path: Path | None = None) -> str | None:
    s = path_or_text
    if re.search(r'<a href="/lt/"[^>]*>LT</a>', s.split("</nav>")[0]):
        return None
    indent_m = re.search(r'(\n[ \t]*)' + re.escape(EH_FRAG), s)
    if not indent_m:
        return None
    link = LT_LINK
    if is_page and path is not None:
        rel = str(path.relative_to(DIST))
        if rel.startswith("lt/"):
            link = link.replace('href="/lt/"', 'href="/lt/" class="active"')
    s = s.replace(indent_m.group(1) + EH_FRAG,
                  indent_m.group(1) + link + indent_m.group(1) + EH_FRAG, 1)
    if FOOT_OLD in s and "Long-term curve" not in s:
        s = s.replace(FOOT_OLD, FOOT_NEW)
    s = s.replace("betagate.js?v=5", "betagate.js?v=6")
    s = s.replace("account.js?v=2", "account.js?v=3")
    return s


def main() -> int:
    # 1. degate the lt page
    lt = DIST / "lt" / "index.html"
    s = lt.read_text()
    if "yc_beta" in s:
        s = re.sub(r'<meta name="robots" content="noindex, nofollow">\n?', "", s)
        s = re.sub(r"<script>\s*\(function\(\)\{(?:(?!</script>).)*yc_beta(?:(?!</script>).)*</script>\n?",
                   "", s, flags=re.DOTALL)
        assert "yc_beta" not in s.split("</head>")[0], "gate not stripped"
        lt.write_text(s)
        print("lt/index.html: gate + noindex removed")

    # 2+3. nav + footer sweep on every page
    changed = 0
    for p in sorted(DIST.rglob("index.html")):
        out = sweep(p.read_text(), True, p)
        if out:
            p.write_text(out)
            changed += 1
    print(f"nav swept on {changed} pages")

    # 4. betagate v6: drop LT
    bg = DIST / "assets" / "betagate.js"
    s = bg.read_text()
    if "'/lt/'" in s:
        s = re.sub(r"\s*\{ href: '/lt/',[^\n]*\n", "\n", s, count=1)
        assert "'/lt/'" not in s
        bg.write_text(s)
        print("betagate.js: LT dropped from BETA_TABS (v6)")

    # 5. account.js v3: beta anchor selector without /lt/
    ac = DIST / "assets" / "account.js"
    s = ac.read_text()
    old = "nav.querySelector('a[href=\"/lt/\"], a[href=\"/debt/\"], a[href=\"/des/\"]')"
    if old in s:
        s = s.replace(old, "nav.querySelector('a[href=\"/debt/\"], a[href=\"/des/\"]')")
        ac.write_text(s)
        print("account.js: beta selector updated (v3)")

    # 6. landing LT card visible
    land = DIST / "index.html"
    s = land.read_text()
    if '<a class="card" href="/lt/" data-beta-card style="display:none">' in s:
        s = s.replace('<a class="card" href="/lt/" data-beta-card style="display:none">',
                      '<a class="card" href="/lt/">')
        land.write_text(s)
        print("landing: LT card un-hidden")

    # 7. publishers carry their own gate + noindex from now on
    gate_tpl = '''GATE = """<meta name="robots" content="noindex, nofollow">
<script>
(function(){
  'use strict';
  var ok=false; try{ ok=localStorage.getItem('yc_beta')==='1'; }catch(e){}
  if(ok) return;
  document.documentElement.style.visibility='hidden';
  document.addEventListener('DOMContentLoaded', function(){
    document.body.innerHTML='<div style="max-width:420px;margin:18vh auto;padding:26px;'+
      'border:1px solid #ddd;border-radius:8px;font-family:ui-monospace,monospace;text-align:center">'+
      '<div style="font-size:13px;letter-spacing:1px;margin-bottom:14px">__LABEL__ \\u00b7 BETA</div>'+
      '<input id="ltGate" type="password" placeholder="beta access code" autocomplete="off" '+
      'style="font-family:inherit;font-size:13px;padding:8px 12px;border:1px solid #ccc;'+
      'border-radius:4px;width:220px;text-align:center">'+
      '<div style="font-size:10px;color:#999;margin-top:12px"><a href="/" style="color:#999">\\u2190 yieldcartography</a></div></div>';
    document.documentElement.style.visibility='visible';
    var b=document.getElementById('ltGate');
    b.focus();
    b.addEventListener('keydown', function(ev){
      if(ev.key!=='Enter') return;
      if(b.value.trim().toLowerCase()==='beta'){
        try{ localStorage.setItem('yc_beta','1'); }catch(e){}
        location.reload();
      } else { b.value=''; b.placeholder='no'; setTimeout(function(){b.placeholder='beta access code';},1200); }
    });
  });
})();
</script>
"""
'''
    for name, label in (("debt_publish.py", "DEBT"), ("des_publish.py", "DES")):
        pub = YIELDS / name
        s = pub.read_text()
        if "GATE = " not in s:
            anchor = ("HERE = Path(__file__).resolve().parent"
                      if "HERE = Path(__file__).resolve().parent" in s
                      else 'SITE = Path.home() / "Documents" / "YC_site"')
            s = s.replace(anchor, gate_tpl.replace("__LABEL__", label) + "\n" + anchor, 1)
            # inject the gate right after the donor head (which is public now)
            s = s.replace('head = ref.split("</head>")[0] + "</head>\\n"',
                          'head = ref.split("</head>")[0]\n'
                          '    head = head.replace("<title>", GATE + "<title>", 1) + "</head>\\n"', 1)
            s = s.replace("account.js?v=2", "account.js?v=3")
            assert "GATE + " in s and 'GATE = """' in s, name
            pub.write_text(s)
            print(f"{name}: own gate + noindex injected")

    # 8. sitemap
    sm = DIST / "sitemap.xml"
    s = sm.read_text()
    if "/lt/</loc>" not in s:
        anchor = "<url><loc>https://yieldcartography.com/media/</loc>"
        s = s.replace(anchor,
                      "<url><loc>https://yieldcartography.com/lt/</loc><lastmod>2026-10-08</lastmod>"
                      "<changefreq>daily</changefreq><priority>0.8</priority></url>\n  " + anchor, 1)
        sm.write_text(s)
        print("sitemap: /lt/ added")

    # 9. generator templates
    for gen in (YIELDS / "oracle_build.py", YIELDS / "wrap_tr_dashboard_for_site.py"):
        s = gen.read_text()
        out = sweep(s, False)
        if out:
            gen.write_text(out)
            print(f"{gen.name}: nav template updated")
    return 0


if __name__ == "__main__":
    sys.exit(main())
