// ============================
// MENU MOBILE
// ============================
const hamb = document.querySelector('[data-hamb]');
const panel = document.querySelector('[data-mobile-panel]');

if (hamb && panel) {
  hamb.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('show');
    hamb.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    // Nasconde il bottone WhatsApp quando il menu è aperto
    document.body.classList.toggle('menu-open', isOpen);
  });
}

// ============================
// CONFIG: URL APPS SCRIPT
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

  // ----- CAMPI SPECIFICI PRODOTTO -----
  if (["Mais", "Orzo", "Avena"].includes(prodotto)) {
    campoExtra.innerHTML += renderSelect("Granulometria desiderata", "extra_granulometria", ["Grossa", "Media", "Fine"]);
  } else if (prodotto === "Frumento") {
    campoExtra.innerHTML += renderSelect("Animali destinatari", "extra_animali", ["Bovini", "Suini", "Pollame", "Ovini", "Altro"]);
  } else if (prodotto === "Grana verde") {
    campoExtra.innerHTML += renderSelect("Formato grana verde", "extra_formato_grana", ["Intero", "Tritato"]);
    campoExtra.innerHTML += `<div id="wrapGranaGranulo"></div>`;

    const formatoSel = campoExtra.querySelector('[name="extra_formato_grana"]');
    const wrap = campoExtra.querySelector('#wrapGranaGranulo');

    if (formatoSel && wrap) {
      const update = () => {
        if (formatoSel.value === "Tritato") {
          wrap.innerHTML = renderSelect("Granulometria", "extra_granulometria_grana", ["Grossa", "Media", "Fine"]);
        } else {
          wrap.innerHTML = "";
        }
      };
      formatoSel.addEventListener("change", update);
      update();
    }
  } else if (prodotto === "Mix personalizzato") {
    campoExtra.innerHTML += renderInput("Composizione del mix", "extra_mix", "Es. mais + orzo + frumento");
  } else if (prodotto === "Altro / da definire") {
    campoExtra.innerHTML += renderInput("Prodotto richiesto", "extra_altro", "Descrivi cosa ti serve");
  }

  // ----- CONSEGNA (per tutti) -----
  campoExtra.innerHTML += renderSelect("Consegna", "tipo_consegna", ["A domicilio", "Presso la tua azienda"]);
}

if (selectProdotto) {
  selectProdotto.addEventListener('change', (e) => creaCampoExtra(e.target.value));
  if (selectProdotto.value) creaCampoExtra(selectProdotto.value);
}

// ============================
// JSONP helper (GitHub Pages)
// ============================
function jsonp(url, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const cb = "__lead_cb_" + Math.random().toString(36).slice(2);
    const s = document.createElement("script");

    const t = setTimeout(() => {
      cleanup();
      reject(new Error("Timeout richiesta"));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(t);
      try { delete window[cb]; } catch (e) { window[cb] = undefined; }
      if (s && s.parentNode) s.parentNode.removeChild(s);
    }

    window[cb] = (data) => { cleanup(); resolve(data); };

    s.onerror = () => { cleanup(); reject(new Error("Errore JSONP")); };

    const full = url + (url.includes("?") ? "&" : "?")
      + "callback=" + encodeURIComponent(cb)
      + "&t=" + Date.now();

    s.src = full;
    document.body.appendChild(s);
  });
}

// ============================
// COLLECT EXTRA (leggibile)
// ============================
function collectExtrasReadable() {
  if (!campoExtra) return "";
  const nodes = campoExtra.querySelectorAll("select, input, textarea");
  const parts = [];

  nodes.forEach(el => {
    const val = (el.value || "").trim();
    if (!val) return;

    const wrap = el.closest("div");
    const label = wrap ? (wrap.querySelector("label")?.textContent || "").trim() : "";
    parts.push(label ? `${label}: ${val}` : val);
  });

  return parts.join(" | ");
}

// ============================
// SUBMIT PREVENTIVO
// ============================
const form = document.querySelector('#preventivoForm');

function safe(selector) {
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

    // 1) salva lead (se fallisce non blocca WhatsApp)
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
    catch (err) { console.warn("Lead non salvato:", err.message); }

    // 2) WhatsApp message
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

// =====================================================
// SLIDER PRO PER TUTTE LE SEZIONI A SCORRIMENTO
// (gridScroll + galleryScroll) -> frecce + pallini
// =====================================================
(function initAllSlidersPro() {
  const tracks = Array.from(document.querySelectorAll(".gridScroll, .galleryScroll"));
  if (!tracks.length) return;

  tracks.forEach((track, idx) => {
    const items = Array.from(track.children).filter(el => el.nodeType === 1);
    if (items.length <= 1) return;

    // wrapper
    const wrap = document.createElement("div");
    wrap.className = "sliderWrap";
    wrap.setAttribute("data-slider-wrap", String(idx));

    track.parentNode.insertBefore(wrap, track);
    wrap.appendChild(track);

    // UI
    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "sliderBtn prev";
    prev.setAttribute("aria-label", "Precedente");
    prev.innerHTML = "‹";

    const next = document.createElement("button");
    next.type = "button";
    next.className = "sliderBtn next";
    next.setAttribute("aria-label", "Successiva");
    next.innerHTML = "›";

    const dots = document.createElement("div");
    dots.className = "sliderDots";
    dots.setAttribute("aria-label", "Indicatori");

    dots.innerHTML = items.map((_, i) =>
      `<button class="sliderDot" type="button" aria-label="Vai alla slide ${i + 1}" data-dot="${i}"></button>`
    ).join("");

    wrap.appendChild(prev);
    wrap.appendChild(next);
    wrap.appendChild(dots);

    const dotBtns = Array.from(dots.querySelectorAll(".sliderDot"));

    function gapPx() {
      const cs = getComputedStyle(track);
      const g = parseFloat(cs.gap || cs.columnGap || "0");
      return Number.isFinite(g) ? g : 0;
    }

    function stepPx() {
      const r = items[0].getBoundingClientRect();
      return r.width + gapPx();
    }

    function maxIndex() {
      return items.length - 1;
    }

    function currentIndex() {
      const s = stepPx();
      if (!s) return 0;
      return Math.round(track.scrollLeft / s);
    }

    function setActiveDot(i) {
      dotBtns.forEach((b, k) => b.classList.toggle("active", k === i));
    }

    function scrollToIndex(i) {
      const s = stepPx();
      track.scrollTo({ left: i * s, behavior: "smooth" });
      setActiveDot(i);
    }

    // mostra UI solo se davvero scrolla
    function refreshOverflow() {
      const canScroll = track.scrollWidth > track.clientWidth + 6;
      wrap.classList.toggle("sliderActive", canScroll);
      if (!canScroll) setActiveDot(0);
    }

    prev.addEventListener("click", () => {
      const i = Math.max(0, currentIndex() - 1);
      scrollToIndex(i);
    });

    next.addEventListener("click", () => {
      const i = Math.min(maxIndex(), currentIndex() + 1);
      scrollToIndex(i);
    });

    dots.addEventListener("click", (e) => {
      const b = e.target.closest("[data-dot]");
      if (!b) return;
      scrollToIndex(parseInt(b.dataset.dot, 10));
    });

    let t;
    track.addEventListener("scroll", () => {
      clearTimeout(t);
      t = setTimeout(() => setActiveDot(currentIndex()), 60);
    }, { passive: true });

    window.addEventListener("resize", () => {
      refreshOverflow();
      setActiveDot(currentIndex());
    });

    // init
    setActiveDot(0);
    refreshOverflow();
  });
})();
