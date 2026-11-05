/* AgroTritura — viewer with explicit zoom buttons and drag/pan at zoom > 1 */
(function () {
  "use strict";
  if (window.AgroPhotoZoom) return;
  let dialog, image, view, title, plus, minus, reset, percent;
  let scale = 1, offsetX = 0, offsetY = 0, drag = null, previousOverflow = "";
  const MIN = 1, MAX = 5, STEP = .5;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function update() {
    if (!image) return;
    if (scale === 1) { offsetX = 0; offsetY = 0; }
    // Keep panning reasonably inside the visible viewer.
    const boundX = (view.clientWidth * (scale - 1)) / 2;
    const boundY = (view.clientHeight * (scale - 1)) / 2;
    offsetX = clamp(offsetX, -boundX, boundX);
    offsetY = clamp(offsetY, -boundY, boundY);
    image.style.transform = "translate(" + offsetX + "px," + offsetY + "px) scale(" + scale + ")";
    percent.textContent = Math.round(scale * 100) + "%";
    plus.disabled = scale >= MAX;
    minus.disabled = scale <= MIN;
    reset.disabled = scale === 1 && offsetX === 0 && offsetY === 0;
  }
  function changeZoom(value) { scale = clamp(value, MIN, MAX); update(); }
  function ensure() {
    if (dialog) return;
    dialog = document.createElement("dialog");
    dialog.className = "at-photo-zoom";
    dialog.setAttribute("aria-label", "Ingrandimento fotografia");
    dialog.innerHTML =
      '<div class="at-photo-zoom__bar">' +
        '<div class="at-photo-zoom__title"></div>' +
        '<div class="at-photo-zoom__actions">' +
          '<button type="button" class="at-photo-zoom__minus" title="Riduci" aria-label="Riduci immagine">−</button>' +
          '<span class="at-photo-zoom__percent" aria-live="polite">100%</span>' +
          '<button type="button" class="at-photo-zoom__plus" title="Ingrandisci" aria-label="Ingrandisci immagine">+</button>' +
          '<button type="button" class="at-photo-zoom__reset" title="Ripristina" aria-label="Dimensione originale">↺</button>' +
          '<button type="button" class="at-photo-zoom__close" title="Chiudi" aria-label="Chiudi immagine">×</button>' +
        '</div>' +
      '</div>' +
      '<div class="at-photo-zoom__view"><img class="at-photo-zoom__img" alt=""></div>' +
      '<div class="at-photo-zoom__foot">Usa + e − per ingrandire · Trascina per esplorare il campione · ↺ per ripristinare</div>';
    document.body.appendChild(dialog);
    image = dialog.querySelector(".at-photo-zoom__img");
    view = dialog.querySelector(".at-photo-zoom__view");
    title = dialog.querySelector(".at-photo-zoom__title");
    percent = dialog.querySelector(".at-photo-zoom__percent");
    plus = dialog.querySelector(".at-photo-zoom__plus");
    minus = dialog.querySelector(".at-photo-zoom__minus");
    reset = dialog.querySelector(".at-photo-zoom__reset");
    plus.addEventListener("click", () => changeZoom(scale + STEP));
    minus.addEventListener("click", () => changeZoom(scale - STEP));
    reset.addEventListener("click", () => { offsetX = 0; offsetY = 0; changeZoom(1); });
    dialog.querySelector(".at-photo-zoom__close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("cancel", () => { drag = null; });
    dialog.addEventListener("close", () => {
      drag = null; document.documentElement.style.overflow = previousOverflow;
      image.removeAttribute("src");
    });
    dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener("keydown", e => {
      if (e.key === "+" || e.key === "=") { e.preventDefault(); changeZoom(scale + STEP); }
      if (e.key === "-") { e.preventDefault(); changeZoom(scale - STEP); }
      if (e.key === "0") { e.preventDefault(); changeZoom(1); }
    });
    view.addEventListener("pointerdown", e => {
      if (scale <= 1 || e.button !== 0) return;
      drag = { id:e.pointerId, x:e.clientX, y:e.clientY, startX:offsetX, startY:offsetY };
      try { view.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    });
    view.addEventListener("pointermove", e => {
      if (!drag || drag.id !== e.pointerId) return;
      offsetX = drag.startX + e.clientX - drag.x;
      offsetY = drag.startY + e.clientY - drag.y;
      update();
    });
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) {
      view.addEventListener(event, () => { drag = null; });
    }
    view.addEventListener("dblclick", e => {
      e.preventDefault(); changeZoom(scale > 1 ? 1 : 2);
    });
    update();
  }
  window.AgroPhotoZoom = {
    open(src, caption) {
      if (typeof src !== "string" || !src || /^(javascript:|data:text\/html)/i.test(src)) return;
      ensure();
      scale = 1; offsetX = 0; offsetY = 0; drag = null;
      title.textContent = caption || "Fotografia AgroTritura";
      image.src = src;
      image.alt = caption || "Fotografia";
      update();
      if (!dialog.open) {
        previousOverflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = "hidden";
        dialog.showModal();
      }
    },
    close() { if (dialog?.open) dialog.close(); }
  };
})();
