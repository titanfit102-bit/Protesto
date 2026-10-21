import { CATEGORIES, CASE_STATUSES, INITIATIVE_TYPES, validateCase, validateInitiative, validateGathering, filterCases, summarize, restoreState } from "./domain.mjs";
import { SEED } from "./seed.mjs";

const STORAGE_KEY = "protesto.demo.v1";
let state;
try { state = restoreState(localStorage.getItem(STORAGE_KEY), SEED); } catch { state = structuredClone(SEED); }
let filters = { query: "", category: "all", status: "all" };
let composeType = "case";
const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const shortDate = (value) => { const time = new Date(value); return Number.isNaN(time.getTime()) ? "—" : new Intl.DateTimeFormat("sq-AL", {day:"2-digit",month:"short",year:"numeric"}).format(time); };
const save = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; }
  catch { showNotice("Ruajtja lokale nuk funksionon në këtë shfletues. Eksporto të dhënat përpara se të mbyllësh faqen.", true); return false; }
};
const icons = { cases:"▤", initiatives:"◇", gatherings:"◎" };
function showNotice(message, error=false) {
  const el = $("notice"); el.textContent = message; el.hidden = false; el.className = "notice"+(error?" error":"");
}
function heading(kicker, title, subtitle, action="") {
  return `<div class="page-head"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${subtitle}</p></div>${action}</div>`;
}
function actionBtn(type, label) {
  return `<button type="button" class="btn primary" data-compose="${type}">＋ ${label}</button>`;
}
function card(item, kind) {
  const tag = kind==="cases" ? item.category : kind==="initiatives" ? item.type : "Tubim paqësor";
  const status = kind==="cases" ? `<span class="status">${escapeHtml(item.status)}</span>` : "";
  const info = kind==="gatherings" ? `<span>◷ ${shortDate(item.date)}</span>` : `<span>◷ ${shortDate(item.createdAt)}</span>`;
  const url = item.source && /^https:\/\//i.test(item.source) ? `<a href="${escapeHtml(item.source)}" target="_blank" rel="noopener noreferrer">Burimi ↗</a>` : "";
  return `<article class="record">
    <div class="record-meta"><span class="pill">${escapeHtml(tag)}</span>${item.sample ? '<span class="demo-tag">SHEMBULL FIKTIV</span>' : '<span class="demo-tag local-tag">LOKAL · JO PUBLIK</span>'}</div>
    <h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p>
    <div class="record-footer"><span>⌖ ${escapeHtml(item.area)}</span>${info}${status}${url}</div>
  </article>`;
}
function renderOverview() {
  const counts = summarize(state.cases, state.initiatives, state.gatherings);
  const stats = [
    ["Dosje qytetare",counts.cases,"▤"],["Dosje të hapura",counts.open,"◷"],
    ["Iniciativa",counts.initiatives,"◇"],["Tubime paqësore",counts.gatherings,"◎"]
  ];
  $("content").innerHTML = `
    <section class="hero"><div class="hero-content"><span class="hero-label"><span class="live-dot"></span> PLATFORMË QYTETARE · DEMONSTRIM</span><h1>Faktet kanë<br><em>fuqi.</em></h1><p>Një vend për të dokumentuar problemet publike, ndërtuar iniciativa dhe organizuar pjesëmarrje qytetare paqësore. Me transparencë dhe përgjegjësi.</p><div class="hero-actions">${actionBtn("case","Raporto një problem")}<a class="btn outline-light" href="#about">Si funksionon ↗</a></div></div><div class="hero-art" aria-hidden="true"><div class="rings"></div><div class="hero-glyph">P<span>.</span></div></div></section>
    <div class="demo-banner"><strong>Version demonstrimi</strong><span>Të gjithë emrat dhe rastet fillestare janë fiktive. Veprimet e tua ruhen vetëm në këtë shfletues; asgjë nuk publikohet.</span></div>
    <section class="stats">${stats.map(([label,value,icon])=>`<div class="stat"><div class="stat-icon">${icon}</div><strong>${value}</strong><span>${label}</span></div>`).join("")}</section>
    <div class="section-top"><div><div class="eyebrow">TRANSPARENCA NË PRAKTIKË</div><h2>Dosjet e fundit</h2></div><a href="#cases" class="text-link">Shiko të gjitha →</a></div>
    <div class="records">${state.cases.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,3).map(x=>card(x,"cases")).join("") || '<div class="empty">Nuk ka raportime ende.</div>'}</div>
    <section class="how-row"><div class="how-intro"><div class="eyebrow">SI FUNKSIONON</div><h2>Problemi nuk duhet të mbetet vetëm një postim.</h2></div><div class="steps"><div><b>01</b><strong>Raporto</strong><span>Përshkruaj çfarë ndodh dhe ku.</span></div><div><b>02</b><strong>Verifiko</strong><span>Shto burime. Mos publiko akuza të paverifikuara.</span></div><div><b>03</b><strong>Ndiq</strong><span>Dokumento përgjigjen dhe rezultatin.</span></div></div></section>
  `;
}
function renderCases() {
  const rows=filterCases(state.cases,filters);
  $("content").innerHTML = heading("DOSJET PUBLIKE","Problemet kërkojnë prova.","Kërko sipas teme, zone apo statusi. Rastet janë shembuj ose regjistrime private në këtë shfletues.",actionBtn("case","Raporto një problem"))+
  `<div class="filters"><label class="search"><span>⌕</span><input id="query" aria-label="Kërko raportime" placeholder="Kërko raportime ose zona..." value="${escapeHtml(filters.query)}"></label><select id="category" aria-label="Filtro kategori"><option value="all">Të gjitha kategoritë</option>${CATEGORIES.map(x=>`<option value="${escapeHtml(x)}" ${filters.category===x?"selected":""}>${escapeHtml(x)}</option>`).join("")}</select><select id="status" aria-label="Filtro status"><option value="all">Të gjitha statuset</option>${CASE_STATUSES.map(x=>`<option value="${escapeHtml(x)}" ${filters.status===x?"selected":""}>${escapeHtml(x)}</option>`).join("")}</select></div>`+
  `<div class="result-count">${rows.length} rezultate</div><div class="records">${rows.map(x=>card(x,"cases")).join("") || '<div class="empty">Nuk u gjet asnjë raportim. Provo një filtër tjetër.</div>'}</div>`;
  $("query").addEventListener("input",(e)=>{
    filters.query=e.target.value;
    const count=$("content").querySelector(".result-count");
    const records=$("content").querySelector(".records");
    const visible=filterCases(state.cases,filters);
    count.textContent=visible.length+" rezultate";
    records.innerHTML=visible.map(x=>card(x,"cases")).join("") || '<div class="empty">Nuk u gjet asnjë raportim.</div>';
  });
  $("category").addEventListener("change",(e)=>{ filters.category=e.target.value; renderCases(); });
  $("status").addEventListener("change",(e)=>{ filters.status=e.target.value; renderCases(); });
}
function renderList(kind) {
  const initiative=kind==="initiatives";
  const title=initiative?"Nismat e qytetarëve":"Tubimet paqësore";
  $("content").innerHTML=heading(initiative?"PËRFSHIRJE QYTETARE":"PJESËMARRJE E LIGJSHME",title,
    initiative?"Propozo ide, kërkesa dhe diskutime komunitare. Regjistrimet janë private në këtë version.":
    "Organizimi paqësor kërkon përgjegjësi, respektim të ligjit dhe siguri për të gjithë.",actionBtn(initiative?"initiative":"gathering",initiative?"Krijo nismë":"Shto tubim"))+
    `<div class="demo-banner"><strong>Kujdes</strong><span>${initiative?"Kjo është një hapësirë demonstrimi, jo peticion zyrtar me nënshkrime.":"Asnjë tubim i shfaqur këtu nuk është një ftesë reale. Nuk ka regjistrim pjesëmarrësish apo ndjekje vendndodhjeje."}</span></div><div class="records">${state[kind].map(x=>card(x,kind)).join("") || '<div class="empty">Nuk ka regjistrime.</div>'}</div>`;
}
function renderAbout() {
  $("content").innerHTML=heading("MISIONI","Qytetari ka të drejtë të dijë.","Protesto është konceptuar si një mjet transparent, neutral dhe i orientuar drejt provave.")+
  `<div class="about-grid"><section class="panel"><h2>Çfarë bën kjo demo?</h2><p>Raporton probleme, filtron dosje, regjistron iniciativa dhe tubime paqësore. Të dhënat ruhen lokalisht në pajisjen tënde.</p><h3>Çfarë NUK bën?</h3><p>Nuk verifikon identitetin, nuk dërgon kërkesa në institucione, nuk publikon në internet, nuk mban nënshkrime dhe nuk analizon dokumente me AI. Këto kërkojnë backend, procese ligjore dhe siguri shtesë.</p></section><section class="panel"><h2>Parimet</h2><ul><li>Paanshmëri ndaj partive dhe qeverive.</li><li>Prova dhe burime të kontrollueshme.</li><li>E drejtë korrigjimi dhe përgjigjeje.</li><li>Jo dhunë, kërcënime apo publikim të të dhënave private.</li><li>Minimizim i të dhënave personale.</li></ul><button id="export-data" class="btn secondary" type="button">Eksporto të dhënat e mia (JSON) ↓</button></section></div>`;
  $("export-data").addEventListener("click",()=>{
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="protesto-local-backup.json";a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
}
const titles={ overview:"Përmbledhje",cases:"Dosjet qytetare",initiatives:"Iniciativat",gatherings:"Tubimet paqësore",about:"Si funksionon" };
function render() {
  const page=location.hash.slice(1);
  const key=Object.hasOwn(titles,page)?page:"overview";
  $("breadcrumb").textContent=titles[key];
  document.querySelectorAll(".nav-item").forEach(el=>{const active=el.dataset.page===key;el.classList.toggle("active",active);if(active)el.setAttribute("aria-current","page");else el.removeAttribute("aria-current");});
  if(key==="overview")renderOverview();
  if(key==="cases")renderCases();
  if(key==="initiatives"||key==="gatherings")renderList(key);
  if(key==="about")renderAbout();
}
const field=(name,label,type="text",required=true,placeholder="")=>`<label class="field"><span>${label}${required?" *":""}</span>${type==="textarea" ? `<textarea name="${name}" rows="4" ${required?"required":""} placeholder="${placeholder}"></textarea>` : `<input name="${name}" type="${type}" ${required?"required":""} placeholder="${placeholder}" ${type==="date"?'min="'+new Date().toLocaleDateString("sv-SE")+'"':""}>`}</label>`;
function openComposer(type) {
  composeType=type;
  const fields=$("form-fields");
  const intro=type==="case"?"Raporto një problem":type==="initiative"?"Krijo një nismë":"Shto një tubim paqësor";
  $("dialog-title").textContent=intro;
  const select=(name,label,options)=>`<label class="field"><span>${label} *</span><select name="${name}" required>${options.map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join("")}</select></label>`;
  let html=field("title","Titulli");
  if(type==="case")html+=select("category","Kategoria",CATEGORIES);
  if(type==="initiative")html+=select("type","Lloji",INITIATIVE_TYPES);
  html+=field("area",type==="gathering"?"Vendndodhja publike":"Zona / Bashkia");
  if(type==="gathering")html+=field("date","Data","date");
  html+=field("description","Përshkrimi","textarea",true,"Jep kontekst të saktë, pa të dhëna private...");
  if(type==="case")html+=field("source","Burimi HTTPS (opsional)","url",false,"https://...");
  fields.innerHTML=html+`<p class="privacy-footnote">Ruhet vetëm në këtë shfletues. Mos vendos emra privatë, numra telefoni ose pretendime të pakonfirmuara.</p>`;
  $("form-error").hidden=true;
  $("composer").showModal();
}
document.addEventListener("click",(event)=>{
  const compose=event.target.closest("[data-compose]");
  if(compose)openComposer(compose.dataset.compose);
});
$("close-dialog").addEventListener("click",()=>$("composer").close());
$("cancel-dialog").addEventListener("click",()=>$("composer").close());
$("compose-form").addEventListener("submit",(event)=>{
  event.preventDefault();
  const input=Object.fromEntries(new FormData(event.currentTarget));
  try {
    if(composeType==="case")state.cases.unshift(validateCase(input));
    else if(composeType==="initiative")state.initiatives.unshift(validateInitiative(input));
    else state.gatherings.unshift(validateGathering(input));
    const saved=save();
    $("composer").close();
    location.hash=composeType==="case"?"#cases":composeType==="initiative"?"#initiatives":"#gatherings";
    render();
    showNotice(saved?"Regjistrimi u ruajt vetëm në këtë shfletues. Nuk është publikuar.":"Regjistrimi është në memorie, por nuk u ruajt në shfletues.",!saved);
  } catch(error) {
    $("form-error").textContent=error.message || "Të dhënat nuk janë të vlefshme.";
    $("form-error").hidden=false;
  }
});
$("reset-btn").addEventListener("click",()=>{
  if(!confirm("Të fshihen regjistrimet lokale dhe të rikthehen shembujt demonstrues?"))return;
  state=structuredClone(SEED);filters={query:"",category:"all",status:"all"};
  save();render();showNotice("Të dhënat demonstrative u rikthyen.");
});
window.addEventListener("hashchange",render);
render();
