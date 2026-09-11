#!/usr/bin/env python3
"""Assemble the deliverables from src/: yc/assets/promo.js and finacademy/core.js
(FinAcademy's core.js with the shared cards, the tracks rail and the referral
beacon inserted). site.css, worker.js and survey-admin.html are edited in place
and not touched here."""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
cards = open(os.path.join(HERE, 'cards.js')).read()
promo = open(os.path.join(HERE, 'promo_body.js')).read()
trail = open(os.path.join(HERE, 'trail_body.js')).read()

os.makedirs(os.path.join(ROOT, 'yc', 'assets'), exist_ok=True)
open(os.path.join(ROOT, 'yc', 'assets', 'promo.js'), 'w').write(cards + promo)

src = open(os.path.join(HERE, 'core.orig.js')).read()          # FinAcademy's current core.js
anchor = "  /* ---------- nav: highlight the current level ---------- */"
assert anchor in src and 'initTracksRail' not in src
out = src.replace(anchor, trail + anchor, 1)
out = out.replace("    FA.initSponsorRail();\n  });", "    FA.initSponsorRail();\n    FA.initTracksRail();\n    FA.initRef();\n  });", 1)
# the shared cards module goes at the very top so FA_CARDS exists before boot
out = cards + '\n' + out
open(os.path.join(ROOT, 'finacademy', 'core.js'), 'w').write(out)
print('built yc/assets/promo.js and finacademy/core.js')
