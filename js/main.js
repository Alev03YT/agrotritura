// ============================
// MENU MOBILE (hamburger)
// ============================
(function initMobileMenu(){
  const hamb = document.querySelector('[data-hamb]');
  const panel = document.querySelector('[data-mobile-panel]');
  if (!hamb || !panel) return;

  function setOpen(open){
    panel.classList.toggle('show', open);
    hamb.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('menu-open', open);
  }

  hamb.addEventListener('click', () => {
    const isOpen = panel.classList.contains('show');
    setOpen(!isOpen);
  });

  // chiudi menu quando clicchi un link
  panel.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    setOpen(false);
  });

  // chiudi menu cliccando fuori (opzionale ma utile)
  document.addEventListener('click', (e) => {
    if (!panel.classList.contains('show')) return;
    if (panel.contains(e.target) || hamb.contains(e.target)) return;
    setOpen(false);
  });
})();


// ============================
// CONFIG: URL APPS SCRIPT (LEADS)
// ============================
const LEAD_API = "https://script.google.com/macros/s/AKfycbykB-jtTTq0t6aem_sEAfX9xCMCLtNbswXcXPYi5ek_DcNPQif0TJmrCkKSNAXIGNCS/exec";


// ============================
// CAMPI DINAMICI: PRODOTTO + CONSEGNA
// ============================
const selectProdotto = document.querySelector('#cereale');
const campoExtra = document.querySelector('#campoExtraDinamico');

function renderSelect(label, name, options) {
  return `
    <div style="margin-top:10px">
      <label>${label}</label>
      <select name="${name}">
        <option value="">Seleziona…</option>
        ${options.map(o => `<option value="${o}">${o}</option>`).join("")}
      </select>
    </div>
  `;
}

function renderInput(label, name, placeholder) {
  return `
    <div style="margin-top:10px">
      <label>${label}</label>
      <input name="${name}" placeholder="${placeholder}" />
    </div>
  `;
}

function creaCampoExtra(prodotto) {
  if (!campoExtra) return;
  campoExtra.innerHTML = "";

  if (["Mais", "Orzo", "Avena"].includes(prodotto)) {
    campoExtra.innerHTML += renderSelect("Granulometria desiderata","extra_granulometria",["Grossa","Media","Fine"]);
  } else if (prodotto === "Frumento") {
    campoExtra.innerHTML += renderSelect("Animali destinatari","extra_animali",["Bovini","Suini","Pollame","Ovini","Altro"]);
  } else if (prodotto === "Grana verde") {
    campoExtra.innerHTML += renderSelect("Formato grana verde","extra_formato_grana",["Intero","Tritato"]);
    campoExtra.innerHTML += `<div id="wrapGranaGranulo"></div>`;

    const formatoSel = campoExtra.querySelector('[name="extra_formato_grana"]');
    const wrap = campoExtra.querySelector('#wrapGranaGranulo');

    if (formatoSel && wrap) {
      const update = () => {
        if (formatoSel.value === "Tritato") {
          wrap.innerHTML = renderSelect("Granulometria","extra_granulometria_grana",["Grossa","Media","Fine"]);
        } else {
          wrap.innerHTML = "";
        }
      };
      formatoSel.addEventListener("change", update);
      update();
    }
  } else if (prodotto === "Mix personalizzato") {
    campoExtra.innerHTML += renderInput("Composizione del mix","extra_mix","Es. mais + orzo + frumento");
  } else if (prodotto === "Altro / da definire") {
    campoExtra.innerHTML += renderInput("Prodotto richiesto","extra_altro","Descrivi cosa ti serve");
  }

  campoExtra.innerHTML += renderSelect("Consegna","tipo_consegna",["A domicilio","Presso la tua azienda"]);
}

if (selectProdotto) {
  selectProdotto.addEventListener('change', (e) => creaCampoExtra(e.target.value));
  if (selectProdotto.value) creaCampoExtra(selectProdotto.value);
}


// ============================
// JSONP helper (GitHub Pages / CORS)
// ============================
function jsonp(url, timeoutMs = 12000){
  return new Promise((resolve, reject)=>{
    const cb = "__lead_cb_" + Math.random().toString(36).slice(2);
    const s = document.createElement("script");
    let t = setTimeout(()=>{
      cleanup();
      reject(new Error("Timeout richiesta"));
    }, timeoutMs);

    function cleanup(){
      clearTimeout(t);
      try { delete window[cb]; } catch(e) { window[cb] = undefined; }
      if (s && s.parentNode) s.parentNode.removeChild(s);
    }

    window[cb] = (data)=>{ cleanup(); resolve(data); };
    s.onerror = ()=>{ cleanup(); reject(new Error("Errore JSONP")); };

    const full = url + (url.includes("?") ? "&" : "?")
      + "callback=" + encodeURIComponent(cb)
      + "&t=" + Date.now();

    s.src = full;
    document.body.appendChild(s);
  });
}

function collectExtrasReadable(){
  if (!campoExtra) return "";
  const nodes = campoExtra.querySelectorAll("select, input, textarea");
  const parts = [];
  nodes.forEach(el=>{
    const val = (el.value || "").trim();
    if (!val) return;
    const wrap = el.closest("div");
    const label = wrap ? (wrap.querySelector("label")?.textContent || "").trim() : "";
    parts.push(label ? `${label}: ${val}` : val);
  });
  return parts.join(" | ");
}


