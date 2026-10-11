(() => {
  const originalPages = window.CATALOG_PAGES || [];
  const products = window.NEW_PRODUCTS || [];
  const placements = {
    "Utensílios de cozinha": [{ page: 5, used: 6 }],
    "Casa e utilidades": [{ page: 13, used: 6 }],
    "Beleza e cuidados pessoais": [{ page: 17, used: 3 }],
    "Acessórios automotivos": [{ page: 20, used: 3 }],
    "Fitness e treino": [{ page: 23, used: 1 }],
    "Produtos para pets": [{ page: 26, used: 2 }],
  };
  const additions = new Map(), extraPages = new Map();
  Object.entries(placements).forEach(([category, targets]) => {
    const items = products.filter(product => product.category === category);
    let cursor = 0;
    targets.forEach(target => {
      const take = Math.min(10 - target.used, items.length - cursor);
      additions.set(target.page, items.slice(cursor, cursor + take).map((product, index) => ({ product, slot: target.used + index })));
      cursor += take;
    });
    const chunks = [];
    for (let i = cursor; i < items.length; i += 10) chunks.push(items.slice(i, i + 10));
    extraPages.set(targets[targets.length - 1].page, chunks);
  });
  const pages = [];
  const posterPages = new Set([1, 2, 6, 14, 18, 21, 24, 27]);
  originalPages.forEach(page => {
    pages.push({ type: "original", ...page, additions: additions.get(page.number) || [] });
    (extraPages.get(page.number) || []).forEach(items => pages.push({ type: "new", products: items }));
  });

  const list = document.querySelector("#catalogPages");
  const pageInput = document.querySelector("#pageInput"), pageTotal = document.querySelector("#pageTotal");
  const prev = document.querySelector("#prevPage"), next = document.querySelector("#nextPage");
  const zoomOut = document.querySelector("#zoomOut"), zoomIn = document.querySelector("#zoomIn");
  const zoomValue = document.querySelector("#zoomValue"), fit = document.querySelector("#fitPage");
  let zoom = 1, current = 0;
  const money = value => value == null ? "Sob consulta" : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
  const card = (product, slot) => {
    const variant = product.variants[0] || {};
    const model = product.variants.length > 1
      ? product.variants.map(item => `<p class="variant-price"><span>${item.specification}</span><strong>R$ ${money(item.wholesalePrice)}</strong></p>`).join("")
      : (variant.specification && variant.specification !== "Padrão" ? `<p>Modelo: ${variant.specification}</p>` : "");
    const position = slot == null ? "" : ` style="grid-column:${slot % 5 + 1};grid-row:${Math.floor(slot / 5) + 1}"`;
    const cartons = [...new Set(product.variants.map(item => item.unitsPerCarton))];
    const packaging = cartons.length === 1 && cartons[0] != null ? `<p>Embalagem: ${cartons[0].toLocaleString("pt-BR")}/cx</p>` : "";
    const price = product.variants.length > 1 ? "" : `<p>Valor: ${money(variant.wholesalePrice)}</p>`;
    return `<article class="catalog-product-card" data-code="${product.code}"${position}><div class="catalog-product-image"><img src="${product.images?.[0] || ""}" alt="${product.name}"></div><div class="catalog-product-copy"><div class="product-title-line"><h2>${product.code} ${product.name}</h2><span class="new-pill">NOVO</span></div>${packaging}${model}${price}</div></article>`;
  };
  pages.forEach((page, index) => {
    const section = document.createElement("section");
    section.className = `catalog-sheet ${page.type === "new" ? "generated-sheet" : "original-sheet"}`;
    section.dataset.page = index + 1;
    if (page.type === "original") section.dataset.originalPage = page.number;
    section.id = `pagina-${index + 1}`;
    if (page.type === "original") section.innerHTML = `<img src="${page.src}" alt="Página ${index + 1} do catálogo" draggable="false">${page.additions.length ? `<div class="catalog-product-grid overlay-grid">${page.additions.map(item => card(item.product, item.slot)).join("")}</div>` : ""}${posterPages.has(page.number) ? "" : `<span class="unified-page-number">${String(index + 1).padStart(2, "0")}</span>`}`;
    else section.innerHTML = `<div class="new-product-page"><div class="catalog-product-grid">${page.products.map(product => card(product)).join("")}</div></div><span class="unified-page-number">${String(index + 1).padStart(2, "0")}</span>`;
    if (page.type === "original") {
      (window.PRICE_OVERRIDES?.[page.number] || []).forEach(patch => {
        const overlay = document.createElement("div");
        overlay.className = `original-price-override${patch.multi ? " multiple-prices" : ""}`;
        overlay.dataset.code = patch.code;
        overlay.style.cssText = `left:${patch.x / 1680 * 100}%;top:${patch.y / 1188 * 100}%;width:${patch.width / 1680 * 100}%;height:${patch.height / 1188 * 100}%;`;
        patch.lines.forEach(text => {
          const line = document.createElement("p");
          const separator = patch.multi ? text.lastIndexOf(": R$ ") : -1;
          if (separator >= 0) {
            const label = document.createElement("span");
            const value = document.createElement("strong");
            label.textContent = text.slice(0, separator);
            value.textContent = text.slice(separator + 2);
            line.append(label, value);
          } else line.textContent = text;
          overlay.append(line);
        });
        section.append(overlay);
      });
    }
    list.append(section);
  });
  const sheets = [...document.querySelectorAll(".catalog-sheet")];
  pageTotal.textContent = pages.length; pageInput.max = pages.length;
  function go(index) {
    current = Math.max(0, Math.min(index, sheets.length - 1));
    sheets[current].scrollIntoView({ behavior: "smooth", block: "start" });
    pageInput.value = current + 1; prev.disabled = current === 0; next.disabled = current === sheets.length - 1;
  }
  function applyZoom() { list.style.setProperty("--catalog-zoom", zoom); zoomValue.textContent = `${Math.round(zoom * 100)}%`; }
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    current = Number(visible.target.dataset.page) - 1; pageInput.value = current + 1;
    prev.disabled = current === 0; next.disabled = current === sheets.length - 1;
  }, { root: document.querySelector("#stage"), threshold: [.35, .6] });
  sheets.forEach(sheet => observer.observe(sheet));
  prev.addEventListener("click", () => go(current - 1)); next.addEventListener("click", () => go(current + 1));
  pageInput.addEventListener("change", () => go(Number(pageInput.value) - 1));
  zoomOut.addEventListener("click", () => { zoom = Math.max(.6, zoom - .1); applyZoom(); });
  zoomIn.addEventListener("click", () => { zoom = Math.min(1.4, zoom + .1); applyZoom(); });
  fit.addEventListener("click", () => { zoom = 1; applyZoom(); });
  document.addEventListener("keydown", event => {
    if (event.target === pageInput) return;
    if (event.key === "ArrowLeft" || event.key === "PageUp") go(current - 1);
    if (event.key === "ArrowRight" || event.key === "PageDown") go(current + 1);
  });
  go(0);
})();
