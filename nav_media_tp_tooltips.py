#!/usr/bin/env python3
"""One-off nav rework, 2026-10-08.
(1) Merge the shorts and movies tabs into a single "media" tab backed by a
    new merged page dist/media/index.html (Movies section + Shorts section,
    built from the two existing pages). Old URLs redirect via _redirects.
(2) Rename the "term premia" tab to "TP" (the page itself keeps its name).
(3) Styled CSS tooltips on every nav tab via data-tip attributes, defined
    once in style.css (::before chip, since the active underline uses
    ::after). betagate.js gains the same tooltips for the starred beta tabs.
Sweeps every dist/**/index.html, the landing cards, the footers, and the two
generator templates (YIELDS/oracle_build.py, YIELDS/wrap_tr_dashboard_for_
site.py) so rebuilt pages carry the same nav. Bumps style.css to ?v=10 and
betagate.js to ?v=5 everywhere. Rerunning is safe: pages already carrying
data-tip are skipped by the nav regex no-match guard."""
from __future__ import annotations

import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent
DIST = SITE / "dist"
YIELDS = Path("/sessions/kind-dreamy-heisenberg/mnt/YIELDS")
if not YIELDS.exists():
    YIELDS = Path.home() / "YIELDS"

TIPS = {
    "cockpit":   "Daily mainboard: curve, term premia, policy signals and cross-market benchmarks on one page",
    "curves":    "Zero-coupon yield curves 2005-2026: daily LW-NSS fit, bond bubbles, forwards, rich/cheap",
    "TP":        "Term premia: ACM and BRW decompositions of PLN yields, with US and euro-area comparison",
    "vols":      "Realised normal volatilities of the curve, plus a swaption pricer",
    "oracle":    "The next NBP move: bias-corrected market path, forecaster survey and minutes tone in one score",
    "MPC":       "Text-mining of NBP MPC minutes since 2007: hawk-dove tone, topics, lexical evolution",
    "liquidity": "Microstructure liquidity measures and a composite index for the Treasury bond panel",
    "TR":        "Total return: seven-component decomposition of every Treasury bond and the TBSP index",
    "EH":        "Expectations-hypothesis tests on the Polish, US and euro-area curves",
    "media":     "Shorts (two-page paper summaries) and 4K yield-curve time-lapse movies",
    "about":     "Methodology, data sources, publications with DOIs, and contact",
}
NAV = [  # (href, label)
    ("/cockpit/", "cockpit"), ("/curves/", "curves"), ("/term-premia/", "TP"),
    ("/vols/", "vols"), ("/oracle/", "oracle"), ("/mpc/", "MPC"),
    ("/liquidity/", "liquidity"), ("/total-return/", "TR"),
    ("/eh-tests/", "EH"), ("/media/", "media"), ("/about/", "about"),
]


def nav_html(active_href: str | None, indent: str = "    ") -> str:
    out = []
    for href, label in NAV:
        cls = ' class="active"' if href == active_href else ""
        out.append(f'{indent}<a href="{href}"{cls} data-tip="{TIPS[label]}">{label}</a>')
    return "\n".join(out)


def active_for(path: Path) -> str | None:
    rel = "/" + str(path.relative_to(DIST).parent).replace("\\", "/") + "/"
    if rel == "/./":
        return None
    first = rel.split("/")[1]
    mapping = {"cockpit": "/cockpit/", "curves": "/curves/",
               "term-premia": "/term-premia/", "vols": "/vols/",
               "oracle": "/oracle/", "mpc": "/mpc/", "liquidity": "/liquidity/",
               "total-return": "/total-return/", "eh-tests": "/eh-tests/",
               "media": "/media/", "shorts": "/media/", "movies": "/media/",
               "about": "/about/"}
    return mapping.get(first)


NAV_RE = re.compile(r'(<nav>\n)(\s*<a href="/cockpit/".*?)(\n\s*</nav>)', re.DOTALL)
FOOTER_OLD = '<li><a href="/shorts/">Shorts</a></li><li><a href="/movies/">Movies</a></li>'
FOOTER_NEW = '<li><a href="/media/">Media</a></li>'


def sweep_page(path: Path) -> bool:
    s = path.read_text()
    m = NAV_RE.search(s)
    if not m or "data-tip" in m.group(2):
        return False
    indent = re.match(r"[ \t]*", m.group(2)).group(0)
    s = s[:m.start(2)] + nav_html(active_for(path), indent) + s[m.end(2):]
    if FOOTER_OLD in s:
        s = s.replace(FOOTER_OLD, FOOTER_NEW)
    s = s.replace("style.css?v=9", "style.css?v=10")
    s = s.replace("betagate.js?v=4", "betagate.js?v=5")
    path.write_text(s)
    return True


