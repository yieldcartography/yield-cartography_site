#!/usr/bin/env python3
"""Build macro_radar_template_mc.html (one template, two countries, two languages) from Macro Radar 3.

Inputs next to this script: us_t3.html (macro_radar_template3.html), profile.js, notes.js, i18n_ui.js,
dict_pl.js, appendix.js, brand.html, brand.css. Every replacement is asserted, so a changed base fails loudly.
"""
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
rd = lambda f: open(os.path.join(HERE, f), encoding="utf-8").read()
BASE = next((p for p in [os.path.join(HERE, "us_t3.html"), os.path.join(HERE, "..", "..", "macro_radar_template3.html"), os.path.join(HERE, "..", "macro_radar_template3.html")] if os.path.exists(p)), None)
if not BASE: sys.exit("macro_radar_template3.html not found (expected two folders up)")
s = open(BASE, encoding="utf-8").read()

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        sys.exit("expected %d of %r, found %d" % (count, old[:90], n))
    s = s.replace(old, new)

def rep_re(pat, new, count=1, flags=0):
    global s
    s2, n = re.subn(pat, new, s, flags=flags)
    if n != count:
        sys.exit("expected %d of /%s/, found %d" % (count, pat[:90], n))
    s = s2

# ---- head, brand bar, header texts ----
rep("<title>Macro Radar 3: US macroeconomic dashboard</title>", "<title>Macro Radar · macrocartography</title>")
rep("</style>\n</head>", rd("brand.css") + rd("site.css") + rd("site_page.css") + "</style>\n</head>")
rep('<body class="light">\n', '<body class="light">\n<header class="mc-sh" id="mcHeader" data-notr="1"></header>\n' + rd("brand.html") + '<main class="mc-main">\n')
rep('<div class="fig-modal" id="figModal">', '<div id="view_about"></div>\n</main>\n<footer class="mc-sf" id="mcFooter" data-notr="1"></footer>\n\n<div class="fig-modal" id="figModal">')
rep('<span style="font-size:11px;color:var(--dim);font-weight:400;letter-spacing:1px;">by MARCIN DEC</span>', '<span class="mc-by" style="font-size:11px;color:var(--dim);font-weight:400;letter-spacing:1px;">by MARCIN DEC</span>')
rep('<span style="margin-left:auto;display:inline-flex;gap:8px;align-items:center;">\n    <label class="toggle"', '<span class="mc-ctl" style="margin-left:auto;display:inline-flex;gap:8px;align-items:center;">\n    <label class="toggle"')
rep('title="Click to edit; saved with the HTML snapshot">Macro Radar</span>', 'title="Click to edit; saved with the HTML snapshot">Macro Radar</span>')
rep_re(r'(<span id="subtitleText"[^>]*>)US macroeconomic radar from public FRED data:[^<]*(</span>)', r"\1\2")
rep('title="Where the numbers on this page come from. Green: today\'s file from yieldcartography.com. Amber:',
    'title="Where the numbers on this page come from. Green: today\'s published file. Amber:')
# static notes become [data-i18n] slots
rep_re(r'(<span id="instrText"[^>]*)>How to read:[^<]*</span>', r'\1 data-i18n="instr"></span>')
rep_re(r'<div class="note">Score = robust z signed by the indicator\'s polarity and by the dial direction[^<]*</div>', '<div class="note" data-i18n="mheat"></div>')
rep('<div class="note">Click a row to unfold its level, momentum and standing charts. Unscored display series (such as IC4WSA) and helper series are not listed.</div>', '<div class="note" data-i18n="members"></div>')
rep_re(r'<div class="note">Headline gauges in bold, their groups below them in grey\.[^<]*</div>', '<div class="note" data-i18n="fheat"></div>')
rep_re(r'<div class="note">Monthly means of the chosen series \(the fed funds rate.*?move the compass on the Radar tab as well\.</div>', '<div class="note" data-i18n="hist"></div>', flags=re.S)
rep_re(r'(<input id="fndQ" type="search") placeholder="[^"]*"', r'\1 placeholder=""')
rep_re(r'<div class="note" id="fndNote" style="margin-top:6px">[^<]*</div>', '<div class="note" id="fndNote" style="margin-top:6px" data-i18n="fnd"></div>')
rep_re(r'<div class="note">Click a row to unfold its level, momentum and standing charts, with the FRED description and link\.[^<]*</div>', '<div class="note" data-i18n="fndRes"></div>')
rep_re(r'<div class="note"><span id="chgNote"></span> Click a row[^<]*</div>', '<div class="note"><span id="chgNote"></span> <span data-i18n="chg"></span></div>')
rep_re(r'<div class="note">One row per published series\. Health compares[^<]*</div>', '<div class="note" data-i18n="health"></div>')
rep_re(r'<div class="selhint" id="hHint">[^<]*</div>', '<div class="selhint" id="hHint" data-i18n="hint"></div>')

