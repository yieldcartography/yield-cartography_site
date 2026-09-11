# Cross-linking yieldcartography.com and FinAcademy

Prepared 10 September 2026, reworked 11 September with colour-coded cards and emblems. Nothing here has been deployed; each part is applied
by you (or by me, given access) in the order below. Both sites keep working
unchanged if a step is skipped.

## 1. yieldcartography.com: the rail

Files: `yc/assets/promo.js`, `yc/apply_promo.py`.

What it adds: on every page, a column headed "Learn · from the same desk" with
four cards (FinAcademy free, Risk Track I, Risk Track II, Analyst Track I) and
a one-line trademark note. Each card carries an emblem and a striped ribbon in
its track colour: FinAcademy blue with the serif F of the favicon, and styled
serif letters for the tracks, R¹ on light green (Risk Track I), R² on light
blue (Risk Track II), A¹ on amber (Analyst Track I); on the FinAcademy side the
yieldcartography card uses the ridge mark of its logo.
Ribbons are dimmed for tracks not yet open and full-strength for live ones. On screens wide
enough it sits to the right of the content as a sticky column (1220 px and up
on the reading pages, 1480 px and up on the dashboards so the charts keep their
full 1180 px); below that it becomes a row of three cards under the content,
above the footer; on phones the cards stack. The footer's Project list gets a
"FinAcademy (free courses)" link. Every link carries `?ref=yc-rail-…` or
`?ref=yc-footer` so FinAcademy counts arrivals by source (part 2).

Apply (in `~/YIELDS/yc_site`, the folder with `dist/`):

    python3 crosslink/apply_promo.py
    git add -A && git commit -m "FinAcademy rail" && git push

Cloudflare Pages redeploys within a minute. The script copies `promo.js` into
`dist/assets/`, inserts one `<script>` tag before `</head>` in each
`dist/**/index.html` (16 pages; the stray `dist/dist` copy is skipped), and
adds the footer link. It is safe to run again.

Both sites share one definition of the cards: `src/cards.js` (colours,
emblems, copy, links, status). Edit it, run `python3 src/build.py`, and both
`yc/assets/promo.js` and `finacademy/core.js` are regenerated (`src/core.orig.js`
is FinAcademy's current core.js, the base the rail is inserted into). Bump
`?v=2` in the script tag inside `apply_promo.py` when you want caches to pick
up a change at once.

## 2. FinAcademy: tracks rail, arrivals counter, admin readout

Files: `finacademy/core.js`, `finacademy/site.css`, `finacademy/worker.js`,
`finacademy/survey-admin.html`. Each is the full current file with the change
applied; copy over the originals:

    site/assets/js/core.js        <- finacademy/core.js
    site/assets/css/site.css      <- finacademy/site.css
    site/survey-admin.html        <- finacademy/survey-admin.html
    fa-backend/src/worker.js      <- finacademy/worker.js
    cd fa-backend && npx wrangler deploy

What changes:

- Lesson pages get a "More from FinAcademy" column in the right margin (the
  slot reserved for a sponsor, still unused): the same colour-coded cards for
  Risk Track I, Risk Track II and Analyst Track I, plus a yieldcartography.com
  card. It renders only when the window is at least 1120 px wide with room
  beside the 780 px reading column, never on tests, cheat sheets, index or
  account pages, never in print, and follows the dark theme. Which cards and
  in what order is `FA.trackRail` in core.js; copy, colours and emblems are in
  the shared `FA_CARDS` block at the top of the file (from `src/cards.js`).
- Any page opened with `?ref=<source>` reports the source once per browser
  session to `POST /api/ref` (source, path, timestamp; no identity, no cookie).
- The Worker stores those rows in a `refs` table it creates on first use and
  adds `refs` (per-source totals, last-7-day counts, most recent) to the
  `/api/survey/summary` answer. The admin page shows them as "Arrivals by
  source" above the latest responses. Tested locally end to end.

The yieldcartography sources are `yc-rail-free`, `yc-rail-risk1`,
`yc-rail-risk2`, `yc-rail-cfa1` and `yc-footer`; the newsletter and post drafts use `nl-yc-…`
and `frm-…`. Use any short tag you like in future links.

## Focus mode (both sites)

A quiet link at the foot of every page ("focus mode: hide the learning rail"
on yieldcartography, "Focus mode: hide the tracks rail" on FinAcademy lesson
pages) removes the rail on that browser and remembers the choice in
localStorage (`yc_rail_off` / `fa_rail_off`); the same link switches it back.
Nothing is sent anywhere.

## 3. Announcements

`announcements/newsletter_yc_to_finacademy.md`: the issue for the Yield
Cartography newsletter, to send when Risk Track I opens (about two weeks).
`announcements/frm_group_post.md`: a post for the FRM groups now (free site
only) and one for launch day. Square brackets mark the facts only you know:
date, price, launch offer, the track's landing page.

## Order that makes sense

1. Now: FinAcademy part 2 (so arrivals are counted from the first day),
   then yieldcartography part 1, then the FRM group post A.
2. When Risk Track I opens: in `src/cards.js` set the risk1 card to
   `status: 'live'` with the track's own URL and a 'Start the track' cta, run
   `src/build.py`, redeploy both sites, send the newsletter, post B.