def build_media_page() -> None:
    movies = (DIST / "movies" / "index.html").read_text()
    shorts = (DIST / "shorts" / "index.html").read_text()

    def style_of(s):
        return re.search(r"<style>(.*?)</style>", s, re.DOTALL).group(1)

    def main_of(s):
        return re.search(r"<main>(.*?)</main>", s, re.DOTALL).group(1)

    head = movies.split("<style>")[0]
    head = head.replace("Movies — yieldcartography", "Media — yieldcartography")
    head = re.sub(r'<meta name="description" content="[^"]*"',
                  '<meta name="description" content="Shorts (two-page summaries of '
                  'the papers behind the dashboards) and 4K daily time-lapses of the '
                  'Polish sovereign yield curve, term premia and liquidity, 2005-2026."',
                  head)
    head = head.replace("https://yieldcartography.com/movies/", "https://yieldcartography.com/media/")
    head = re.sub(r'(og:title" content=")[^"]*', r"\g<1>Media - yieldcartography", head)
    head = re.sub(r'(og:description" content=")[^"]*',
                  r"\g<1>Shorts summarising the research and 4K yield-curve time-lapse movies.", head)
    head = re.sub(r'(twitter:title" content=")[^"]*', r"\g<1>Media - yieldcartography", head)
    head = re.sub(r'(twitter:description" content=")[^"]*',
                  r"\g<1>Shorts summarising the research and 4K yield-curve time-lapse movies.", head)

    movies_main = main_of(movies)
    shorts_main = main_of(shorts)
    movies_body = movies_main.split("</h1>", 1)[1].split('<p style="color:var(--muted)', 1)[1].split("</p>", 1)[1]
    shorts_body = shorts_main.split("</h1>", 1)[1].split('<p style="color:var(--muted)', 1)[1].split("</p>", 1)[1]

    header = re.search(r'<header class="site-header">.*?</header>', movies, re.DOTALL).group(0)
    footer = re.search(r'<footer class="site-footer">.*?</footer>', movies, re.DOTALL).group(0)
    scripts = movies.split("</footer>", 1)[1].replace("</body>", "").replace("</html>", "").strip()

    page = (head + "<style>" + style_of(movies) + style_of(shorts) + """
  .media-section-head { margin: 34px 0 6px 0; display: flex; align-items: baseline; gap: 14px; }
  .media-section-head h2 { font-size: 22px; margin: 0; letter-spacing: -0.3px; }
  .media-section-head .jump { font-family: var(--mono); font-size: 11px; color: var(--muted); }
</style>
""" +
        '<script src="/assets/promo.js?v=5" defer></script>\n'
        '<script src="/assets/search.js?v=1" defer></script>\n'
        "</head>\n<body>\n\n" + header + "\n\n<main>\n\n"
        '  <h1 style="margin:18px 0 6px 0;font-size:26px;letter-spacing:-0.3px">Media</h1>\n'
        '  <p style="color:var(--muted);margin:0 0 10px 0;font-size:14px;line-height:1.55">'
        "The research behind the dashboards in two watchable and readable formats: "
        '<a href="#movies">movies</a>, daily 4K time-lapses of twenty-one years of the Polish '
        'sovereign curve, and <a href="#shorts">shorts</a>, two-page summaries of the underlying '
        "papers with one headline figure and one key table each.</p>\n\n"
        '  <div class="media-section-head" id="movies"><h2>Movies</h2>'
        '<span class="jump"><a href="#shorts">jump to shorts &darr;</a></span></div>\n'
        '  <p style="color:var(--muted);margin:0 0 6px 0;font-size:13.5px;line-height:1.55">'
        "Daily 4K time-lapses of the Polish sovereign zero-coupon yield curve, ACM/BRW term premia, "
        "fit diagnostics and the NSS/SPF forecast family, plus a lexical-evolution time-lapse of NBP "
        "MPC minute language. Built from the same data behind the dashboards. Watch on YouTube for "
        "full quality.</p>\n"
        + movies_body +
        '\n  <div class="media-section-head" id="shorts"><h2>Shorts</h2>'
        '<span class="jump"><a href="#movies">back to movies &uarr;</a></span></div>\n'
        '  <p style="color:var(--muted);margin:0 0 6px 0;font-size:13.5px;line-height:1.55">'
        "Two-page summaries of the working papers behind the yieldcartography dashboards. Each short "
        "carries a catchy title, ~200 words of setup, one headline figure, one key table, ~200 words "
        "of interpretation, and a 50-word &quot;what this means for practitioners&quot; line. "
        "Comments are open at the bottom of every short.</p>\n"
        + shorts_body +
        "\n</main>\n\n" + footer + "\n\n" + scripts + "\n</body>\n</html>\n")
    out = DIST / "media" / "index.html"
    out.parent.mkdir(exist_ok=True)
    out.write_text(page)
    print(f"built {out.relative_to(DIST)} ({len(page)//1024} KB)")


