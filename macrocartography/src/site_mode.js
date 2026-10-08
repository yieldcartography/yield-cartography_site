// ---------------- macrocartography.com site mode ----------------
// build_site.py sets this to true for the pages it publishes: the yieldcartography-style header with the tabs as the
// menu, About as a fourth view, no expert tabs, no snapshot, no theme switch, no editable texts. Standalone copies keep false.
const MC_SITE_MODE = (/*__MC_SITE__*/false);
const SITE_VIEWS = MCSHELL.VIEWS;            // radar, history, finder, about
function siteHref(country, view){ return pageURL(country, LANG)+(view?"#"+view:""); }
function siteInit(){
  if(!MC_SITE_MODE) return;
  document.body.classList.add("site","light");
  state.details=false; state.theme="light";
  ["titleText","subtitleText","instrText"].forEach(id=>{ const e=$(id); if(e){ e.removeAttribute("contenteditable"); e.removeAttribute("title"); } });
  const h=(location.hash||"").slice(1); if(SITE_VIEWS.includes(h)) state.view=h;
  if(!SITE_VIEWS.includes(state.view)) state.view="radar";
  try{ localStorage.setItem("mc_country", MC_COUNTRY); }catch(e){}
  const ab=$("view_about"); if(ab){ ab.innerHTML=MCSHELL.about(LANG); MCSHELL.wireContact(ab, LANG); }
  const ft=$("mcFooter"); if(ft) ft.innerHTML=MCSHELL.footer({lang:LANG, radarHref:c=>siteHref(c,"radar"), aboutHref:"#about"});
  window.addEventListener("hashchange",()=>{ const v=(location.hash||"").slice(1); if(SITE_VIEWS.includes(v)&&v!==state.view){ state.view=v; buildTabs(); render(); window.scrollTo(0,0); } });
}
function siteNav(){
  const hd=$("mcHeader"); if(!hd) return;
  hd.innerHTML=MCSHELL.header({lang:LANG, country:MC_COUNTRY, view:state.view, home:pageURL("",LANG), flagHref:c=>siteHref(c,state.view), navHref:v=>"#"+v});
  hd.onclick=e=>{
    const f=e.target.closest("a[data-country]"); if(f){ if(f.classList.contains("on")){ e.preventDefault(); return; } keepState(); return; }
    const b=e.target.closest("button[data-lang]"); if(b){ if(b.dataset.lang!==LANG) switchLang(b.dataset.lang); return; }
    const a=e.target.closest("a[data-view]"); if(a&&a.dataset.view===state.view){ e.preventDefault(); window.scrollTo(0,0); }
  };
  document.body.classList.toggle("v-about", state.view==="about");
}