# ---- script: profile, language, dictionaries ----
rep('const LIVE_URL = "https://yieldcartography.com/data/macro/macro_radar.json";\n', "")
rep('const esc = s => String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");\n',
    'const esc = s => String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");\n'
    + rd("dict_pl.js") + "\n" + rd("profile.js") + "\n" + rd("labels_pl.js") + "\n" + rd("notes.js") + "\n" + rd("i18n_ui.js") + "\n" + rd("site.js") + "\n" + rd("site_mode.js") + "\n")
# live file: try the addresses in order
rep("""    const r=await fetchWithTimeout(LIVE_URL, FETCH_TIMEOUT_MS);
    if(!r.ok) return {ok:false, why:"HTTP "+r.status};""",
"""    let r=null, why="";
    for(const u of liveURLs()){ try{ r=await fetchWithTimeout(u, FETCH_TIMEOUT_MS); if(r.ok){ LIVE_USED=u; break; } why="HTTP "+r.status; r=null; }catch(e){ why=(e&&e.name==="AbortError")?"no answer within "+(FETCH_TIMEOUT_MS/1000)+" s":"network error ("+(e&&e.message||e)+")"; r=null; } }
    if(!r) return {ok:false, why:why||"no address answered"};""")
rep('if(DEMO && !validateDoc(DEMO)) return {doc:DEMO, src:"demo"};',
    'if(DEMO && !validateDoc(DEMO) && String(DEMO.country||"us").toLowerCase()===MC_COUNTRY) return {doc:DEMO, src:"demo"};')
rep('if(SOURCE==="live") setStatus("ok","Live data from yieldcartography.com: "+describe(DATA)+hs+noScores);',
    'if(SOURCE==="live") setStatus("ok",TR("Live data from {0}: ",esc((LIVE_USED.match(/^https?:\\/\\/([^/]+)/)||[0,location.host||"this site"])[1]))+describe(DATA)+hs+noScores);')
rep('setStatus("err","No data: the live file could not be loaded"+(LIVE_NOTE?" ("+esc(LIVE_NOTE)+")":"")+" and this HTML file carries no saved copy.");',
    'setStatus("err",TR("No data: the live file could not be loaded")+(LIVE_NOTE?" ("+esc(LIVE_NOTE)+")":"")+TR(" and this HTML file carries no saved copy."));')
rep('const lbl=SOURCE==="snapshot"?"the copy saved in this snapshot":SOURCE==="demo"?"the demo data built into the template":"the copy saved in this file";',
    'const lbl=SOURCE==="snapshot"?TR("the copy saved in this snapshot"):SOURCE==="demo"?TR("the demo data built into the template"):TR("the copy saved in this file");')
rep('setStatus("warn","Showing "+lbl+": "+describe(DATA)+hs+noScores+(LIVE_NOTE?" &middot; live file not used: "+esc(LIVE_NOTE):""));',
    'setStatus("warn",TR("Showing {0}: ",lbl)+describe(DATA)+hs+noScores+(LIVE_NOTE?" &middot; "+TR("live file not used: ")+esc(TR(LIVE_NOTE)):""));')
rep('return "data as of <b>"+esc(asof)+"</b>, built "+esc(built)+", "+doc.counts.n_series+" series";',
    'return TR("data as of <b>{0}</b>, built {1}, {2} series",esc(asof),esc(built),doc.counts.n_series);')
rep('const hs=h?" &middot; series health: "+h.ok+" ok"+(h.overdue?", "+h.overdue+" overdue":"")+(h.stopped?", "+h.stopped+" stopped":"")+(h.failed?", "+h.failed+" failed":""):"";',
    'const hs=h?" &middot; "+TR("series health: {0} ok",h.ok)+(h.overdue?", "+TR("{0} overdue",h.overdue):"")+(h.stopped?", "+TR("{0} stopped",h.stopped):"")+(h.failed?", "+TR("{0} failed",h.failed):""):"";')