def main() -> int:
    # 1. merged media page from the still-original movies/shorts pages
    if not (DIST / "media" / "index.html").exists():
        build_media_page()

    # 2. tooltip CSS once
    css = DIST / "assets" / "style.css"
    s = css.read_text()
    if "data-tip" not in s:
        s += """
/* Nav tooltips (v10): chip below the tab from data-tip. The active underline
   uses ::after, so the tooltip lives on ::before. Hover-only, slight delay. */
.site-header nav a[data-tip]::before {
  content: attr(data-tip);
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--ink);
  color: #fff;
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 400;
  letter-spacing: 0.2px;
  line-height: 1.5;
  padding: 7px 11px;
  border-radius: 4px;
  width: max-content;
  max-width: 270px;
  white-space: normal;
  text-align: center;
  z-index: 40;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s ease, visibility 0s linear 0.5s;
}
.site-header nav a[data-tip]:hover::before {
  opacity: 1;
  visibility: visible;
  transition-delay: 0.35s, 0.35s;
}
.site-header nav a:last-child[data-tip]::before,
.site-header nav a:nth-last-child(2)[data-tip]::before {
  left: auto;
  right: 0;
  transform: none;
}
"""
        css.write_text(s)
        print("style.css: tooltip block appended")

    # 3. sweep every page
    changed = 0
    for p in sorted(DIST.rglob("index.html")):
        if sweep_page(p):
            changed += 1
    print(f"nav swept on {changed} pages")

    # 4. landing cards: merge Shorts + Movies into one Media card
    land = DIST / "index.html"
    s = land.read_text()
    m = re.search(r'      <a class="card" href="/shorts/">.*?</a>\n      <a class="card" href="/movies/">.*?</a>\n',
                  s, re.DOTALL)
    if m:
        card = """      <a class="card" href="/media/">
        <div class="card-head">
          <div class="card-label">Read &amp; watch</div>
          <svg class="card-icon" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
            <rect x="6" y="8" width="17" height="23" rx="1.5" fill="#fff" stroke="#1f4e79" stroke-width="1.5"/>
            <line x1="9.5" y1="13" x2="19" y2="13" stroke="#1f4e79" stroke-width="1.3"/>
            <line x1="9.5" y1="17" x2="20" y2="17" stroke="#888" stroke-width="0.9"/>
            <line x1="9.5" y1="20" x2="19" y2="20" stroke="#888" stroke-width="0.9"/>
            <circle cx="28" cy="25" r="9" fill="#fff" stroke="#1f4e79" stroke-width="1.6"/>
            <polygon points="25.5,20.5 25.5,29.5 32.5,25" fill="#c2522d"/>
          </svg>
        </div>
        <h3>Media</h3>
        <p>Shorts — two-page summaries of the papers behind these dashboards, comments open — and 4K daily time-lapses of the curve, term premia and liquidity. Full resolution on the YouTube channel.</p>
      </a>
"""
        card = card.replace(" — ", ", ")  # no em-dashes
        s = s[:m.start()] + card + s[m.end():]
        land.write_text(s)
        print("landing: media card merged")

    # 5. redirects
    rd = DIST / "_redirects"
    s = rd.read_text()
    if "/media/" not in s:
        s = s.rstrip("\n") + """
/shorts/  /media/#shorts  301
/shorts  /media/#shorts  301
/movies/  /media/#movies  301
/movies  /media/#movies  301
"""
        rd.write_text(s)
        print("_redirects: shorts/movies -> media")

    # 6. betagate.js v5: tooltips on the starred beta tabs
    bg = DIST / "assets" / "betagate.js"
    s = bg.read_text()
    if "tip:" not in s:
        s = s.replace(
            "  var BETA_TABS = [\n"
            "    { href: '/lt/', label: 'LT *' },\n"
            "    { href: '/debt/', label: 'debt *' },\n"
            "    { href: '/des/', label: 'des *' }\n"
            "  ];",
            "  var BETA_TABS = [\n"
            "    { href: '/lt/', label: 'LT *', tip: 'Beta: Smith-Wilson extrapolation of the curve to 100 years under EIOPA Solvency II' },\n"
            "    { href: '/debt/', label: 'debt *', tip: 'Beta: Treasury wholesale bonds, maturity profile since 2005 and a ten-year rollover simulator' },\n"
            "    { href: '/des/', label: 'des *', tip: 'Beta: one bond under the microscope, schedule, auctions, turnover, rich/cheap, bid-ask' }\n"
            "  ];")
        s = s.replace("      a.textContent = t.label;",
                      "      a.textContent = t.label;\n"
                      "      if (t.tip) a.setAttribute('data-tip', t.tip);")
        assert "tip:" in s and "setAttribute('data-tip'" in s
        bg.write_text(s)
        print("betagate.js: beta-tab tooltips added (v5)")

    # 7. generator templates so rebuilt pages keep the new nav
    for gen in (YIELDS / "oracle_build.py", YIELDS / "wrap_tr_dashboard_for_site.py"):
        s = gen.read_text()
        m = NAV_RE.search(s)
        if m and "data-tip" not in m.group(2):
            indent = re.match(r"[ \t]*", m.group(2)).group(0)
            active = "/oracle/" if "oracle" in gen.name else "/total-return/"
            s = s[:m.start(2)] + nav_html(active, indent) + s[m.end(2):]
        if FOOTER_OLD in s:
            s = s.replace(FOOTER_OLD, FOOTER_NEW)
        s = s.replace("style.css?v=9", "style.css?v=10")
        s = s.replace("betagate.js?v=4", "betagate.js?v=5")
        gen.write_text(s)
        print(f"{gen.name}: nav template updated")
    return 0


if __name__ == "__main__":
    sys.exit(main())
