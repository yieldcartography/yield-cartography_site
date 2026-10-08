# macrocartography.com

Two Macro Radars, the United States and Poland, on one site. Each radar can be read in English or Polish:
the flags next to the logo switch the country (the data), EN / PL switch the language, independently.

## What is in this folder

- `macro_radar_template_mc.html`: the one template for both radars and both languages (built from Macro Radar 3
  and the Polish template; neither original was changed).
- `build_site.py`: writes the site folder `mc_dist/` from the template and the two scored data files. Standard library only.
- `landing.html`, `site_assets/`: the home page and its logo, favicon and sharing image (`landing.html` is written by `src/build_mc.py`).
- `mc_dist/`: the built site, ready to deploy (data as of 7 Oct (US) and 8 Oct (PL) 2026).
- `preview_us.html`, `preview_pl.html`: standalone copies with the data inside (open from disk, work offline).
- `src/`: the parts the template is built from (`build_mc.py` and the profile, dictionary, series names, notes and appendix files).
- `smoke_mc.js`: the test (2 countries x 2 languages, site pages, generator files, landing page, snapshot round trip).

## The website pages

The pages `build_site.py` publishes run in site mode, in the yieldcartography.com style:

- a header with the macro_cartography logo, the two flags at its top right, the menu (radar, history, finder, about,
  each with a tooltip) and EN / PL. Each view has its own address (`/us/#history`, `/pl/#about`), so links and the
  back button work;
- About: bio, the method in brief, data sources, external profiles, publications with DOIs and the contact form
  (the same web3forms key as yieldcartography.com, subject "macrocartography.com: enquiry");
- the yieldcartography footer;
- no expert tabs (Latest, Data health, Assumptions, Technical appendix), no HTML snapshot, no light/dark switch and no
  editable titles. Figure pop-outs and the PNG, CSV and XLS downloads stay.

The standalone copies (`preview_*.html`, generator output) keep every tab and the snapshot, as before.

## Languages

- A first visit gets Polish when the browser is set to Polish, English otherwise. The visitor's choice is then
  remembered, and `?lang=pl` or `?lang=en` in a link always wins, so shared links open as intended.
- Switching the language reloads the page and keeps the view, the selected gauge or group (and, in standalone copies, the Assumptions settings).
- Everything on the page is translated: tabs, notes, tooltips, gauge, group and zone names, all 256 series names,
  units, months, and the Technical appendix. Official source titles and citations stay as each source publishes them.
- Numbers keep dot decimals in both languages. CSV and XLS downloads are unchanged.
- An HTML snapshot keeps the untranslated page and the source wording of the data, so it opens in either language.

## One-time setup on Cloudflare (about 10 minutes)

1. Put `build_site.py`, `landing.html`, `site_assets/` and `macro_radar_template_mc.html` in the site repository
   (for example `~/Documents/YC_site/macrocartography/`), and `mc_dist/` next to `dist/` in the same repository.
   Commit and push as usual.
2. Cloudflare dashboard, Workers & Pages, Create, Pages, Connect to Git: pick the same repository
   (`yieldcartography/yield-cartography_site`). Project name `macrocartography`, production branch `main`,
   no build command, build output directory `mc_dist`.
3. In the new project, Custom domains: add `macrocartography.com` and `www.macrocartography.com`
   (the domain is on the same Cloudflare account, so the DNS records are created for you).
4. Both projects now deploy on every push: yieldcartography.com from `dist/`, macrocartography.com from `mc_dist/`.

## Daily refresh (change to the YIELDS hook, to be approved)

After the hook has built the two scored files, one more line rebuilds the site folder:

    python3 ~/Documents/YC_site/macrocartography/build_site.py \
        --us  ~/Documents/YC_site/dist/data/macro/macro_radar.json \
        --pl  ~/Documents/YC_site/dist/data/macro/macro_radar_pl.json \
        --out ~/Documents/YC_site/mc_dist

The existing `git add -A && git commit && git push` then publishes both sites. `build_site.py` refuses a file
without scores, so the site never goes back to unscored data. The pages also still find the old
yieldcartography.com addresses if macrocartography.com does not answer.

## Template changes

Edit the parts in `src/`, run `python3 src/build_mc.py` (it rebuilds `macro_radar_template_mc.html` from
`macro_radar_template3.html` and `landing.html` from `src/landing_src.html`, and asserts every change), then `build_site.py`, then `node smoke_mc.js`.
For a standalone copy with the data inside, the usual generator works with this template and picks the country
from the data file: `python3 macro_radar_generator.py --template macro_radar_template_mc.html --input macro_radar_pl.json --out radar_pl.html --offline`.