rep('const noScores=DATA.scores?"":" &middot; <b>indicator scores not yet published</b>";', 'const noScores=DATA.scores?"":" &middot; <b>"+TR("indicator scores not yet published")+"</b>";')

# ---- dial and zone names in the viewer's language ----
Z = {"contraction":"skurcz","soft":"słabo","trend":"trend","strong":"silnie"}
rep('title:"Economy", zones:[{a:0,b:30,n:"contraction",c:ZC.red},{a:30,b:45,n:"soft",c:ZC.amber},\n          {a:45,b:60,n:"trend",c:ZC.pale},{a:60,b:100,n:"strong",c:ZC.green}]',
    'title:TR("Economy"), zones:[{a:0,b:30,n:L({en:"contraction",pl:"skurcz"}),c:ZC.red},{a:30,b:45,n:L({en:"soft",pl:"słabo"}),c:ZC.amber},\n          {a:45,b:60,n:L({en:"trend",pl:"trend"}),c:ZC.pale},{a:60,b:100,n:L({en:"strong",pl:"silnie"}),c:ZC.green}]')
rep('title:"Policy stance", zones:[{a:0,b:35,n:"loose",c:ZC.blue},{a:35,b:65,n:"neutral",c:ZC.grey},\n          {a:65,b:100,n:"tight",c:ZC.red}]',
    'title:TR("Policy stance"), zones:[{a:0,b:35,n:L({en:"loose",pl:"łagodna"}),c:ZC.blue},{a:35,b:65,n:L({en:"neutral",pl:"neutralna"}),c:ZC.grey},\n          {a:65,b:100,n:L({en:"tight",pl:"restrykcyjna"}),c:ZC.red}]')
rep('title:"Financial conditions", zones:[{a:0,b:35,n:"easy",c:ZC.green},{a:35,b:65,n:"neutral",c:ZC.grey},\n          {a:65,b:100,n:"tight",c:ZC.red}]',
    'title:TR("Financial conditions"), zones:[{a:0,b:35,n:L({en:"easy",pl:"łagodne"}),c:ZC.green},{a:35,b:65,n:L({en:"neutral",pl:"neutralne"}),c:ZC.grey},\n          {a:65,b:100,n:L({en:"tight",pl:"restrykcyjne"}),c:ZC.red}]')
rep('title:"Price pressure", zones:[{a:0,b:35,n:"low",c:ZC.blue},{a:35,b:65,n:"normal",c:ZC.green},\n          {a:65,b:100,n:"high",c:ZC.red}]',
    'title:TR("Price pressure"), zones:[{a:0,b:35,n:L({en:"low",pl:"niska"}),c:ZC.blue},{a:35,b:65,n:L({en:"normal",pl:"normalna"}),c:ZC.green},\n          {a:65,b:100,n:L({en:"high",pl:"wysoka"}),c:ZC.red}]')
rep('title:"Recession risk", unit:"%", knots:[[0,0],[15,1/3],[30,2/3],[100,1]], ticks:[0,15,30,60,100], zones:[{a:0,b:15,n:"low",c:ZC.green},{a:15,b:30,n:"elevated",c:ZC.amber},{a:30,b:100,n:"high",c:ZC.red}]',
    'title:TR("Recession risk"), unit:"%", knots:[[0,0],[15,1/3],[30,2/3],[100,1]], ticks:[0,15,30,60,100], zones:[{a:0,b:15,n:L({en:"low",pl:"niskie"}),c:ZC.green},{a:15,b:30,n:L({en:"elevated",pl:"podwyższone"}),c:ZC.amber},{a:30,b:100,n:L({en:"high",pl:"wysokie"}),c:ZC.red}]')
rep('dFisc:{key:"fiscal", title:"Fiscal impulse", mini:true, lo:-3, hi:3, a0:180, a1:0, unit:"pp of GDP", dec:2, signed:true,\n          zones:[{a:-3,b:-0.5,n:"tightening",c:ZC.blue},{a:-0.5,b:0.5,n:"neutral",c:ZC.grey},{a:0.5,b:3,n:"loosening",c:ZC.amber}]',
    'dFisc:{key:"fiscal", title:TR("Fiscal impulse"), mini:true, lo:-3, hi:3, a0:180, a1:0, unit:TR("pp of GDP"), dec:2, signed:true,\n          zones:[{a:-3,b:-0.5,n:L({en:"tightening",pl:"zacieśnianie"}),c:ZC.blue},{a:-0.5,b:0.5,n:L({en:"neutral",pl:"neutralny"}),c:ZC.grey},{a:0.5,b:3,n:L({en:"loosening",pl:"luzowanie"}),c:ZC.amber}]')
