// ---------------- country profile and language (macrocartography) ----------------
// One template serves both radars. The country is fixed when the page is built (/*__MC_COUNTRY__*/ below,
// set by build_site.py or the generator), the language is the viewer's choice and is independent of it:
// ?lang=en|pl in the address wins, then the last choice remembered in this browser, then the browser's language.
// a standalone file from the generator carries its data inside: its country field then decides (PL file -> Polish radar)
const MC_COUNTRY = (()=>{ const mk=(/*__MC_COUNTRY__*/"us"); try{ const c=(typeof EMBED!=="undefined"&&EMBED&&EMBED.country)||(window.__SAVED_STATE__&&window.__SAVED_STATE__.state&&window.__SAVED_STATE__.state.country); if(c&&["us","pl"].includes(String(c).toLowerCase())) return String(c).toLowerCase(); }catch(e){} return mk; })();
const MC_SITE = "https://macrocartography.com";
const LANGS = ["en","pl"];
function detectLang(){
  let q=null; try{ q=new URLSearchParams(location.search).get("lang"); }catch(e){}
  if(q&&LANGS.includes(q)){ try{ localStorage.setItem("mc_lang",q); }catch(e){} return q; }
  try{ const s=localStorage.getItem("mc_lang"); if(LANGS.includes(s)) return s; }catch(e){}
  try{ const sv=window.__SAVED_STATE__&&window.__SAVED_STATE__.state&&window.__SAVED_STATE__.state.lang; if(LANGS.includes(sv)) return sv; }catch(e){}
  const n=String((typeof navigator!=="undefined"&&(navigator.language||(navigator.languages||[])[0]))||"").toLowerCase();
  return n.startsWith("pl")?"pl":"en";
}
let LANG = detectLang();
// pick the variant of a {en, pl} pair; plain strings pass through
const L = o => (o&&typeof o==="object"&&!Array.isArray(o)&&("en" in o))?(o[LANG]!==undefined?o[LANG]:o.en):o;
// translate an English UI string; {0}, {1} ... are filled after translation
function TR(s,...a){ let r=(LANG==="pl"&&typeof PL_DICT!=="undefined"&&PL_DICT[s]!==undefined)?PL_DICT[s]:s; a.forEach((v,i)=>{ r=r.split("{"+i+"}").join(String(v)); }); return r; }
const plural = (n,one,many) => (LANG==="pl") ? (n===1?one.pl:((n%10>=2&&n%10<=4&&(n%100<10||n%100>=20))?many.pl2||many.pl:many.pl)) : (n===1?one.en:many.en);

