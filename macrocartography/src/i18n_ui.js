// ---------------- language layer: header controls and the page translator ----------------
const FLAG_SVG = {
  us:`<svg viewBox="0 0 19 12" width="21" height="14" aria-hidden="true"><rect width="19" height="12" fill="#b22234"/>${[1,3,5,7,9,11].map(i=>`<rect y="${(i*12/13).toFixed(2)}" width="19" height="${(12/13).toFixed(2)}" fill="#fff"/>`).join("")}<rect width="7.6" height="${(7*12/13).toFixed(2)}" fill="#3c3b6e"/>${[[1.3,1.2],[3.8,1.2],[6.3,1.2],[2.5,2.6],[5,2.6],[1.3,4],[3.8,4],[6.3,4],[2.5,5.4],[5,5.4]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="0.42" fill="#fff"/>`).join("")}</svg>`,
  pl:`<svg viewBox="0 0 16 10" width="21" height="14" aria-hidden="true"><rect width="16" height="5" fill="#fff"/><rect y="5" width="16" height="5" fill="#dc143c"/></svg>`
};
function buildBrand(){
  const f=$("mcFlags"), l=$("mcLang"), home=$("mcHome");
  if(home) home.href=pageURL("", LANG);
  if(f) f.innerHTML=["us","pl"].map(c=>{ const on=c===MC_COUNTRY, nm=L(PROFILES[c].name);
    return `<a class="mc-flag${on?" on":""}" href="${esc(pageURL(c))}" data-country="${c}" title="${esc(on?TR("Showing data for {0}",nm):TR("Switch to the {0} radar",nm))}" aria-label="${esc(nm)}"${on?' aria-current="page"':""}>${FLAG_SVG[c]}</a>`; }).join("");
  if(l) l.innerHTML=LANGS.map(g=>`<button type="button" class="${g===LANG?"on":""}" data-lang="${g}" title="${g==="en"?"English":"Polski"}">${g.toUpperCase()}</button>`).join("");
  if(f) f.onclick=e=>{ const a=e.target.closest("a[data-country]"); if(!a) return; if(a.classList.contains("on")){ e.preventDefault(); return; } keepState(); };
  if(l) l.onclick=e=>{ const b=e.target.closest("button[data-lang]"); if(!b||b.dataset.lang===LANG) return; switchLang(b.dataset.lang); };
}
// the page is rebuilt in the other language by reloading it; the view, the selection and the settings travel along
function keepState(){ try{ sessionStorage.setItem("mc_state",JSON.stringify({country:MC_COUNTRY, st:collectState()})); }catch(e){} }
function switchLang(g){
  try{ localStorage.setItem("mc_lang",g); }catch(e){}
  keepState();
  let u; try{ u=new URL(location.href); u.searchParams.set("lang",g); u=u.toString(); }catch(e){ u=null; }
  if(u&&/^https?:|^file:/.test(u)) location.href=u; else location.reload();
}
function restoreKeptState(){
  let k=null; try{ k=JSON.parse(sessionStorage.getItem("mc_state")||"null"); sessionStorage.removeItem("mc_state"); }catch(e){}
  if(!k||!k.st) return;
  const s=k.st, same=k.country===MC_COUNTRY;
  ["view","theme","details"].forEach(x=>{ if(s[x]!==undefined) state[x]=s[x]; });
  if(same){ ["group","head","hist","find"].forEach(x=>{ if(s[x]!==undefined) state[x]=s[x]; });
    if(s.assume&&typeof s.assume==="object"){ ASSUME=Object.assign(JSON.parse(JSON.stringify(DEFAULT_ASSUME)), s.assume); ASSUME.view=Object.assign({ghost:3,arrow:3}, s.assume.view||{}); ASSUME.regime=Object.assign({gx:0,py:0}, s.assume.regime||{}); } }
}

// Translator: every text node, title, placeholder and aria-label that matches a dictionary entry is swapped for its
// Polish version, as the page renders (a MutationObserver follows every later change). Strings with numbers inside
// are translated where they are built (TR() with {0} slots) or by the pattern rules PL_RX.
const TR_SKIP = new Set(["SCRIPT","STYLE","CODE","TEXTAREA"]);
function trString(s){
  if(LANG!=="pl"||!s) return null;
  const k=s.replace(/\s+/g," ").trim(); if(!k||k.length<2) return null;
  let v=PL_DICT[k];
  if(v===undefined&&/[A-Z]/.test(k)&&k===k.toUpperCase()){ const lo=PL_DICT[k.toLowerCase()]; if(lo!==undefined) v=lo.toUpperCase(); }
  if(v===undefined&&k[0]!==k[0].toLowerCase()){ const lo=PL_DICT[k[0].toLowerCase()+k.slice(1)]; if(lo!==undefined) v=lo[0].toUpperCase()+lo.slice(1); }
  if(v===undefined){ for(const [rx,rep] of PL_RX){ rx.lastIndex=0; if(rx.test(k)){ v=k.replace(rx,rep); break; } } }
  if(v===undefined||v===k) return null;
  return s.match(/^\s*/)[0]+v+s.match(/\s*$/)[0];
}
function trAttrs(el){
  ["title","placeholder","aria-label"].forEach(a=>{ const v=el.getAttribute&&el.getAttribute(a); if(v){ const r=trString(v); if(r!==null) el.setAttribute(a,r); } });
}
function trTree(root){
  if(LANG!=="pl"||!root) return;
  if(root.nodeType===3){ const p=root.parentNode; if(p&&!TR_SKIP.has(p.nodeName)&&!(p.closest&&p.closest("[data-notr]"))){ const r=trString(root.nodeValue); if(r!==null) root.nodeValue=r; } return; }
  if(root.nodeType!==1||TR_SKIP.has(root.nodeName)||(root.closest&&root.closest("[data-notr]"))) return;
  trAttrs(root);
  const html=PL_HTML[root.innerHTML&&root.innerHTML.replace(/\s+/g," ").trim()];
  if(html!==undefined&&root.children&&root.children.length<40){ root.innerHTML=html; return; }
  const w=document.createTreeWalker(root, 1|4, null); let n;
  const nodes=[]; while((n=w.nextNode())) nodes.push(n);
  nodes.forEach(n=>{ if(n.nodeType===1){ if(!TR_SKIP.has(n.nodeName)) trAttrs(n);
      if(n.children&&n.children.length&&n.children.length<40){ const h=PL_HTML[n.innerHTML.replace(/\s+/g," ").trim()]; if(h!==undefined) n.innerHTML=h; } }
    else { const p=n.parentNode; if(p&&!TR_SKIP.has(p.nodeName)&&!(p.closest&&p.closest("[data-notr]"))){ const r=trString(n.nodeValue); if(r!==null) n.nodeValue=r; } } });
}
let _trObs=null;
function startTranslator(){
  document.documentElement.lang=LANG;
  if(LANG!=="pl") return;
  trTree(document.body);
  if(typeof MutationObserver==="undefined") return;
  _trObs=new MutationObserver(ms=>{ ms.forEach(m=>{
    if(m.type==="characterData") trTree(m.target);
    else if(m.type==="attributes") trAttrs(m.target);
    else m.addedNodes.forEach(n=>trTree(n)); }); });
  _trObs.observe(document.body,{subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:["title","placeholder","aria-label"]});
}

const trTitle = s => (LANG==="pl"&&s)?(trString(String(s))||String(s)):s;