rep('stress:{zones:[{a:0,b:35,n:"calm",c:ZC.green},{a:35,b:65,n:"normal",c:ZC.grey},{a:65,b:100,n:"stressed",c:ZC.red}]',
    'stress:{zones:[{a:0,b:35,n:L({en:"calm",pl:"spokój"}),c:ZC.green},{a:35,b:65,n:L({en:"normal",pl:"normalnie"}),c:ZC.grey},{a:65,b:100,n:L({en:"stressed",pl:"napięcie"}),c:ZC.red}]')
rep('const QUADS=[{n:"Overheating",', 'const QUADS=[{n:TR("Overheating"),')
rep('{n:"Stagflation",a:90', '{n:TR("Stagflation"),a:90')
rep('{n:"Slowdown",a:180', '{n:TR("Slowdown"),a:180')
rep('{n:"Goldilocks",a:270', '{n:TR("Goldilocks"),a:270')
rep('const SAHM_CFG={title:"Sahm rule", zones:[{a:-9,b:0.3,n:"quiet",c:ZC.green},{a:0.3,b:0.5,n:"rising",c:ZC.amber},{a:0.5,b:99,n:"triggered",c:ZC.red}]};',
    'const SAHM_CFG={title:TR("Sahm rule"), zones:[{a:-9,b:0.3,n:L({en:"quiet",pl:"spokój"}),c:ZC.green},{a:0.3,b:0.5,n:L({en:"rising",pl:"wzrost"}),c:ZC.amber},{a:0.5,b:99,n:L({en:"triggered",pl:"wyzwolona"}),c:ZC.red}]};')
for k in ['"Economy and activity groups (output, labor, consumer, housing)"', '"Policy stance and policy group"', '"Financial conditions and credit group"',
          '"Price pressure and inflation group"', '"Markets and financial stress group"', '"Recession risk, %"', '"Fiscal impulse, pp of GDP"']:
    rep("n:" + k + ",", "n:TR(" + k + "),")
rep('const H_KEYS=[["economy","Economy"],["policy","Policy stance"],["conditions","Financial conditions"],["prices","Price pressure"]];',
    'const H_KEYS=[["economy",TR("Economy")],["policy",TR("Policy stance")],["conditions",TR("Financial conditions")],["prices",TR("Price pressure")]];')
rep('const TABS=[["radar","Radar",false],["history","History",false],["finder","Finder",false],["latest","Latest",true],["health","Data health",true],\n            ["assum","Assumptions",true],["app","Technical appendix",true]];',
    'const TABS=[["radar",TR("Radar"),false],["history",TR("History"),false],["finder",TR("Finder"),false],["latest",TR("Latest"),true],["health",TR("Data health"),true],\n            ["assum",TR("Assumptions"),true],["app",TR("Technical appendix"),true]];')
rep_re(r'const TF_NAME = \{(.*?)\};', lambda m: "const TF_NAME = Object.fromEntries(Object.entries({" + m.group(1) + "}).map(([k,v])=>[k,TR(v)]));", flags=re.S)
rep('const monthTxt = d => { if(!d) return "–"; const [y,m]=d.split("-"); return ["Jan",',
    'const MONTHS_PL=["sty","lut","mar","kwi","maj","cze","lip","sie","wrz","paź","lis","gru"];\nconst monthTxt = d => { if(!d) return "–"; const [y,m]=d.split("-"); if(LANG==="pl") return MONTHS_PL[+m-1]+" "+y; return ["Jan",')
rep('const sLabel = id => (DATA&&DATA.series&&DATA.series[id]&&DATA.series[id].label)||id;',
    'const sLabel = id => (LANG==="pl"&&PL_LABELS[id])||(DATA&&DATA.series&&DATA.series[id]&&DATA.series[id].label)||id;')
