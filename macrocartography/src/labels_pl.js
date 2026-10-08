// Polish names of the published series (the source's own full titles and citations stay as published)
const PL_LABELS = {
  // ---- United States ----
  RECPROUSM156N:"Wygładzone prawdopodobieństwo recesji w USA (Chauvet-Piger)", JHGDPBRINDX:"Indeks recesji oparty na PKB (Hamilton)",
  SAHMREALTIME:"Wskaźnik recesji według reguły Sahm, w czasie rzeczywistym", USREC:"Wskaźnik recesji NBER (cieniowanie)",
  GDPC1:"PKB realny", A191RL1Q225SBEA:"Wzrost PKB realnego, % kw/kw, w ujęciu rocznym", GDPNOW:"Nowcast GDPNow (Fed z Atlanty)",
  INDPRO:"Indeks produkcji przemysłowej", IPMAN:"Produkcja przemysłowa: przetwórstwo", TCU:"Wykorzystanie mocy produkcyjnych, cały przemysł",
  DGORDER:"Nowe zamówienia na dobra trwałe", NEWORDER:"Zamówienia na podstawowe dobra kapitałowe (bez obronności i lotnictwa)",
  CFNAI:"Krajowy indeks aktywności Fed z Chicago (CFNAI)", CFNAIMA3:"CFNAI, średnia 3-miesięczna", ISRATIO:"Relacja zapasów do sprzedaży w gospodarce",
  TTLCONS:"Wydatki budowlane ogółem", GACDFSA066MSFRBPHI:"Przetwórstwo w regionie Fed z Filadelfii, bieżąca aktywność",
  BACTSAMFRBDAL:"Przetwórstwo w Teksasie (Fed z Dallas), aktywność gospodarcza", MANEMP:"Zatrudnienie w przetwórstwie",
  PAYEMS:"Zatrudnienie poza rolnictwem", UNRATE:"Stopa bezrobocia", U6RATE:"Stopa niepełnego zatrudnienia U-6", CIVPART:"Współczynnik aktywności zawodowej",
  LNS11300060:"Współczynnik aktywności, wiek 25-54", EMRATIO:"Wskaźnik zatrudnienia do populacji", LNS12300060:"Wskaźnik zatrudnienia do populacji, wiek 25-54",
  ICSA:"Nowe wnioski o zasiłek dla bezrobotnych", IC4WSA:"Nowe wnioski o zasiłek, średnia 4-tygodniowa", CCSA:"Kontynuowane wnioski o zasiłek",
  JTSJOL:"Wolne miejsca pracy (JOLTS)", JTSQUR:"Stopa dobrowolnych odejść", JTSHIR:"Stopa zatrudnień", JTSLDR:"Stopa zwolnień",
  CES0500000003:"Przeciętne wynagrodzenie godzinowe, sektor prywatny", ECIALLCIV:"Indeks kosztów zatrudnienia, cywilny", AWHAETP:"Przeciętny tygodniowy czas pracy, sektor prywatny",
  TEMPHELPS:"Zatrudnienie w usługach pracy tymczasowej", UEMPMEAN:"Przeciętny czas trwania bezrobocia, tygodnie",
  PCEC96:"Realne wydatki konsumpcyjne gospodarstw domowych", RSAFS:"Sprzedaż detaliczna i gastronomiczna", RRSFS:"Realna sprzedaż detaliczna i gastronomiczna",
  UMCSENT:"Nastroje konsumentów Uniwersytetu Michigan", DSPIC96:"Realny dochód rozporządzalny", W875RX1:"Realny dochód osobisty bez transferów",
  PSAVERT:"Stopa oszczędności osobistych", TOTALSL:"Kredyt konsumpcyjny ogółem", REVOLSL:"Kredyt konsumpcyjny odnawialny", TDSP:"Obciążenie gospodarstw domowych obsługą długu",
  TOTALSA:"Sprzedaż lekkich pojazdów, w ujęciu rocznym", CPIAUCSL:"CPI, wszystkie pozycje", CPILFESL:"CPI bazowy", PCEPI:"Indeks cen PCE", PCEPILFE:"Indeks cen PCE bazowy",
  PPIFIS:"PPI, popyt finalny", MEDCPIM158SFRBCLE:"Mediana CPI (Fed z Cleveland)", CORESTICKM159SFRBATL:"Bazowy CPI cen sztywnych (Fed z Atlanty)",
  PCETRIM12M159SFRBDAL:"PCE średnia obcięta, 12 mies. (Fed z Dallas)", CUSR0000SAH1:"CPI: mieszkanie", CUSR0000SASLE:"CPI: usługi bez energii",
  IR:"Indeks cen importu", PALLFNFINDEXM:"Globalny indeks cen surowców (MFW)", DCOILWTICO:"Ropa naftowa WTI", GASREGW:"Cena benzyny zwykłej w USA",
  MICH:"Oczekiwania inflacyjne na rok (UMich)", EXPINF1YR:"Oczekiwana inflacja na rok (Fed z Cleveland)", T5YIE:"Inflacja break-even, 5 lat",
  T10YIE:"Inflacja break-even, 10 lat", T5YIFR:"Terminowe oczekiwania inflacyjne 5y5y",
  HPIPONM226S:"Indeks cen domów FHFA, tylko zakupy", USSTHPI:"Indeks cen domów FHFA, wszystkie transakcje", COMREPUSQ159N:"Ceny nieruchomości komercyjnych (BIS)",
  HOUST:"Rozpoczęte budowy domów", PERMIT:"Pozwolenia na budowę", HSN1F:"Sprzedaż nowych domów jednorodzinnych", EXHOSLUSM495S:"Sprzedaż domów z rynku wtórnego (NAR, tylko okno 12 mies.)",
  MSPUS:"Mediana ceny sprzedanych domów", MSACSR:"Podaż nowych domów w miesiącach", RHORUSQ156N:"Odsetek właścicieli mieszkań", RRVRUSQ156N:"Odsetek pustostanów na wynajem",
  CUSR0000SEHA:"CPI: czynsz za główne miejsce zamieszkania", MORTGAGE30US:"Oprocentowanie kredytu hipotecznego Freddie Mac, 30 lat, stałe",
  MORTGAGE15US:"Oprocentowanie kredytu hipotecznego Freddie Mac, 15 lat, stałe", OBMMIC30YF:"Stopa kredytu standardowego Optimal Blue, 30 lat", MDSP:"Obciążenie obsługą kredytów hipotecznych",
  DFEDTARU:"Cel stopy fed funds, górna granica", DFEDTARL:"Cel stopy fed funds, dolna granica", EFFR:"Efektywna stopa fed funds", SOFR:"SOFR",
  IORB:"Oprocentowanie rezerw", DGS3MO:"Bony skarbowe USA, 3 miesiące", DGS2:"Obligacje skarbowe USA, 2 lata", DGS10:"Obligacje skarbowe USA, 10 lat",
  DGS5:"Obligacje skarbowe USA, 5 lat", DGS30:"Obligacje skarbowe USA, 30 lat", DGS1:"Obligacje skarbowe USA, 1 rok", FEDFUNDS:"Efektywna stopa fed funds, miesięczna",
  T10Y2Y:"Obligacje USA 10 lat minus 2 lata", T10Y3M:"Obligacje USA 10 lat minus 3 miesiące", WALCL:"Aktywa Fed ogółem", WRESBAL:"Salda rezerw",
  RRPONTSYD:"Operacje reverse repo overnight", WTREGEN:"Rachunek ogólny Skarbu (TGA)", M2SL:"Podaż pieniądza M2",
  MTSDS133FMS:"Nadwyżka lub deficyt federalny, miesięcznie", FYFSGDA188S:"Nadwyżka lub deficyt federalny, % PKB (rocznie)", GFDEGDQ188S:"Dług federalny, % PKB",
  A091RC1Q027SBEA:"Federalne płatności odsetkowe", D_MTGSPREAD:"Oprocentowanie kredytu hipotecznego minus obligacje 10 lat (przybliżenie spreadu MBS)",
  DPRIME:"Stopa prime banków", BAA10Y:"Moody's Baa minus obligacje USA 10 lat", AAA10Y:"Moody's Aaa minus obligacje USA 10 lat",
  DRTSCILM:"SLOOS: per saldo % zaostrzających kredyty C&I, duże firmy", DRTSCLCC:"SLOOS: per saldo % zaostrzających karty kredytowe",
  DRALACBS:"Stopa zaległości, wszystkie kredyty", DRCCLACBS:"Stopa zaległości, karty kredytowe", DRSFRMACBS:"Stopa zaległości, kredyty hipoteczne mieszkaniowe",
  DRCRELEXFACBS:"Stopa zaległości, nieruchomości komercyjne bez gruntów rolnych", DRBLACBS:"Stopa zaległości, kredyty dla firm", CORCCACBS:"Stopa odpisów, karty kredytowe",
  TOTLL:"Kredyty i leasing banków", BUSLOANS:"Kredyty komercyjne i przemysłowe (C&I)", DPSACBW027SBOG:"Depozyty bankowe",
  VIXCLS:"VIX", VXVCLS:"VIX 3-miesięczny", OVXCLS:"Zmienność ropy naftowej (OVX)", DTWEXBGS:"Szeroki ważony handlem kurs dolara", DEXUSEU:"USD za EUR",
  DCOILBRENTEU:"Ropa Brent", DFII10:"Realna rentowność TIPS 10 lat", STLFSI4:"Indeks napięć finansowych Fed z St. Louis", NFCI:"NFCI Fed z Chicago",
  ANFCI:"Skorygowany NFCI Fed z Chicago", KCFSI:"Indeks napięć finansowych Fed z Kansas City",
  // ---- Poland ----
  PL_OECD_BCI:"Złożony wskaźnik koniunktury OECD dla firm, wyrównany amplitudowo, Polska", PL_GUS_SI:"Syntetyczny wskaźnik koniunktury GUS (SI), ogółem, sa",
  PL_IP:"Produkcja przemysłowa, przemysł bez budownictwa", PL_IP_MAN:"Produkcja przemysłowa, przetwórstwo", PL_IP_CAPG:"Produkcja przemysłowa, dobra inwestycyjne, r/r",
  PL_IP_CONSG:"Produkcja przemysłowa, dobra konsumpcyjne, r/r", PL_CONSTR:"Produkcja budowlana", PL_SERV_PRD:"Produkcja usług, gospodarka bez finansów",
  PL_GDP:"PKB realny, wolumeny łańcuchowe", PL_GFCF:"Nakłady brutto na środki trwałe, wolumeny", PL_ESI:"Wskaźnik nastrojów gospodarczych (ESI)",
  PL_ICI:"Wskaźnik koniunktury w przemyśle", PL_SCI:"Wskaźnik koniunktury w usługach", PL_IND_PROD_EXP:"Przemysł: oczekiwania produkcji, następne 3 miesiące",
  PL_IND_ORDERS:"Przemysł: ocena portfela zamówień", PL_IND_EXP_ORDERS:"Przemysł: ocena portfela zamówień eksportowych", PL_IND_STOCKS:"Przemysł: zapasy wyrobów gotowych (powyżej normy = +)",
  PL_CAPU:"Wykorzystanie mocy produkcyjnych w przemyśle", PL_TRADE_BAL:"Saldo handlu towarami, wszyscy partnerzy, sa", PL_CA_BAL:"Saldo rachunku bieżącego, miesięcznie",
  PL_BUS_REG:"Rejestracje firm", PL_GUS_IP_FIRST:"Produkcja sprzedana przemysłu (B-E), r/r, ceny stałe, sa, pierwszy odczyt GUS",
  PL_UNEMP:"Stopa bezrobocia, BAEL, sa", PL_UNEMP_CHG12:"Stopa bezrobocia, zmiana w ciągu 12 miesięcy", PL_UNEMP_YOUTH:"Stopa bezrobocia młodzieży, poniżej 25 lat, sa",
  PL_EMP_RATE:"Wskaźnik zatrudnienia, 20-64, sa", PL_ACT_RATE:"Współczynnik aktywności zawodowej, 15-64, sa", PL_JVR:"Wskaźnik wolnych miejsc pracy, przemysł, budownictwo i usługi, sa",
  PL_LCI:"Indeks kosztów pracy, nominalny, gospodarka", PL_ULC:"Nominalny jednostkowy koszt pracy, na godzinę", PL_IND_EMP_EXP:"Przemysł: oczekiwania zatrudnienia",
  PL_SERV_EMP_EXP:"Usługi: oczekiwania zatrudnienia", PL_CONS_UNEMP_EXP:"Konsumenci: oczekiwania bezrobocia na 12 miesięcy (wyżej = gorzej)",
  PL_GUS_EMP_ENT:"Przeciętne zatrudnienie w sektorze przedsiębiorstw", PL_GUS_WAGE_ENT:"Przeciętne wynagrodzenie brutto w sektorze przedsiębiorstw, nominalne, r/r",
  PL_GUS_WAGE_REAL:"Przeciętne wynagrodzenie brutto w sektorze przedsiębiorstw, realne, r/r (deflowane przez GUS)", PL_GUS_UREG:"Stopa bezrobocia rejestrowanego",
  PL_CCI:"Wskaźnik zaufania konsumentów (DG ECFIN)", PL_CONS_FIN_LY:"Konsumenci: sytuacja finansowa w ostatnich 12 miesiącach",
  PL_CONS_GES_NY:"Konsumenci: ogólna sytuacja gospodarcza w następnych 12 miesiącach", PL_CONS_MAJOR:"Konsumenci: duże zakupy obecnie",
  PL_RETAIL_NOM:"Handel detaliczny, obroty netto, ceny bieżące", PL_RETAIL_VOL:"Handel detaliczny, wolumen sprzedaży", PL_HH_CONS:"Spożycie gospodarstw domowych, wolumeny",
  PL_SAVING_RATE:"Stopa oszczędności brutto gospodarstw domowych, sa", PL_RCI:"Wskaźnik koniunktury w handlu detalicznym",
  PL_GUS_BWUK:"Bieżący wskaźnik ufności konsumenckiej (BWUK)", PL_GUS_WWUK:"Wyprzedzający wskaźnik ufności konsumenckiej (WWUK)",
  PL_HICP:"HICP, ogółem", PL_HICP_CORE:"HICP bez energii, żywności, alkoholu i tytoniu", PL_HICP_SERV:"HICP usługi", PL_HICP_FOOD:"HICP żywność z alkoholem i tytoniem",
  PL_HICP_NRG:"HICP energia", PL_HICP_NEIG:"HICP towary przemysłowe bez energii", PL_PPI:"Ceny producentów, przemysł bez budownictwa, rynek krajowy",
  PL_PPI_MAN:"Ceny producentów, przetwórstwo, rynek krajowy", PL_IND_PRICE_EXP:"Przemysł: oczekiwania cen sprzedaży", PL_SERV_PRICE_EXP:"Usługi: oczekiwania cen, następne 3 miesiące",
  PL_RET_PRICE_EXP:"Handel detaliczny: oczekiwania cen, następne 3 miesiące", PL_CONS_PRICE_EXP:"Konsumenci: tendencje cen w następnych 12 miesiącach",
  PL_GUS_CPI_FIRST:"CPI, ogółem, r/r (GUS, COICOP 1999 do 2025, potem COICOP 2018)", PL_NBP_CORE:"CPI bez żywności i energii (inflacja bazowa NBP)",
  PL_NBP_INFEXP_HH:"Oczekiwania inflacyjne przedsiębiorstw, statystyka bilansowa (ankieta NBP)", PL_HPI:"Indeks cen mieszkań, wszystkie mieszkania",
  PL_PERMITS_SQM:"Pozwolenia na budowę, mieszkaniowe, powierzchnia użytkowa, sca", PL_PERMITS_DW:"Pozwolenia na budowę, mieszkania w budynkach mieszkalnych bez zbiorowego zamieszkania, liczba, sca",
  PL_CCI_CONSTR:"Wskaźnik koniunktury w budownictwie", PL_CONSTR_ORDERS:"Budownictwo: zmiana portfela zamówień", PL_CONSTR_EMP_EXP:"Budownictwo: oczekiwania zatrudnienia",
  PL_CONSTR_PRICE_EXP:"Budownictwo: oczekiwania cen", PL_GUS_DW_STARTED:"Mieszkania rozpoczęte", PL_GUS_DW_COMPLETED:"Mieszkania oddane do użytkowania",
  PL_NBP_MORT_RATE:"Oprocentowanie nowych kredytów mieszkaniowych dla gospodarstw domowych (statystyka MIF)", PL_NBP_HOUSING_LOANS:"Kredyty mieszkaniowe dla gospodarstw domowych, PLN i walutowe, stan",
  PL_WIBOR3M:"Stopa rynku pieniężnego 3M (WIBOR 3M, średnia miesięczna)", PL_ON:"Stopa rynku pieniężnego overnight (średnia miesięczna)",
  PL_10Y_EUROSTAT:"Rentowność 10-letnich obligacji skarbowych, szereg kryterium konwergencji (kontrolnie)", PL_REAL_RATE:"Realne nastawienie polityki: WIBOR 3M minus bazowy HICP r/r",
  PL_GG_BAL:"Wynik sektora instytucji rządowych i samorządowych, nadwyżka (+) / deficyt (-), % PKB, sca", PL_GG_DEBT:"Dług sektora instytucji rządowych i samorządowych brutto, % PKB",
  PL_NEER:"Nominalny efektywny kurs walutowy, 42 partnerów", PL_REER:"Realny efektywny kurs walutowy, deflowany CPI, 42 partnerów", PL_EURPLN_M:"EUR/PLN, średnia miesięczna",
  PL_NBP_REF:"Stopa referencyjna NBP, dziennie, stopy banków centralnych BIS", PL_NBP_M3:"Szeroki pieniądz M3", PL_MF_DEBT:"Dług Skarbu Państwa",
  PL_MF_DOM_SPW:"Krajowe rynkowe skarbowe papiery wartościowe w obrocie", PL_MF_NONRES_SPW:"Krajowe rynkowe skarbowe papiery wartościowe w posiadaniu nierezydentów",
  PL_MF_NONRES_SHARE:"Udział nierezydentów w krajowych rynkowych skarbowych papierach wartościowych", PL_BKR:"Ogłoszenia upadłości, gospodarka",
  PL_NBP_LOANS_HH:"Kredyty dla gospodarstw domowych, PLN i walutowe, stan", PL_NBP_LOANS_NFC:"Kredyty dla przedsiębiorstw niefinansowych, stan",
  PL_NBP_CONS_LOANS:"Kredyty konsumpcyjne dla gospodarstw domowych, stan", PL_NBP_DEPOSITS_HH:"Depozyty gospodarstw domowych, stan",
  PL_NBP_LEND_RATE_NFC:"Oprocentowanie nowych kredytów dla przedsiębiorstw niefinansowych", PL_NPL_RATIO:"Wskaźnik kredytów zagrożonych, sektor bankowy (skonsolidowane dane bankowe)",
  PL_BIS_CREDIT_GAP:"Luka kredytowa (kredyt do PKB), prywatny sektor niefinansowy", PL_BIS_PROP:"Ceny nieruchomości mieszkaniowych, realne, 2010=100 (BIS)",
  PL_YC_2Y:"Rentowność POLGB 2 lata, dopasowana krzywa LW-NSS (YieldCartography)", PL_YC_5Y:"Rentowność POLGB 5 lat, dopasowana krzywa LW-NSS (YieldCartography)",
  PL_YC_10Y:"Rentowność POLGB 10 lat, dopasowana krzywa LW-NSS (YieldCartography)", PL_YC_2S10S:"Nachylenie krzywej, 10 lat minus 2 lata, krzywa dopasowana (YieldCartography)",
  PL_YC_1S5S:"Nachylenie krzywej, 5 lat minus 1 rok, krzywa dopasowana (YieldCartography)", PL_YC_TP10:"Premia za termin, 10 lat, ACM (YieldCartography)",
  PL_YC_SPREAD_BUND:"Spread 10-letni, POLGB ponad krzywą AAA strefy euro, miesięcznie (YieldCartography)",
  PL_YC_LIQ:"Złożona miara płynności rynku POLGB, z (bid-ask, Amihud, Roll, dni bez obrotu), miesięcznie (YieldCartography)",
  PL_YC_VOL10:"Zrealizowana zmienność rentowności 10-letniej, 21 dni, pb rocznie (YieldCartography)", PL_NBP_EURPLN:"EUR/PLN, fixing NBP", PL_NBP_USDPLN:"USD/PLN, fixing NBP",
  PL_FX_VOL:"Zrealizowana zmienność EUR/PLN, 21 dni", PL_WIG:"Indeks WIG, zamknięcie", PL_GUS_CLIMATE_MAN:"Wskaźnik koniunktury, przetwórstwo, sa (GUS)",
  PL_GUS_CLIMATE_CONSTR:"Wskaźnik koniunktury, budownictwo, sa (GUS)", PL_GUS_CLIMATE_RETAIL:"Wskaźnik koniunktury, handel detaliczny, sa (GUS)",
  PL_GUS_RETAIL_FIRST:"Sprzedaż detaliczna, ceny stałe, r/r, pierwszy odczyt GUS (przedsiębiorstwa powyżej 9 osób)",
  PL_GUS_IP_MAN_FIRST:"Produkcja sprzedana przetwórstwa, r/r, ceny stałe, sa (GUS)", PL_GUS_CONS_PRICE_EXP:"Konsumenci: oczekiwane zmiany cen, następne 12 miesięcy (GUS)",
  PL_GUS_CONS_UNEMP_EXP:"Konsumenci: oczekiwane bezrobocie, następne 12 miesięcy, znak odwrócony przez GUS (GUS)",
  PL_BIS_CREDIT_HH:"Kredyt dla gospodarstw domowych, PLN, wszyscy kredytodawcy (kredyt ogółem BIS)", PL_BIS_CREDIT_NFC:"Kredyt dla przedsiębiorstw niefinansowych, PLN, wszyscy kredytodawcy (kredyt ogółem BIS)",
  PL_BIS_CREDIT_HH_GDP:"Kredyt dla gospodarstw domowych, % PKB (BIS)", PL_BIS_REER:"Realny szeroki efektywny kurs walutowy (BIS)",
  PL_OECD_CCI:"Złożony wskaźnik zaufania konsumentów OECD, wyrównany amplitudowo, Polska",
  PL_FISCAL_IMPULSE:"Impuls fiskalny: minus zmiana wyniku sektora instytucji rządowych i samorządowych w ciągu czterech kwartałów"
};
// units and seasonal adjustment as the sources state them, in Polish
const PL_UNITS = {"%":"%", "% of GDP":"% PKB", "% of labour force":"% siły roboczej", "% of population":"% populacji", "% p.a.":"% rocznie", "% per year":"% rocznie", "% y/y":"% r/r",
  "+1 or 0":"+1 lub 0", "Billions of Chained 2017 Dollars":"mld dolarów łańcuchowych z 2017 r.", "Billions of Dollars":"mld dolarów", "Billions of U.S. Dollars":"mld dolarów USA",
  "Billions of US Dollars":"mld dolarów USA", "Dollars":"dolary", "Dollars per Barrel":"dolary za baryłkę", "Dollars per Gallon":"dolary za galon", "Dollars per Hour":"dolary za godzinę",
  "EUR mn":"mln EUR", "Hours":"godziny", "Index":"indeks", "Index 1966:Q1=100":"indeks 1966 I kw.=100", "Index 1980:Q1=100":"indeks 1980 I kw.=100", "Index 1982-1984=100":"indeks 1982-1984=100",
  "Index 2000=100":"indeks 2000=100", "Index 2016 = 100":"indeks 2016=100", "Index 2017=100":"indeks 2017=100", "Index Dec 2005=100":"indeks grudzień 2005=100", "Index Jan 1991=100":"indeks styczeń 1991=100",
  "Index Jan 2006=100":"indeks styczeń 2006=100", "Index Nov 2009=100":"indeks listopad 2009=100", "Level in Thousands":"poziom w tysiącach", "Millions of 1982-84 CPI Adjusted Dollars":"mln dolarów w cenach CPI z lat 1982-84",
  "Millions of Dollars":"mln dolarów", "Millions of U.S. Dollars":"mln dolarów USA", "Millions of Units":"mln sztuk", "Months' Supply":"miesiące podaży", "Number":"liczba", "Number of Units":"liczba sztuk",
  "PLN bn":"mld zł", "PLN mn":"mln zł", "PLN per EUR":"zł za EUR", "PLN per USD":"zł za USD", "Percent":"procent", "Percent Change at Annual Rate":"zmiana procentowa w ujęciu rocznym",
  "Percent Change from Preceding Period":"zmiana procentowa wobec poprzedniego okresu", "Percent Change from Year Ago":"zmiana procentowa r/r", "Percent of GDP":"procent PKB", "Percentage Points":"punkty procentowe",
  "Rate":"stopa", "Ratio":"relacja", "Thousands":"tysiące", "Thousands of Persons":"tysiące osób", "Thousands of Units":"tysiące sztuk", "U.S. Dollars to One Euro":"dolary USA za euro", "Weeks":"tygodnie",
  "balance":"saldo", "bp":"pb", "bp per year":"pb rocznie", "dwellings":"mieszkania", "index":"indeks", "index 2010=100":"indeks 2010=100", "index 2015=100":"indeks 2015=100", "index 2020=100":"indeks 2020=100",
  "index 2021=100":"indeks 2021=100", "index 2025=100":"indeks 2025=100", "index points":"punkty indeksu", "index, mean 100":"indeks, średnia 100", "index, previous year = 100":"indeks, rok poprzedni = 100",
  "pp":"pkt proc.", "previous year = 100":"rok poprzedni = 100", "thousand persons":"tysiące osób", "z-score":"wynik z",
  "Calendar adjusted":"wyrównane o dni robocze", "Not Seasonally Adjusted":"bez wyrównania sezonowego", "Not seasonally adjusted":"bez wyrównania sezonowego", "Seasonally Adjusted":"wyrównane sezonowo",
  "Seasonally Adjusted Annual Rate":"wyrównane sezonowo, w ujęciu rocznym", "Seasonally adjusted":"wyrównane sezonowo", "Seasonally and calendar adjusted":"wyrównane sezonowo i o dni robocze"};