// ============================
// SUBMIT PREVENTIVO (salva lead + apre WhatsApp)
// ============================
const form = document.querySelector('#preventivoForm');
function safe(selector){
  const el = form?.querySelector(selector);
  return (el?.value || "").trim();
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = safe('#nome');
    const telefono = safe('#telefono');
    const prodotto = safe('#cereale');
    const quantita = safe('#quantita');
    const comune = safe('#comune');
    const note = safe('#note');
    const extra = collectExtrasReadable();

    const leadUrl =
      LEAD_API +
      "?action=lead" +
      "&nome=" + encodeURIComponent(nome) +
      "&telefono=" + encodeURIComponent(telefono) +
      "&cereale=" + encodeURIComponent(prodotto) +
      "&extra=" + encodeURIComponent(extra) +
      "&quantita=" + encodeURIComponent(quantita) +
      "&comune=" + encodeURIComponent(comune) +
      "&note=" + encodeURIComponent(note) +
      "&pagina=" + encodeURIComponent(location.href);

    try { await jsonp(leadUrl); }
    catch(err){ console.warn("Lead non salvato:", err.message); }

    const msg =
`Ciao AgroTritura!
Vorrei un preventivo per mangime su misura.

📌 Dettagli ordine:
- Prodotto: ${prodotto || "-"}
- Quantità: ${quantita || "-"}
- Comune/Indirizzo: ${comune || "-"}${telefono ? `\n- Telefono: ${telefono}` : ""}${nome ? `\n- Nome: ${nome}` : ""}

🔧 Dettagli specifici:
- ${extra || "-"}

📝 Note:
${note || "-"}

Grazie!`;

    window.open("https://wa.me/393341067510?text=" + encodeURIComponent(msg), "_blank");
  });
}


// ============================
// SLIDER PRO (TUTTE LE SEZIONI): frecce + pallini auto
// Funziona su: .gridScroll e .galleryScroll
// ============================
(function initAllSliders(){
  const tracks = Array.from(document.querySelectorAll(".gridScroll, .galleryScroll"));
  if (tracks.length === 0) return;

  // Crea controlli in DOM (senza toccare HTML file)
  tracks.forEach((track, idx) => {
    // crea wrapper se non c'è
    let wrap = track.closest(".sliderWrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "sliderWrap";
      track.parentNode.insertBefore(wrap, track);
      wrap.appendChild(track);
    }

    // bottoni
    let prev = wrap.querySelector(".sliderBtn.prev");
    let next = wrap.querySelector(".sliderBtn.next");
    if (!prev) {
      prev = document.createElement("button");
      prev.className = "sliderBtn prev";
      prev.type = "button";
      prev.setAttribute("aria-label", "Indietro");
      prev.textContent = "‹";
      wrap.appendChild(prev);
    }
    if (!next) {
      next = document.createElement("button");
      next.className = "sliderBtn next";
      next.type = "button";
      next.setAttribute("aria-label", "Avanti");
      next.textContent = "›";
      wrap.appendChild(next);
    }

    // dots
    let dots = wrap.querySelector(".sliderDots");
    if (!dots) {
      dots = document.createElement("div");
      dots.className = "sliderDots";
      wrap.appendChild(dots);
    }

    // elementi “slide”
    const items = Array.from(track.children).filter(el =>
      el.classList.contains("feature") || el.classList.contains("g-item") || el.classList.contains("card")
    );
    if (items.length === 0) return;

    function getStep(){
      const first = items[0];
      const gap = parseFloat(getComputedStyle(track).gap || getComputedStyle(track).columnGap || 12) || 12;
      return first.getBoundingClientRect().width + gap;
    }

    function currentIndex(){
      const step = getStep();
      return Math.max(0, Math.min(items.length - 1, Math.round(track.scrollLeft / step)));
    }

    function setActive(i){
      const btns = Array.from(dots.querySelectorAll("button"));
      btns.forEach((b, k)=> b.classList.toggle("active", k === i));
    }

    function scrollToIndex(i){
      const step = getStep();
      track.scrollTo({ left: i * step, behavior: "smooth" });
      setActive(i);
    }

    // crea pallini
    function rebuildDots(){
      dots.innerHTML = items.map((_, i)=> `<button type="button" class="sliderDot" aria-label="Vai alla slide ${i+1}" data-i="${i}"></button>`).join("");
      setActive(currentIndex());
    }

    dots.addEventListener("click", (e)=>{
      const b = e.target.closest("button[data-i]");
      if (!b) return;
      scrollToIndex(parseInt(b.dataset.i, 10));
    });

    prev.addEventListener("click", ()=>{
      scrollToIndex(Math.max(0, currentIndex() - 1));
    });

    next.addEventListener("click", ()=>{
      scrollToIndex(Math.min(items.length - 1, currentIndex() + 1));
    });

    let t;
    track.addEventListener("scroll", ()=>{
      clearTimeout(t);
      t = setTimeout(()=> setActive(currentIndex()), 60);
    }, { passive:true });

    function updateActiveState(){
      // attiva controlli solo se c'è overflow
      const hasOverflow = track.scrollWidth > (track.clientWidth + 2);
      wrap.classList.toggle("sliderActive", hasOverflow);
      if (hasOverflow) rebuildDots();
    }

    // prima init + su resize
    updateActiveState();
    window.addEventListener("resize", updateActiveState);
  });
})();