rep('function gName(g){ if(String(g)==="F") return "Fiscal impulse"; if(String(g)==="6") return "Monetary policy"; const G=((DATA&&DATA.groups)||[]).find(x=>String(x.id)===String(g)); return G?G.name:"Group "+g; }',
    'function gName(g){ if(String(g)==="F") return TR("Fiscal impulse"); if(String(g)==="6") return TR("Monetary policy"); const G=((DATA&&DATA.groups)||[]).find(x=>String(x.id)===String(g)); return G?TR(G.name):TR("Group {0}",g); }')

# ---- country-specific code paths ----
rep_re(r'const HIST_FROM = "1980-01-01";[^\n]*', 'const HIST_FROM = CP.histFrom;')
rep_re(r'const REC_PARTS=\[\{k:"piger".*?\];', 'const REC_PARTS=CP.recParts.map(x=>({k:x.k, n:L(x.n), carry:x.carry}));')
rep_re(r'const REC=\[\{k:"piger".*?ahead:12\}\];', 'const REC=CP.rec.map(x=>Object.assign({},x,{n:L(x.n), refs:x.refs.map(r=>({v:r.v,l:TR(r.l)}))}));', flags=re.S)
rep('g+=`<text x="${W-4}" y="${H-4}" text-anchor="end" font-size="8" fill="var(--muted)">Shaded: NBER recessions. Probabilities as published on FRED, the probit from GS10 and TB3MS. Since 2000.</text>`;',
    'g+=`<text x="${W-4}" y="${H-4}" text-anchor="end" font-size="8" fill="var(--muted)">${esc(L(CP.recFoot))}</text>`;')
rep("const s=DATA&&DATA.series&&DATA.series.USREC; if(!s) return [];", "const s=CP.recShade&&DATA&&DATA.series&&DATA.series.USREC; if(!s) return [];")
rep("<th class='l' title='FRED series id'>Id</th><th class='l'>Series</th><th class='l'>Group</th><th class='l' title='new print, revision, or recent print'>Kind</th>",
    "<th class='l' title='\"+esc(cap(L(CP.idTitle)))+\"'>Id</th><th class='l'>Series</th><th class='l'>Group</th><th class='l' title='new print, revision, or recent print'>Kind</th>")
rep('target="_blank" rel="noopener">FRED page &#8599;</a></div></td></tr>`;', 'target="_blank" rel="noopener">${esc(cap(L(CP.srcPage)))} &#8599;</a></div></td></tr>`;')
rep('const rows=[["FRED title",esc(s.fred_title)]', 'const rows=[[cap(L(CP.fullTitle)),esc(s.fred_title)]')
rep('["Citation",esc(s.citation)],["FRED page",`<a href=', '["Citation",esc(s.citation)],[cap(L(CP.srcPage)),`<a href=')
rep_re(r'const REC_IDS=\[\{id:"RECPROUSM156N".*?j:-1\}\];', 'const REC_IDS=CP.recIds.map(x=>Object.assign({},x,{n:L(x.n)}));', flags=re.S)
rep('rec:{parts:{piger:true,hamilton:true,curve_probit:true}, method:"mean"}', 'rec:{parts:Object.assign({},CP.recDefault), method:"mean"}')
rep_re(r'const RP=\[\["piger".*?\]\];', 'const RP=CP.recRP.map(([k,n])=>[k,L(n)]);')
rep('+`<div class="note" style="margin-top:6px">Each part is carried forward until its next print (Piger and the curve up to 3 months, Hamilton up to 9). At least two parts must have a reading, or one if only one is ticked. The Sahm rule stays a flag and is never combined.</div>`;',
    '+`<div class="note" style="margin-top:6px">${L(CP.recAssumNote)}</div>`;')
rep('<div class="b">FRED pre-approval series</div></div>`;', '<div class="b">${esc(L(CP.notPub))}</div></div>`;')
rep("let h=\"<tr><th class='l' title='FRED series id'>Id</th>", "let h=\"<tr><th class='l' title='\"+esc(cap(L(CP.idTitle)))+\"'>Id</th>")
rep("<th title='Latest observation, FRED period date (monthly = first of month)'>Last obs</th>", "<th title='\"+esc(L(CP.lastObsTitle))+\"'>Last obs</th>")
rep("<th class='l' title='FRED rights: public = public domain, cite = citation required'>Rights</th><th class='l' title='Citation as FRED recommends it, with the retrieval date'>Citation</th>",
    "<th class='l' title='\"+esc(L(CP.rightsTitle))+\"'>Rights</th><th class='l' title='\"+esc(L(CP.citeTitle))+\"'>Citation</th>")