const PROFILES = {
  us:{ code:"us", flag:"us",
    name:{en:"United States", pl:"Stany Zjednoczone"},
    title:{en:"Macro Radar · United States", pl:"Macro Radar · Stany Zjednoczone"},
    docTitle:{en:"Macro Radar: US macroeconomic dashboard · macrocartography", pl:"Macro Radar: makroekonomiczny pulpit USA · macrocartography"},
    subtitle:{en:"US macroeconomic radar from public FRED data: five headline gauges with their groups (policy stance including the fiscal impulse) and about 130 published series, refreshed every weekday.",
              pl:"Makroekonomiczny radar USA z publicznych danych FRED: pięć wskaźników głównych z ich grupami (nastawienie polityki z impulsem fiskalnym) i około 130 publikowanych szeregów, odświeżanych w każdy dzień roboczy."},
    data:"us.json", legacy:"https://yieldcartography.com/data/macro/macro_radar.json",
    histFrom:"1980-01-01", pctSince:"1990",
    recParts:[{k:"piger",n:{en:"Chauvet and Piger",pl:"Chauvet i Piger"},carry:3},{k:"hamilton",n:{en:"Hamilton GDP-based",pl:"Hamilton (na podstawie PKB)"},carry:9},{k:"curve_probit",n:{en:"NY Fed yield curve, 12 months ahead",pl:"krzywa rentowności NY Fed, 12 miesięcy naprzód"},carry:3}],
    recDefault:{piger:true,hamilton:true,curve_probit:true},
    rec:[{k:"piger",n:{en:"Smoothed recession probability (Chauvet and Piger)",pl:"Wygładzone prawdopodobieństwo recesji (Chauvet i Piger)"},u:"%",lo:0,hi:100,dec:1,refs:[]},
         {k:"hamilton",n:{en:"GDP-based recession indicator (Hamilton)",pl:"Wskaźnik recesji oparty na PKB (Hamilton)"},u:"%",lo:0,hi:100,dec:1,refs:[]},
         {k:"sahm",n:{en:"Sahm rule real-time indicator",pl:"Reguła Sahm w czasie rzeczywistym"},u:"pp",dec:2,refs:[{v:0.5,l:"0.50 trigger"}]},
         {k:"curve_probit",n:{en:"Yield-curve probit, 12 months ahead (NY Fed model)",pl:"Probit krzywej rentowności, 12 miesięcy naprzód (model NY Fed)"},u:"%",lo:0,hi:100,dec:1,refs:[],ahead:12}],
    recIds:[{id:"RECPROUSM156N",k:"piger",n:{en:"Chauvet and Piger smoothed probability",pl:"Wygładzone prawdopodobieństwo Chauveta i Pigera"},j:0},{id:"JHGDPBRINDX",k:"hamilton",n:{en:"Hamilton GDP-based indicator",pl:"Wskaźnik Hamiltona oparty na PKB"},j:1},
            {id:null,k:"curve_probit",n:{en:"NY Fed yield-curve probit, 12 months ahead (from GS10 and TB3MS)",pl:"Probit krzywej rentowności NY Fed, 12 miesięcy naprzód (z GS10 i TB3MS)"},j:2},{id:"SAHMREALTIME",k:"sahm",n:{en:"Sahm rule, real time (flag, not averaged)",pl:"Reguła Sahm w czasie rzeczywistym (flaga, nieuśredniana)"},j:-1}],
    recRP:[["piger",{en:"Chauvet and Piger smoothed probability (RECPROUSM156N)",pl:"Wygładzone prawdopodobieństwo Chauveta i Pigera (RECPROUSM156N)"}],["hamilton",{en:"Hamilton GDP-based indicator (JHGDPBRINDX)",pl:"Wskaźnik Hamiltona oparty na PKB (JHGDPBRINDX)"}],["curve_probit",{en:"NY Fed yield-curve probit, 12 months ahead",pl:"Probit krzywej rentowności NY Fed, 12 miesięcy naprzód"}]],
    recAssumNote:{en:"Each part is carried forward until its next print (Piger and the curve up to 3 months, Hamilton up to 9). At least two parts must have a reading, or one if only one is ticked. The Sahm rule stays a flag and is never combined.",
                  pl:"Każda składowa jest przenoszona do następnego odczytu (Piger i krzywa do 3 miesięcy, Hamilton do 9). Odczyt muszą mieć co najmniej dwie składowe albo jedna, jeśli zaznaczona jest tylko jedna. Reguła Sahm pozostaje flagą i nigdy nie jest łączona."},
    recFoot:{en:"Shaded: NBER recessions. Probabilities as published on FRED, the probit from GS10 and TB3MS. Since 2000.", pl:"Zacieniowane: recesje według NBER. Prawdopodobieństwa jak publikowane w FRED, probit z GS10 i TB3MS. Od 2000 r."},
    recShade:true,
    histDefault:["FEDFUNDS","DGS3MO","DGS2","DGS5","DGS10","DGS30"], histFallback:"DGS10",
    histDefaultTxt:{en:"the fed funds rate and the Treasury curve", pl:"stopa fed funds i krzywa obligacji skarbowych USA"},
    srcPage:{en:"FRED page", pl:"strona FRED"}, idTitle:{en:"FRED series id", pl:"identyfikator szeregu w FRED"}, fullTitle:{en:"FRED title", pl:"tytuł w FRED"},
    findPh:{en:"Name, FRED id, group or units, e.g. treasury, CPI, housing, PAYEMS", pl:"Nazwa, identyfikator FRED, grupa lub jednostki, np. stopa, CPI, mieszkania, PAYEMS"},
    findDesc:{en:"FRED description", pl:"opis z FRED"},
    healthNote:{en:"Rights follow each series' FRED page; the five pre-approval series are never published.", pl:"Prawa wynikają ze strony każdego szeregu w FRED; pięć szeregów wymagających zgody właściciela nigdy nie jest publikowanych."},
    notPub:{en:"FRED pre-approval series", pl:"szeregi FRED wymagające zgody"},
    lastObsTitle:{en:"Latest observation, FRED period date (monthly = first of month)", pl:"Ostatnia obserwacja, data okresu w FRED (miesięczne = pierwszy dzień miesiąca)"},
    rightsTitle:{en:"FRED rights: public = public domain, cite = citation required", pl:"Prawa FRED: public = domena publiczna, cite = wymagane cytowanie"},
    citeTitle:{en:"Citation as FRED recommends it, with the retrieval date", pl:"Cytowanie zalecane przez FRED, z datą pobrania"},
    fiscId:"MTSDS133FMS", fiscBase:"MTSDS133FMS", fiscVirtual:false,
    fiscWhat:{en:"1 series: the monthly federal surplus or deficit", pl:"1 szereg: miesięczna nadwyżka lub deficyt federalny"},
    fiscNote:{en:"Minus the 12-month change in the 12-month federal deficit as a share of GDP.", pl:"Minus 12-miesięczna zmiana 12-miesięcznego deficytu federalnego w relacji do PKB."},
    fiscInG:{en:"12-month sum as % of GDP, minus its change over 12 months", pl:"suma 12-miesięczna w % PKB, minus jej zmiana w ciągu 12 miesięcy"},
    fiscMover:{en:"Minus the 12-month change in the federal deficit as a share of GDP. Below zero: the deficit is shrinking, a drag on demand. Above zero: a stimulus.",
               pl:"Minus 12-miesięczna zmiana deficytu federalnego w relacji do PKB. Poniżej zera: deficyt maleje, co hamuje popyt. Powyżej zera: bodziec."},
    recWhat:{en:"3 probabilities averaged, Sahm rule as a flag", pl:"3 prawdopodobieństwa uśrednione, reguła Sahm jako flaga"},
    srcHost:"FRED"
  },
  pl:{ code:"pl", flag:"pl",
    name:{en:"Poland", pl:"Polska"},
    title:{en:"Macro Radar · Poland", pl:"Macro Radar · Polska"},
    docTitle:{en:"Macro Radar: Polish macroeconomic dashboard · macrocartography", pl:"Macro Radar: makroekonomiczny pulpit Polski · macrocartography"},
    subtitle:{en:"Polish macroeconomic radar from Eurostat, Statistics Poland (GUS), NBP, the Ministry of Finance, BIS, ECB, OECD, GPW and YieldCartography's own Polish curve data: five headline gauges with their groups (policy stance including the fiscal impulse) and about 120 published series, refreshed every weekday.",
              pl:"Makroekonomiczny radar Polski z danych Eurostatu, GUS, NBP, Ministerstwa Finansów, BIS, EBC, OECD, GPW i własnych danych YieldCartography o polskiej krzywej: pięć wskaźników głównych z ich grupami (nastawienie polityki z impulsem fiskalnym) i około 120 publikowanych szeregów, odświeżanych w każdy dzień roboczy."},
    data:"pl.json", legacy:"https://yieldcartography.com/data/macro/macro_radar_pl.json",
    histFrom:"1996-01-01", pctSince:null,
    recParts:[{k:"curve_probit",n:{en:"Yield-curve probit on the Polish curve, 12 months ahead (indicative)",pl:"Probit krzywej rentowności na polskiej krzywej, 12 miesięcy naprzód (orientacyjny)"},carry:3}],
    recDefault:{curve_probit:true},
    rec:[{k:"sahm",n:{en:"Sahm rule on the LFS unemployment rate (SA)",pl:"Reguła Sahm na stopie bezrobocia BAEL (wyrównanej sezonowo)"},u:"pp",dec:2,refs:[{v:0.5,l:"0.50 trigger"}]},
         {k:"curve_probit",n:{en:"Yield-curve probit on the Polish curve, 12 months ahead (NY Fed coefficients, indicative)",pl:"Probit krzywej rentowności na polskiej krzywej, 12 miesięcy naprzód (współczynniki NY Fed, orientacyjny)"},u:"%",lo:0,hi:100,dec:1,refs:[],ahead:12}],
    recIds:[{id:null,k:"curve_probit",n:{en:"Yield-curve probit, 12 months ahead, indicative (POLGB 10y minus WIBOR 3M, NY Fed coefficients)",pl:"Probit krzywej rentowności, 12 miesięcy naprzód, orientacyjny (POLGB 10L minus WIBOR 3M, współczynniki NY Fed)"},j:0},{id:null,k:"sahm",n:{en:"Sahm rule on the LFS unemployment rate (flag, not averaged)",pl:"Reguła Sahm na stopie bezrobocia BAEL (flaga, nieuśredniana)"},j:-1}],
    recRP:[["curve_probit",{en:"Yield-curve probit on the Polish curve, 12 months ahead (indicative)",pl:"Probit krzywej rentowności na polskiej krzywej, 12 miesięcy naprzód (orientacyjny)"}]],
    recAssumNote:{en:"Poland has no official recession dating and no Chauvet-Piger or Hamilton counterpart, so the recession dial is the yield-curve probit alone (carried up to 3 months), with the New York Fed coefficients applied to the Polish curve: read its direction rather than its level. The Sahm rule on the LFS unemployment rate stays a flag and is never combined.",
                  pl:"Polska nie ma oficjalnego datowania recesji ani odpowiednika wskaźników Chauveta-Pigera czy Hamiltona, więc wskaźnik recesji to sam probit krzywej rentowności (przenoszony do 3 miesięcy) ze współczynnikami Fed z Nowego Jorku zastosowanymi do polskiej krzywej: ważniejszy jest jego kierunek niż poziom. Reguła Sahm na stopie bezrobocia BAEL pozostaje flagą i nigdy nie jest łączona."},
    recFoot:{en:"No official recession dating for Poland. The probit applies the NY Fed coefficients to the Polish curve (POLGB 10y minus WIBOR 3M), indicative. Since 2000.", pl:"Brak oficjalnego datowania recesji dla Polski. Probit stosuje współczynniki NY Fed do polskiej krzywej (POLGB 10L minus WIBOR 3M), orientacyjnie. Od 2000 r."},
    recShade:false,
    histDefault:["PL_NBP_REF","PL_WIBOR3M","PL_YC_2Y","PL_YC_5Y","PL_YC_10Y"], histFallback:"PL_YC_10Y",
    histDefaultTxt:{en:"the NBP reference rate, WIBOR 3M and the POLGB 2-, 5- and 10-year yields", pl:"stopa referencyjna NBP, WIBOR 3M i rentowności POLGB 2-, 5- i 10-letnie"},
    srcPage:{en:"Source page", pl:"strona źródła"}, idTitle:{en:"Registry series id", pl:"identyfikator szeregu w rejestrze"}, fullTitle:{en:"Full title", pl:"pełny tytuł"},
    findPh:{en:"Name, series id, group or units, e.g. HICP, WIBOR, housing, PL_GUS", pl:"Nazwa, identyfikator, grupa lub jednostki, np. HICP, WIBOR, mieszkania, PL_GUS"},
    findDesc:{en:"source description", pl:"opis ze źródła"},
    healthNote:{en:"Rights follow each source's terms (Eurostat, GUS and the ECB reuse with attribution, BIS and OECD terms of use, NBP, the Ministry of Finance, GPW, YieldCartography own data).", pl:"Prawa wynikają z warunków każdego źródła (Eurostat, GUS i EBC: ponowne wykorzystanie z podaniem źródła; BIS i OECD: warunki korzystania; NBP, Ministerstwo Finansów, GPW, YieldCartography: dane własne)."},
    notPub:{en:"registry rows without data yet", pl:"wiersze rejestru jeszcze bez danych"},
    lastObsTitle:{en:"Latest observation, period start date (monthly = first of month, quarterly = first month of the quarter)", pl:"Ostatnia obserwacja, data początku okresu (miesięczne = pierwszy dzień miesiąca, kwartalne = pierwszy miesiąc kwartału)"},
    rightsTitle:{en:"Rights: public = reuse with attribution or own data, cite = terms of use with citation", pl:"Prawa: public = ponowne wykorzystanie z podaniem źródła lub dane własne, cite = warunki korzystania z cytowaniem"},
    citeTitle:{en:"Citation with the retrieval date", pl:"Cytowanie z datą pobrania"},
    fiscId:"PL_FISCAL_IMPULSE", fiscBase:"PL_GG_BAL", fiscVirtual:true,
    fiscWhat:{en:"1 series: the general government balance (Eurostat, quarterly)", pl:"1 szereg: wynik sektora instytucji rządowych i samorządowych (Eurostat, kwartalnie)"},
    fiscNote:{en:"Minus the four-quarter change of the general government balance as a share of GDP (Eurostat, seasonally and calendar adjusted).", pl:"Minus zmiana w ciągu czterech kwartałów wyniku sektora instytucji rządowych i samorządowych w relacji do PKB (Eurostat, wyrównane sezonowo i o dni robocze)."},
    fiscInG:{en:"balance as % of GDP, minus its change over four quarters", pl:"wynik w % PKB, minus jego zmiana w ciągu czterech kwartałów"},
    fiscMover:{en:"Minus the four-quarter change of the general government balance as a share of GDP. Below zero: the deficit is shrinking, a drag on demand. Above zero: a stimulus.",
               pl:"Minus zmiana w ciągu czterech kwartałów wyniku sektora instytucji rządowych i samorządowych w relacji do PKB. Poniżej zera: deficyt maleje, co hamuje popyt. Powyżej zera: bodziec."},
    fiscLabel:{en:"Fiscal impulse: minus the four-quarter change of the general government balance", pl:"Impuls fiskalny: minus zmiana wyniku sektora instytucji rządowych i samorządowych w ciągu czterech kwartałów"},
    recWhat:{en:"yield-curve probit alone, Sahm rule as a flag", pl:"sam probit krzywej rentowności, reguła Sahm jako flaga"},
    srcHost:"source"
  }
};
const CP = PROFILES[MC_COUNTRY]||PROFILES.us;
// where the live file is looked for, in order: this site (relative), macrocartography.com, the older yieldcartography.com address
function liveURLs(){
  const out=[]; try{ if(/^https?:$/.test(location.protocol)&&/macrocartography\.com$|^localhost$|^127\.0\.0\.1$/.test(location.hostname)) out.push("/data/"+CP.data); }catch(e){}
  out.push(MC_SITE+"/data/"+CP.data); out.push(CP.legacy); return out.filter((u,i,a)=>a.indexOf(u)===i);
}
let LIVE_USED = "";
// the site root when this page is served from macrocartography.com (or a local preview), else the public site
function siteBase(){
  try{ if(/^https?:$/.test(location.protocol)&&/macrocartography\.com$|^localhost$|^127\.0\.0\.1$/.test(location.hostname)) return location.origin; }catch(e){}
  return MC_SITE;
}
// address of the same radar for another country or language (on the site: /us/ and /pl/)
function pageURL(country, lang){ return siteBase()+"/"+(country?country+"/":"")+"?lang="+(lang||LANG); }