// the page shows the series in the viewer's language; the snapshot keeps the source's wording
function localizeData(doc){
  if(!doc||!doc.series||doc.__loc===LANG) return doc;
  Object.entries(doc.series).forEach(([id,s])=>{ if(s.label_en===undefined){ s.label_en=s.label; s.units_en=s.units; s.seasonal_en=s.seasonal; }
    if(LANG==="pl"){ s.label=PL_LABELS[id]||s.label_en; s.units=PL_UNITS[s.units_en]!==undefined?PL_UNITS[s.units_en]:s.units_en; s.seasonal=PL_UNITS[s.seasonal_en]!==undefined?PL_UNITS[s.seasonal_en]:s.seasonal_en; }
    else { s.label=s.label_en; s.units=s.units_en; s.seasonal=s.seasonal_en; } });
  (doc.groups||[]).forEach(g=>{ if(g.name_en===undefined) g.name_en=g.name; g.name=LANG==="pl"?TR(g.name_en):g.name_en; });
  Object.defineProperty(doc,"__loc",{value:LANG,enumerable:false,configurable:true,writable:true});
  return doc;
}
// a copy of the data with the source's own wording, for snapshots
function sourceCopy(doc){
  if(!doc) return doc;
  return JSON.parse(JSON.stringify(doc,(k,v)=>{
    if(v&&typeof v==="object"&&!Array.isArray(v)&&k==="series"&&v===doc.series){ const o={}; Object.keys(v).forEach(i=>{ if(!v[i].virtual) o[i]=v[i]; }); return o; }
    if(v&&typeof v==="object"&&!Array.isArray(v)&&v.label_en!==undefined){ const o=Object.assign({},v); o.label=o.label_en; o.units=o.units_en; o.seasonal=o.seasonal_en; delete o.label_en; delete o.units_en; delete o.seasonal_en; return o; }
    if(v&&typeof v==="object"&&!Array.isArray(v)&&v.name_en!==undefined){ const o=Object.assign({},v); o.name=o.name_en; delete o.name_en; return o; }
    return v; }));
}
// the Polish fiscal impulse has no series of its own in the data file: it is added here from the published headline
// (scores.headline.fiscal), so that it can stand as the fiscal part of the policy stance in tables and charts
function addFiscalSeries(doc){
  if(!CP.fiscVirtual||!doc||!doc.series||doc.series[CP.fiscId]) return;
  const F=doc.scores&&doc.scores.headline&&doc.scores.headline.fiscal; if(!F||!F.d||!F.d.length) return;
  const b=doc.series[CP.fiscBase]||{}, d=[], v=[]; F.d.forEach((x,i)=>{ if(F.v[i]!==null&&isFinite(F.v[i])){ d.push(x); v.push(F.v[i]); } });
  doc.series[CP.fiscId]={label:L(CP.fiscLabel), label_en:CP.fiscLabel.en, fred_title:CP.fiscLabel.en+" (computed from "+(b.fred_title||CP.fiscBase)+")", group:6, freq:"monthly",
    units:TR("pp of GDP"), units_en:"pp of GDP", seasonal:b.seasonal||"", seasonal_en:b.seasonal_en||b.seasonal||"", polarity:1, publish:b.publish||"cite", source:b.source||"",
    citation:b.citation||"", url:b.url||"", obs:{d,v}, stats:null, last_obs:d[d.length-1], expected_by:b.expected_by||null, health:b.health||"ok", virtual:true};
}
function prepareData(doc){ addFiscalSeries(doc); localizeData(doc); return doc; }