rep('const HIST_DEFAULT_IDS=["FEDFUNDS","DGS3MO","DGS2","DGS5","DGS10","DGS30"];', 'const HIST_DEFAULT_IDS=CP.histDefault;')
rep('state.hist={ids:have.length?have:["DGS10"],', 'state.hist={ids:have.length?have:[CP.histFallback],')
rep('<button class="xall" id="histReset" title="Back to the fed funds rate and the Treasury curve">default set</button>',
    '<button class="xall" id="histReset" title="${esc(TR("Back to {0}",L(CP.histDefaultTxt)))}">${TR("default set")}</button>')
# the Polish template's wrapping legend (long Polish labels)
rep('let lx=pl+6; series.forEach(s=>{ const t=`${s.M.label}${s.right?" (right)":""}`; g+=`<rect x="${lx}" y="${pt+5}" width="10" height="3" fill="${s.col}"/><text x="${lx+13}" y="${pt+9}" font-size="8.5" fill="var(--text)">${esc(t)}</text>`; lx+=13+t.length*5+12; });',
    'let lx=pl+6, ly=pt+5; series.forEach(s=>{ const tx=`${s.M.label}${s.right?" "+TR("(right)"):""}`, wdt=13+tx.length*5+12; if(lx>pl+6&&lx+wdt>W-pr){ lx=pl+6; ly+=11; } g+=`<rect x="${lx}" y="${ly}" width="10" height="3" fill="${s.col}"/><text x="${lx+13}" y="${ly+4}" font-size="8.5" fill="var(--text)">${esc(tx)}</text>`; lx+=wdt; });')


# ---- fiscal part of the policy stance, per country ----
rep("el.innerHTML=`Minus the 12-month change in the federal deficit as a share of GDP. Below zero: the deficit is shrinking, a drag on demand. Above zero: a stimulus.`; return; }",
    "el.innerHTML=esc(L(CP.fiscMover)); return; }")
rep('if(String(g)==="F") return ser.MTSDS133FMS&&fiscGroup()?["MTSDS133FMS"]:[];', 'if(String(g)==="F") return ser[CP.fiscId]&&fiscGroup()?[CP.fiscId]:[];')
rep('if(id==="MTSDS133FMS"){ const F=fiscGroup(); return F?F.map:{}; }', 'if(id===CP.fiscId){ const F=fiscGroup(); return F?F.map:{}; }')
rep('if(id==="MTSDS133FMS"&&fiscGroup()&&(effHeadW().policy||{}).F>0) return {k:"policy", n:"Policy stance (fiscal impulse)", g:"F"};',
    'if(id===CP.fiscId&&fiscGroup()&&(effHeadW().policy||{}).F>0) return {k:"policy", n:TR("Policy stance (fiscal impulse)"), g:"F"};')
rep('const hay=[i,s.label,s.fred_title,gName(s.group),s.units,s.source,ga?ga.n:""]', 'const hay=[i,s.label,s.label_en,s.fred_title,gName(s.group),s.units,s.units_en,s.source,ga?ga.n:""]')
rep('${esc(isF?"Fiscal impulse":gName(s.group))}', '${esc(isF?TR("Fiscal impulse"):gName(s.group))}')
rep('const what= key==="recession"?"3 probabilities averaged, Sahm rule as a flag": key==="fiscal"?"1 series: the monthly federal surplus or deficit":`${M.length} indicators in ${ng} group${ng>1?"s":""}`;',
    'const what= key==="recession"?L(CP.recWhat): key==="fiscal"?L(CP.fiscWhat):`${M.length} indicators in ${ng} group${ng>1?"s":""}`;')
