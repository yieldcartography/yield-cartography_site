// ---- macrocartography.com site shell: header (logo, flags, menu, EN / PL), footer and the About page ----
// Shared by the landing page and the two radar pages. Everything it writes is already in the viewer's language.
(function(){
const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const X=(lang,o)=>lang==="pl"?o.pl:o.en;
const FLAG={
  us:`<svg viewBox="0 0 19 12" width="21" height="14" aria-hidden="true"><rect width="19" height="12" fill="#b22234"/>${[1,3,5,7,9,11].map(i=>`<rect y="${(i*12/13).toFixed(2)}" width="19" height="${(12/13).toFixed(2)}" fill="#fff"/>`).join("")}<rect width="7.6" height="${(7*12/13).toFixed(2)}" fill="#3c3b6e"/>${[[1.3,1.2],[3.8,1.2],[6.3,1.2],[2.5,2.6],[5,2.6],[1.3,4],[3.8,4],[6.3,4],[2.5,5.4],[5,5.4]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="0.42" fill="#fff"/>`).join("")}</svg>`,
  pl:`<svg viewBox="0 0 16 10" width="21" height="14" aria-hidden="true"><rect width="16" height="5" fill="#fff"/><rect y="5" width="16" height="5" fill="#dc143c"/></svg>`};
const NAME={us:{en:"United States",pl:"Stany Zjednoczone"},pl:{en:"Poland",pl:"Polska"}};
const MARK=`<svg class="mc-mark" viewBox="0 0 64 64" aria-hidden="true"><path d="M8 48 A24 24 0 0 1 56 48" fill="none" stroke="#1f4e79" stroke-width="2.2" opacity="0.25"/><path d="M14 48 A18 18 0 0 1 50 48" fill="none" stroke="#1f4e79" stroke-width="2.8" opacity="0.45"/><path d="M20 48 A12 12 0 0 1 44 48" fill="none" stroke="#1f4e79" stroke-width="3.4" opacity="0.7"/><line x1="32" y1="48" x2="47" y2="22" stroke="#c2522d" stroke-width="4.2" stroke-linecap="round"/><circle cx="47" cy="22" r="4.4" fill="#c2522d" stroke="#fff" stroke-width="1.2"/><circle cx="32" cy="48" r="3.8" fill="#1f4e79"/></svg>`;
// the menu: the radar's tabs, then About
const NAV=[
  ["radar",{en:"radar",pl:"radar"},{en:"Five headline gauges, the regime compass and the groups behind them. Click a gauge to open its indicators",pl:"Pięć wskaźników głównych, kompas reżimów i grupy za nimi. Kliknij wskaźnik, aby otworzyć jego składniki"}],
  ["history",{en:"history",pl:"historia"},{en:"Long series over the regime canvas, with statistics for each regime",pl:"Długie szeregi na tle reżimów, ze statystykami dla każdego reżimu"}],
  ["finder",{en:"finder",pl:"wyszukiwarka"},{en:"Search any published series and open its level, momentum and standing charts",pl:"Wyszukaj dowolny opublikowany szereg i otwórz jego wykresy poziomu, dynamiki i pozycji"}],
  ["about",{en:"about",pl:"o projekcie"},{en:"Author, the method in brief, data sources, publications with DOIs and contact",pl:"Autor, metoda w skrócie, źródła danych, publikacje z DOI i kontakt"}]];

// o: {lang, country (null on the landing page), view (null on the landing page), home, flagHref(c), navHref(view)}
function header(o){
  const L=o.lang;
  const flags=["us","pl"].map(c=>{ const on=c===o.country, nm=NAME[c][L];
    const tip=on?X(L,{en:"Showing data for ",pl:"Dane: "})+nm:X(L,{en:"Open the radar for ",pl:"Otwórz radar: "})+nm;
    return `<a class="mc-flag${on?" on":""}" href="${esc(o.flagHref(c))}" data-country="${c}" title="${esc(tip)}" aria-label="${esc(nm)}"${on?' aria-current="page"':""}>${FLAG[c]}</a>`; }).join("");
  const nav=NAV.map(([k,n,t])=>`<a href="${esc(o.navHref(k))}" data-view="${k}" class="${k===o.view?"active":""}" data-tip="${esc(X(L,t))}"${k===o.view?' aria-current="page"':""}>${esc(X(L,n))}</a>`).join("");
  const lsw=["en","pl"].map(g=>`<button type="button" class="${g===L?"on":""}" data-lang="${g}" title="${g==="en"?"English":"Polski"}">${g.toUpperCase()}</button>`).join("");
  return `<span class="mc-brand"><a class="mc-logo" href="${esc(o.home)}" title="macrocartography.com">${MARK}<span class="mc-word"><span class="w1">macro</span><span class="w2">_</span><span class="w3">cartography</span></span></a>`
    +`<span class="mc-flags" role="group" aria-label="${esc(X(L,{en:"Country data",pl:"Dane kraju"}))}">${flags}</span></span>`
    +`<nav aria-label="${esc(X(L,{en:"Menu",pl:"Menu"}))}">${nav}<span class="mc-lsw" role="group" aria-label="${esc(X(L,{en:"Language",pl:"Język"}))}">${lsw}</span></nav>`;
}

// o: {lang, radarHref(c), aboutHref}
function footer(o){
  const L=o.lang;
  return `<div class="footer-inner">`
    +`<div><h4>${X(L,{en:"Radars",pl:"Radary"})}</h4><ul><li><a href="${esc(o.radarHref("us"))}">${esc(NAME.us[L])}</a></li><li><a href="${esc(o.radarHref("pl"))}">${esc(NAME.pl[L])}</a></li></ul></div>`
    +`<div><h4>${X(L,{en:"Project",pl:"Projekt"})}</h4><ul><li><a href="${esc(o.aboutHref)}">${X(L,{en:"About",pl:"O projekcie"})}</a></li><li><a href="https://yieldcartography.com/">yieldcartography.com</a> <span style="opacity:0.7">${X(L,{en:"(sister site)",pl:"(serwis siostrzany)"})}</span></li></ul></div>`
    +`<div><h4>${X(L,{en:"Contact",pl:"Kontakt"})}</h4><ul><li><a href="mailto:mdec@kozminski.edu.pl">mdec@kozminski.edu.pl</a></li></ul></div>`
    +`</div><div class="footer-inner copyright"><span>macrocartography.com · Marcin Dec · ${X(L,{en:"an informational view of public data, not a forecast and not investment advice",pl:"informacyjny przegląd danych publicznych, nie prognoza i nie rekomendacja inwestycyjna"})}</span></div>`;
}

// ---- About ----
const PUBS=[
  {t:"Microstructure-Efficient Estimation of Sovereign Yield Curves in Less-Liquid Markets", sl:"snde",
   m:"Studies in Nonlinear Dynamics &amp; Econometrics, ahead of print, online 7 October 2026 · open access (CC-BY)", doi:"10.1515/snde-2026-0057",
   a:"Supplies microstructure foundations for liquidity-weighted Nelson-Siegel-Svensson curve fitting in less-liquid sovereign bond markets. A yield-space version of the Glosten-Milgrom dealer problem delivers an optimal bond weight proportional to turnover, a Ho-Stoll inventory channel delivers a weight proportional to outstanding amount, and the hybrid of the two is governed by a single dominance ratio identifiable from data. Derives consistency, asymptotic normality and Aitken efficiency of the resulting estimator as a nonlinear M-estimator under conditional heteroskedasticity, and characterises identification of the Svensson curvature parameter as a coverage condition on the maturity grid, turning two practitioner patches for thin panels into corollaries. A Monte Carlo experiment and a Polish primary-dealer bond panel of more than 5,000 daily cross-sections show that equal weighting is uniformly the least accurate scheme, with the hybrid weight reducing out-of-sample yield-prediction error by about one basis point in median; a downstream check traces the same order of difference into Adrian-Crump-Moench term-premium estimates."},
  {t:"Supply, Habitat and the Price of Liquidity in Less-Liquid Sovereign Bond Markets. Evidence from Poland", sl:"liquidity",
   m:"Borsa Istanbul Review, in press, corrected proof, online 1 September 2026, art. 100904 · open access", doi:"10.1016/j.bir.2026.100904",
   a:"Treats liquidity on a less-liquid sovereign market as the object to be explained rather than an input. Six low-frequency estimators plus the zero-trading-days share, computed bond by bond over 2005-2026, feed bond-month and segment-month panels, MPC and primary-auction event studies, and a monthly supply-block regression of the aggregate spread and ACM term premia. Supply prices in through segment stocks and residual-maturity concentration rather than monthly flow, the post-2020 foreign-investor retreat loads on Amihud price impact but is invisible in the venue-capped quoted spread, and total debt loads on the term premium with a maturity-monotonic preferred-habitat gradient worth about 2.5 percent of the sovereign universe's present value over the 2019-2025 debt expansion."},
  {t:"Does the Term Premium Pay for the Duration? Evidence from Polish Sovereigns", sl:"duration",
   m:"preprint, 1 June 2026 · Research Square v1", doi:"10.21203/rs.3.rs-9849665/v1",
   a:"Develops a closed-form seven-component identity for the realised quarterly total return on a coupon-bearing sovereign bond (coupon accrual, reinvestment proceeds, clean-price roll-down, expected-rate change, term-premium change, convexity, and a closure residual). Applied to the published Treasury BondSpot Poland index over 2006-2026 on an 89-bond panel, the identity tracks the basket within ten basis points per year. Carry and roll-down contribute +413 bp per year on average; the macro-driven curve-move bloc averages -17 bp per year and is statistically indistinguishable from zero on the full sample. Conditioning out the four-quarter 2022 NBP-hike storm, the TBSP-versus-rolling-NBP-deposit excess is +46.5 bp per quarter at HAC p = 0.003. A TBSP-tracking Polish bond fund is best classified as a carry trade between the term spread and the NBP reference rate, carrying a low-frequency regime risk that paid off asymmetrically in 2022."},
  {t:"Closer to New York than to Frankfurt? The Expectations Hypothesis in Poland, the US and the Euro Area", sl:"eh",
   m:"working paper, 2026 · SSRN 6695444", doi:"10.2139/ssrn.6695444",
   a:"Five families of expectations-hypothesis tests applied to Polish, US and euro-area sovereign curves over 2005-2026. The Polish curve is mildly anti-PEH, the US is roughly consistent with PEH at long horizons, and the euro-area AAA panel rejects strongly under asymptotic Newey-West but barely under wild block bootstrap: clean evidence for the Bauer-Hamilton (2018) concern about asymptotic inference in overlapping-return regressions with persistent regressors."},
  {t:"Are Survey-Based Rate Expectations Informative? Evidence from Less-Liquid Markets", sl:"surveys",
   m:"working paper, 2026 · SSRN 6644222", doi:"10.2139/ssrn.6644222",
   a:"Tests whether the NBP Survey of Professional Forecasters carries information beyond what is already in the Polish term structure. Uses ACM and BRW expected-rate paths from the LW-NSS-fitted Polish zero-coupon panel as the model benchmark, runs Diebold-Mariano, Clark-West and forecast-encompassing tests at horizons of 1 to 60 months. The model wins at 3y and 5y, the survey wins at 1y; encompassing tests reject the survey at long horizons."},
  {t:"Parsimonious Yield Curve Modeling in Less-Liquid Markets", sl:"lwnss",
   m:"FAME|GRAPE Working Paper #53", link:["https://grape.org.pl/publications/wps","grape.org.pl/publications/wps"],
   a:"Develops the liquidity-weighted Nelson-Siegel-Svensson (LW-NSS) framework for sovereign curves where bond-by-bond observation noise is heterogeneous. Information-matrix derivation gives an explicit weight-matrix structure derived from BondSpot turnover and outstanding amounts. Refit of the Polish panel reduces 21-year mean fit MAE by 1.6 bp versus equal-weight NSS while preserving curvature."},
  {t:"Welfare Measurements with Heterogeneous Agents", sl:"welfare",
   m:"with Marek Weretka · Journal of Economic Dynamics and Control, 184 (March 2026), art. 105252 · preprint at SSRN 5335293", doi:"10.1016/j.jedc.2025.105252",
   a:"The canonical infinite-horizon heterogeneous-consumer framework lacks a preference-based index that consistently quantifies the welfare impact of policies: money-metric indices such as equivalent and compensating variation are not additive across policy sets and can depend on the assumed status quo or implementation order. The paper shows that for arbitrary heterogeneous von Neumann-Morgenstern preferences with a common discount factor the equivalent (or compensating) variation is nearly additive and aggregates effectively as long as consumers are patient, so the index delivers consistent quantitative welfare predictions for the short-lived policies studied in macroeconomics and finance."},
  {t:"From Point through Density Valuation to Individual Risk Assessment in the Discounted Cash Flows Method", sl:"dcf",
   m:"International Journal of Finance &amp; Economics, 26 (2021), 5621–5635", doi:"10.1002/ijfe.2084",
   a:"Reformulates the discounted-cash-flow valuation method to deliver a full distribution of valuation outcomes rather than a point estimate, with explicit treatment of cash-flow uncertainty and discount-rate uncertainty. Shows how the resulting distribution feeds directly into individual position-level risk assessment."},
  {t:"Markovian and Multi-Curve Friendly Parametrisation of a HJM Model Used in Valuation Adjustment of Interest Rate Derivatives", sl:"hjm",
   m:"Bank i Kredyt, 50(2), 2019", link:["https://bankikredyt.nbp.pl/content/2019/02/BIK_02_2019_01.pdf","PDF · bankikredyt.nbp.pl"],
   a:"Derives a Markovian, multi-curve-consistent parametrisation of the Heath-Jarrow-Morton model suitable for XVA computation across collateralised and uncollateralised interest-rate derivatives. Reduces the dimensionality of the state vector required for valuation adjustment without sacrificing fit on the swap-curve and OIS-curve data."}];
const PURPOSES=[["Research collaboration","Współpraca badawcza"],["Data download / replication","Pobranie danych, replikacja"],["Methodology question","Pytanie o metodę"],
  ["Job opportunity","Propozycja pracy"],["Press / interview request","Prośba o wywiad lub komentarz"],["General curiosity","Ogólna ciekawość"],["Other","Inne"]];
const WEB3FORMS_KEY="e30053d8-c910-49c8-b2f0-88bb35b10495";   // the yieldcartography.com form key: messages arrive in the same inbox

function about(L){
  const T=(en,pl)=>L==="pl"?pl:en;
  const sec=(h,body)=>`<section class="section"><h2 class="with-rule">${h}</h2>${body}</section>`;
  const row=(l,v)=>`<div class="label">${l}</div><div class="val">${v}</div>`;
  const bio=row(T("Author","Autor"),`<strong>Marcin Dec, PhD</strong><br>`+T(
      "Assistant Professor in Finance, Department of Finance, Kozminski University, Warsaw. Research Assistant at FAME|GRAPE since 2019. Twenty-plus years of fixed-income practitioner experience as senior analyst, portfolio manager, and risk manager before entering academia.",
      "Adiunkt w Katedrze Finansów Akademii Leona Koźmińskiego w Warszawie. Od 2019 roku asystent badawczy w FAME|GRAPE. Ponad dwadzieścia lat praktyki na rynku instrumentów dłużnych jako starszy analityk, zarządzający portfelem i risk manager, zanim zajął się pracą naukową."))
    +row(T("Education","Wykształcenie"),T("PhD in Quantitative Economics, SGH Warsaw School of Economics.<br>MSc in Mathematical Finance, University of Oxford.",
      "Doktor nauk ekonomicznych (ekonomia ilościowa), SGH Szkoła Główna Handlowa w Warszawie.<br>MSc in Mathematical Finance, University of Oxford."))
    +row(T("Certifications","Certyfikaty"),T("FRM, PRM, CIIA, CQF, RAI: practitioner certifications spanning financial-risk management (FRM, PRM), international investment analysis (CIIA), quantitative finance (CQF), and risk-in-AI (RAI).",
      "FRM, PRM, CIIA, CQF, RAI: certyfikaty zawodowe z zarządzania ryzykiem finansowym (FRM, PRM), międzynarodowej analizy inwestycyjnej (CIIA), finansów ilościowych (CQF) oraz ryzyka w sztucznej inteligencji (RAI)."))
    +row(T("Research focus","Zainteresowania badawcze"),T("Yield-curve modelling for less-liquid sovereign bond markets, term-premium estimation, multi-curve HJM, money-market benchmarks, valuation adjustments (XVA), and welfare measurement with heterogeneous agents. Empirical anchor is the Polish PLN sovereign curve, with comparative work against US Treasury and euro-area AAA benchmarks.",
      "Modelowanie krzywej dochodowości na mniej płynnych rynkach obligacji skarbowych, szacowanie premii za termin, wielokrzywowy model HJM, wskaźniki referencyjne rynku pieniężnego, korekty wyceny (XVA) oraz pomiar dobrobytu przy heterogenicznych podmiotach. Empirycznym punktem odniesienia jest polska krzywa skarbowa w PLN, porównywana z krzywą amerykańskich obligacji skarbowych i krzywą AAA strefy euro."))
    +row(T("Funding","Finansowanie"),T(`National Science Centre Poland, Preludium grant <span class="mono">UMO-2020/37/N/HS4/02202</span> (2021–2024). Multiple SGH Rector's scholarships for best doctoral students, 2017–2021.`,
      `Narodowe Centrum Nauki, grant Preludium <span class="mono">UMO-2020/37/N/HS4/02202</span> (2021–2024). Wielokrotne stypendia Rektora SGH dla najlepszych doktorantów, 2017–2021.`))
    +row(T("This site","Ten serwis"),T(`macrocartography.com publishes two Macro Radars, for the United States and for Poland, built only from public statistics and refreshed every weekday by the same pipeline as its sister site <a href="https://yieldcartography.com/">yieldcartography.com</a>. Either radar reads in English or in Polish. The method is open and every series links to its source.`,
      `macrocartography.com publikuje dwa Makroradary, dla Stanów Zjednoczonych i dla Polski, zbudowane wyłącznie z publicznych statystyk i odświeżane w każdy dzień roboczy przez ten sam proces co serwis siostrzany <a href="https://yieldcartography.com/">yieldcartography.com</a>. Każdy radar można czytać po angielsku lub po polsku. Metoda jest otwarta, a każdy szereg prowadzi do swojego źródła.`));
  const method=[
    T("Each series is first turned into the quantity that is scored: a level, a change over 12 months, a ratio or a share of GDP. That quantity is then standardised with a robust z-score: its distance from the median of the last ten years, divided by 1.4826 times the median absolute deviation (at least five years of history are needed), and signed so that a higher score always points the same way as its gauge. One extreme episode therefore does not distort the scale for the next decade.",
      "Każdy szereg jest najpierw zamieniany na wielkość, która podlega ocenie: poziom, zmianę w ciągu 12 miesięcy, relację albo udział w PKB. Ta wielkość jest następnie standaryzowana odpornym wynikiem z: odległością od mediany z ostatnich dziesięciu lat, podzieloną przez 1.4826 razy medianę odchyleń bezwzględnych (potrzeba co najmniej pięciu lat historii), ze znakiem dobranym tak, by wyższy wynik zawsze wskazywał w tę samą stronę co jego wskaźnik. Jeden skrajny epizod nie zniekształca więc skali na następną dekadę."),
    T("Indicators are averaged into groups, and groups into four headline gauges: economy, price pressure, policy stance and financial conditions. Each average is shown on a 0 to 100 scale through the normal distribution function, so 50 is a typical reading. The policy stance blends monetary policy (75%) with the fiscal impulse (25%). Coloured zones only name the readings, they do not change any value.",
      "Wskaźniki są uśredniane w grupy, a grupy w cztery wskaźniki główne: gospodarkę, presję cenową, nastawienie polityki i warunki finansowe. Każda średnia jest pokazywana w skali od 0 do 100 przez dystrybuantę rozkładu normalnego, więc 50 to odczyt typowy. Nastawienie polityki łączy politykę pieniężną (75%) z impulsem fiskalnym (25%). Kolorowe strefy jedynie nazywają odczyty, nie zmieniają żadnej wartości."),
    T("Recession risk averages recession probabilities: for the United States the Chauvet-Piger and Hamilton probabilities published on FRED and a yield-curve probit, for Poland a yield-curve probit. The regime compass places each month by growth and price pressure: overheating, stagflation, slowdown or goldilocks.",
      "Ryzyko recesji uśrednia prawdopodobieństwa recesji: dla Stanów Zjednoczonych prawdopodobieństwa Chauveta-Pigera i Hamiltona publikowane w FRED oraz probit krzywej dochodowości, dla Polski probit krzywej dochodowości. Kompas reżimów umieszcza każdy miesiąc według wzrostu i presji cenowej: przegrzanie, stagflacja, spowolnienie albo złotowłosa gospodarka."),
    T("This is an informational view of public data. It is not a forecast and not investment advice.","To informacyjny przegląd danych publicznych. Nie jest prognozą ani rekomendacją inwestycyjną.")
  ].map(p=>`<p>${p}</p>`).join("");
  const data=`<p><strong>${T("United States","Stany Zjednoczone")}:</strong> <a href="https://fred.stlouisfed.org/" target="_blank" rel="noopener">FRED</a>, Federal Reserve Bank of St. Louis. ${T("The series come from the Federal Reserve Board, the Bureau of Labor Statistics, the Bureau of Economic Analysis, the Census Bureau, regional Federal Reserve Banks and other publishers, each credited on its own row.","Szeregi pochodzą od Rady Gubernatorów Systemu Rezerwy Federalnej, Bureau of Labor Statistics, Bureau of Economic Analysis, Census Bureau, regionalnych banków Rezerwy Federalnej i innych wydawców, z których każdy jest podany przy swoim szeregu.")}<br>`
    +`<strong>${T("Poland","Polska")}:</strong> ${T("Eurostat, Statistics Poland (GUS), Narodowy Bank Polski, the Ministry of Finance, the Bank for International Settlements, the OECD, the European Central Bank, the Warsaw Stock Exchange (GPW), and yieldcartography.com's own measures of the Polish bond market (the fitted yield curve, the term premium, liquidity and volatility).","Eurostat, Główny Urząd Statystyczny (GUS), Narodowy Bank Polski, Ministerstwo Finansów, Bank Rozrachunków Międzynarodowych, OECD, Europejski Bank Centralny, Giełda Papierów Wartościowych w Warszawie (GPW) oraz własne miary yieldcartography.com dla polskiego rynku obligacji (dopasowana krzywa dochodowości, premia za termin, płynność i zmienność).")}</p>`;
  const ext=[["GRAPE","FAME|GRAPE researcher page","Strona badacza FAME|GRAPE","https://grape.org.pl/mdec","grape.org.pl/mdec"],
    [T("University","Uczelnia"),"Kozminski faculty page","Strona w Akademii Leona Koźmińskiego","https://www.kozminski.edu.pl/en/community/card/phd-marcin-dec","kozminski.edu.pl"],
    ["LinkedIn","Personal profile","Profil osobisty","https://www.linkedin.com/in/marcin-dec-6a7a974b/","linkedin.com/in/marcin-dec-6a7a974b"],
    ["Podcast",'"Tloczone z danych": GRAPE podcast for DGP','"Tłoczone z danych": podcast GRAPE dla DGP',"https://grape.org.pl/podcast","grape.org.pl/podcast"]]
    .map(([lab,en,pl,u,uu])=>`<a class="ext-card" href="${u}" target="_blank" rel="noopener"><div class="ext-label">${esc(lab)}</div><div class="ext-name">${esc(T(en,pl))}</div><div class="ext-url">${esc(uu)}</div></a>`).join("");
  const pubs=PUBS.map(p=>`<li><span class="ttl">${esc(p.t)}</span><span class="meta">${p.m}</span>`
    +`<span class="doi">${p.doi?`<a href="https://doi.org/${p.doi}" target="_blank" rel="noopener">doi:${p.doi}</a>`:`<a href="${p.link[0]}" target="_blank" rel="noopener">${esc(p.link[1])}</a>`}`
    +` · <a href="https://yieldcartography.com/slides/${p.sl}/" target="_blank" rel="noopener">${T("seminar slides","slajdy seminaryjne")}</a></span>`
    +`<details class="absfold"><summary>${T("abstract","streszczenie")}</summary><span class="abs" lang="en">${esc(p.a)}</span></details></li>`).join("");
  const form=`<form class="contact-form" data-mc-contact>
      <input type="hidden" name="access_key" value="${WEB3FORMS_KEY}">
      <input type="hidden" name="subject" value="macrocartography.com: enquiry">
      <input type="hidden" name="site" value="macrocartography.com">
      <input type="hidden" name="language" value="${L}">
      <input type="checkbox" name="botcheck" style="display:none" tabindex="-1" autocomplete="off">
      <div><label for="cf-name">${T("Name","Imię i nazwisko")}</label><input type="text" id="cf-name" name="name" required></div>
      <div><label for="cf-email">${T("Email","E-mail")}</label><input type="email" id="cf-email" name="email" required></div>
      <div><label for="cf-affil">${T("Affiliation (optional)","Afiliacja (opcjonalnie)")}</label><input type="text" id="cf-affil" name="affiliation" placeholder="${esc(T("University, central bank, fund, …","Uczelnia, bank centralny, fundusz, …"))}"></div>
      <div><label for="cf-market">${T("Country or market you follow (optional)","Kraj lub rynek, który śledzisz (opcjonalnie)")}</label><input type="text" id="cf-market" name="market_focus" placeholder="${esc(T("e.g. US, PL, euro area, …","np. USA, PL, strefa euro, …"))}"></div>
      <div><label for="cf-purpose">${T("What brought you here?","Co Cię tu sprowadza?")}</label><select id="cf-purpose" name="purpose" required><option value="">${T("select","wybierz")}</option>${PURPOSES.map(([en,pl])=>`<option value="${esc(en)}">${esc(T(en,pl))}</option>`).join("")}</select></div>
      <div><label for="cf-message">${T("Message","Wiadomość")}</label><textarea id="cf-message" name="message" required></textarea></div>
      <button type="submit">${T("Send message","Wyślij wiadomość")}</button>
      <div class="form-status" data-mc-status></div>
    </form>`;
  return `<div class="mc-about" data-notr="1" lang="${L}">`
    +`<h1>${T("About","O projekcie")}</h1><p class="lead">${T("Author bio, the method in brief, data sources, external profiles, publications with DOIs, and a contact form for questions and collaboration enquiries.","Biogram autora, metoda w skrócie, źródła danych, profile zewnętrzne, publikacje z DOI oraz formularz kontaktowy na pytania i propozycje współpracy.")}</p>`
    +sec(T("Bio","Biogram"),`<div class="bio-grid">${bio}</div>`)
    +sec(T("The method in brief","Metoda w skrócie"),method)
    +sec(T("Data sources","Źródła danych"),data)
    +sec(T("External profiles &amp; media","Profile zewnętrzne i media"),`<div class="ext-links">${ext}</div>`)
    +sec(T("Publications &amp; working papers","Publikacje i prace robocze"),`<ul class="pub-list">${pubs}</ul><p style="margin-top:14px;font-family:var(--yc-mono);font-size:11px;color:var(--yc-muted)">${T("Titles and abstracts as published. For the full publication list and ongoing working papers see the GRAPE, SSRN and RePEc profiles linked above.","Tytuły i streszczenia w wersji opublikowanej. Pełna lista publikacji i bieżących prac znajduje się w profilach GRAPE, SSRN i RePEc podanych wyżej.")}</p>`)
    +sec(T("Contact &amp; collaboration","Kontakt i współpraca"),`<p>${T("Use the form below for questions about the radars and for collaboration enquiries. The \"what brought you here\" dropdown helps me prioritise replies.","Pytania o radary i propozycje współpracy można przesłać przez formularz poniżej. Pole „Co Cię tu sprowadza?” pomaga mi ustalić kolejność odpowiedzi.")}</p>${form}`
      +`<p style="font-size:13px;color:var(--yc-muted);margin-top:14px">${T("Direct email","Bezpośredni e-mail")}: <a href="mailto:mdec@kozminski.edu.pl">mdec@kozminski.edu.pl</a></p>`)
    +`</div>`;
}
function wireContact(root, L){
  const form=root&&root.querySelector("form[data-mc-contact]"); if(!form) return;
  const T=(en,pl)=>L==="pl"?pl:en;
  form.addEventListener("submit", async e=>{
    e.preventDefault();
    const st=form.querySelector("[data-mc-status]"); st.className="form-status"; st.textContent="";
    try{
      const res=await fetch("https://api.web3forms.com/submit",{method:"POST", body:new FormData(form)});
      const j=await res.json();
      if(j&&j.success){ st.className="form-status ok"; st.textContent=T("Message sent. I aim to reply within two working days.","Wiadomość wysłana. Staram się odpowiadać w ciągu dwóch dni roboczych."); form.reset(); }
      else { st.className="form-status err"; st.textContent=T("Sorry, something went wrong. Please email mdec@kozminski.edu.pl directly.","Przepraszam, coś poszło nie tak. Proszę napisać bezpośrednio na mdec@kozminski.edu.pl."); }
    }catch(err){ st.className="form-status err"; st.textContent=T("Network error. Please email mdec@kozminski.edu.pl directly.","Błąd sieci. Proszę napisać bezpośrednio na mdec@kozminski.edu.pl."); }
  });
}
window.MCSHELL={header, footer, about, wireContact, NAME, FLAG, VIEWS:NAV.map(x=>x[0])};
})();