rep(': key==="fiscal"?"Minus the 12-month change in the 12-month federal deficit as a share of GDP."', ': key==="fiscal"?esc(L(CP.fiscNote))')
rep('const list= key==="fiscal"?[{id:"MTSDS133FMS",n:sLabel("MTSDS133FMS"),k:null}]:REC_IDS;', 'const list= key==="fiscal"?[{id:CP.fiscBase,n:sLabel(CP.fiscBase),k:null}]:REC_IDS;')
rep('let inG= key==="fiscal"?"12-month sum as % of GDP, minus its change over 12 months":', 'let inG= key==="fiscal"?L(CP.fiscInG):')
rep('${cfg.unit&&cfg.unit!=="pp of GDP"?" "+cfg.unit:""} &middot;', '${cfg.unit&&cfg.key!=="fiscal"?" "+cfg.unit:""} &middot;')
rep('${c.unit&&c.unit!=="pp of GDP"?" "+c.unit:""}', '${c.unit&&c.key!=="fiscal"?" "+c.unit:""}')
rep('unit:cfg.signed?"pp of GDP, + = loosening":"gauge, 0-100"', 'unit:cfg.signed?TR("pp of GDP, + = loosening"):TR("gauge, 0-100")')
rep('el.title=`${name}: ${f(cur)}${fisc?" pp of GDP":""} (${z.n}), ${monthTxt(o.d[n-1])}${live}. Click to open ${fisc?"the fiscal detail":"this group\'s members"}; click again to close.`;',
    'el.title=LANG==="pl"?`${name}: ${f(cur)}${fisc?" pkt proc. PKB":""} (${z.n}), ${monthTxt(o.d[n-1])}${live}. Kliknij, aby otworzyć ${fisc?"szczegóły fiskalne":"członków grupy"}; kliknij ponownie, aby zamknąć.`:`${name}: ${f(cur)}${fisc?" pp of GDP":""} (${z.n}), ${monthTxt(o.d[n-1])}${live}. Click to open ${fisc?"the fiscal detail":"this group\'s members"}; click again to close.`;')
# unfolded rows: frequency and labels in the viewer's language
rep('&middot; ${esc(s.freq)}`\n    +(tf?` &middot; scored as ${esc(TF_NAME[tf]||tf)}`:"")+` &middot; polarity ${(+s.polarity||1)>0?"+1":"-1"}`',
    '&middot; ${esc(TR(s.freq))}`\n    +(tf?` &middot; ${TR("scored as")} ${esc(TF_NAME[tf]||tf)}`:"")+` &middot; ${TR("polarity")} ${(+s.polarity||1)>0?"+1":"-1"}`')
# data in the viewer's language; snapshots keep the source's wording and the untranslated page
rep('  if(local){ DATA=local.doc; SOURCE=local.src; }', '  if(local){ DATA=prepareData(local.doc); SOURCE=local.src; }')
rep('if(live.ok && acceptLive(live.doc, DATA)){ DATA=live.doc; SOURCE="live"; LIVE_NOTE=""; }', 'if(live.ok && acceptLive(live.doc, DATA)){ DATA=prepareData(live.doc); SOURCE="live"; LIVE_NOTE=""; }')
rep('data:(SOURCE==="live"||SOURCE==="snapshot")?DATA:null};\n  let html="<!DOCTYPE html>\\n"+document.documentElement.outerHTML;',
    'data:(SOURCE==="live"||SOURCE==="snapshot")?sourceCopy(DATA):null};\n  let html=PRISTINE_HTML;')
rep('"use strict";\n', '"use strict";\n// the page as it arrived, before any rendering or translation: snapshots are built from it\nconst PRISTINE_HTML = "<!DOCTYPE html>\\n"+document.documentElement.outerHTML;\n')

rep('svgToPNGBlob(el,2,FIGS[fig]&&FIGS[fig].title)', 'svgToPNGBlob(el,2,FIGS[fig]&&trTitle(FIGS[fig].title))')
rep('const b=await svgToPNGBlob(el,2,FIGS[k].title);', 'const b=await svgToPNGBlob(el,2,trTitle(FIGS[k].title));')
rep('function openModal(k){ _modalFig=k; $("figModalTitle").textContent=FIGS[k].title;', 'function openModal(k){ _modalFig=k; $("figModalTitle").textContent=trTitle(FIGS[k].title);')
rep('${fisc?`<span class="gl-unit">pp</span>`:""}', '${fisc?`<span class="gl-unit">${LANG==="pl"?"pkt proc.":"pp"}</span>`:""}')
rep('<span class="gl-d">${arr} ${AM}m ${d===null', '<span class="gl-d">${arr} ${AM}${LANG==="pl"?" mies.":"m"} ${d===null')
rep('text-anchor="middle" font-size="8" font-weight="700" fill="var(--text)">${esc(z.n)}</text>`', 'text-anchor="middle" font-size="${String(z.n).length>10?6.6:8}" font-weight="700" fill="var(--text)">${esc(z.n)}</text>`')
rep("""out[m.id]={c:m.w*mW(m.id)*v/n[m.g], s:v, w:m.w*mW(m.id)/n[m.g], g:m.g}; });
  return out;""", """out[m.id]={c:m.w*mW(m.id)*v/n[m.g], s:v, w:m.w*mW(m.id)/n[m.g], g:m.g}; });
  // a part without a reading this month (the fiscal impulse after its carry runs out) leaves the gauge: the others are re-weighted, as in computeEff
  const pres={}; Object.values(out).forEach(o=>pres[o.g]=1); const tot=headSpec(key).filter(([g])=>pres[g]).reduce((a,[g,w])=>a+w,0);
  if(tot>0&&Math.abs(tot-1)>1e-9) Object.values(out).forEach(o=>{ o.c/=tot; o.w/=tot; });
  return out;""")
# ---- technical appendix: bilingual, country-aware ----
rep_re(r'const TF_FORMULA=\{level:"x = value as published".*?\};\n', '', flags=re.S)
APPX = rd("appendix.js") + "\n\n// ---------------- figures registry"
rep_re(r'function renderApp\(\)\{.*?\n\}\n\n// ---------------- figures registry', lambda m: APPX, flags=re.S)

rep("function buildTabs(){\n  const t=$(\"tabs\"); t.innerHTML=\"\";",
    "function buildTabs(){\n  if(MC_SITE_MODE){ if(!SITE_VIEWS.includes(state.view)) state.view=\"radar\"; siteNav();\n    TABS.map(x=>x[0]).concat([\"about\"]).forEach(k=>{ const v=$(\"view_\"+k); if(v) v.style.display=(k===state.view)?\"\":\"none\"; }); return; }\n  const t=$(\"tabs\"); t.innerHTML=\"\";")
# ---- snapshot, start-up ----
rep('assume:ASSUME, hist:state.hist||null,', 'assume:ASSUME, lang:LANG, country:MC_COUNTRY, hist:state.hist||null,')
rep('  if(s.state.title!==undefined) $("titleText").innerHTML=s.state.title;\n  if(s.state.subtitle!==undefined) $("subtitleText").innerHTML=s.state.subtitle;\n  if(s.state.instructions!==undefined) $("instrText").innerHTML=s.state.instructions;',
    '  const sameLang=(s.state.lang||"en")===LANG;   // edited texts come back only in the language they were written in\n  if(sameLang&&s.state.title!==undefined) $("titleText").innerHTML=s.state.title;\n  if(sameLang&&s.state.subtitle!==undefined) $("subtitleText").innerHTML=s.state.subtitle;\n  if(sameLang&&s.state.instructions!==undefined) $("instrText").innerHTML=s.state.instructions;')
rep("async function init(){\n  restoreFromSavedState();",
    "async function init(){\n  document.title=L(CP.docTitle); $(\"titleText\").textContent=L(CP.title); $(\"subtitleText\").textContent=L(CP.subtitle);\n  fillNotes(); $(\"fndQ\").placeholder=L(CP.findPh);\n  startTranslator();\n  restoreFromSavedState(); restoreKeptState(); siteInit(); buildBrand();")
rep('window.__MR__={computeEff,', 'window.__MR__={get LANG(){return LANG;}, MC_COUNTRY, CP, TR, trString, liveURLs, pageURL, computeEff,')
rep('window.__MR__={get LANG(){return LANG;},', 'window.__MR__={MC_SITE_MODE, get LANG(){return LANG;},')
rep('const fmt = (x,d=1) =>', 'const cap = s => s?String(s)[0].toUpperCase()+String(s).slice(1):s;\nconst fmt = (x,d=1) =>')

out = os.path.join(os.path.dirname(HERE) if os.path.basename(HERE) == "src" else HERE, "macro_radar_template_mc.html")
open(out, "w", encoding="utf-8").write(s)
print("wrote", out, len(s.splitlines()), "lines")

# ---- the landing page: the same site shell, inlined ----
land = rd("landing_src.html")
for mark, part in (("/*__SITE_CSS__*/", rd("site.css")), ("/*__SITE_JS__*/", rd("site.js"))):
    if land.count(mark) != 1:
        sys.exit("landing_src.html must carry %s once" % mark)
    land = land.replace(mark, part)
lout = os.path.join(os.path.dirname(out), "landing.html")
open(lout, "w", encoding="utf-8").write(land)
print("wrote", lout)
