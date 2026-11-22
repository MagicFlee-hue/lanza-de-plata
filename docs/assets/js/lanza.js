/* ============================================================
   La Lanza de Plata — scripts del sitio
   Todo es opcional: si un bloque no encuentra lo que busca, no hace nada.
   ============================================================ */
(function () {
  "use strict";

  var script = document.querySelector("script[src*='assets/js/lanza.js']");
  var RAIZ = script ? script.src.replace(/assets\/js\/lanza\.js.*$/, "") : "/";
  var LZ = window.LZ = window.LZ || {};
  LZ.raiz = RAIZ;

  function normalizar(t) {
    return (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
  }
  LZ.normalizar = normalizar;

  function cuandoListo(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  /* ---------- Pestañas: abrir la pestaña donde está un destino ---------- */
  function abrirPestanaDe(el) {
    var bloque = el.closest(".tabbed-block");
    while (bloque) {
      var set = bloque.closest(".tabbed-set");
      var bloques = Array.prototype.slice.call(set.querySelector(".tabbed-content").children);
      var entradas = set.querySelectorAll(":scope > input");
      var i = bloques.indexOf(bloque);
      if (entradas[i] && !entradas[i].checked) entradas[i].click();
      bloque = set.parentElement && set.parentElement.closest(".tabbed-block");
    }
  }
  function irA(el, destello) {
    abrirPestanaDe(el);
    setTimeout(function () {
      el.scrollIntoView({ block: destello ? "center" : "start" });
      if (destello) {
        el.classList.remove("lz-destello");
        void el.offsetWidth;
        el.classList.add("lz-destello");
      }
    }, 40);
  }
  LZ.irA = irA;

  function abrirDestino() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var el = document.getElementById(id);
    if (el && el.closest(".tabbed-block")) irA(el);
  }
  window.addEventListener("hashchange", abrirDestino);
  window.addEventListener("load", abrirDestino);
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href*='#']");
    if (!a || a.pathname !== location.pathname) return;
    setTimeout(abrirDestino, 0);
  });

  /* ---------- Globo flotante compartido ---------- */
  var globo = null, duenoGlobo = null;
  function crearGlobo() {
    globo = document.createElement("div");
    globo.className = "lz-globo";
    globo.setAttribute("role", "tooltip");
    globo.id = "lz-globo";
    document.body.appendChild(globo);
  }
  function mostrarGlobo(el, texto, titulo, variante) {
    if (!globo) crearGlobo();
    globo.className = "lz-globo" + (variante ? " lz-globo--" + variante : "");
    globo.replaceChildren();
    if (titulo) {
      var t = document.createElement("b");
      t.textContent = titulo;
      globo.appendChild(t);
    }
    var p = document.createElement("span");
    p.textContent = texto;
    globo.appendChild(p);
    globo.style.display = "block";
    duenoGlobo = el;
    el.setAttribute("aria-describedby", "lz-globo");
    var r = el.getBoundingClientRect();
    var ancho = Math.min(340, window.innerWidth - 24);
    globo.style.maxWidth = ancho + "px";
    var w = globo.offsetWidth;
    var x = Math.min(Math.max(12, r.left), window.innerWidth - w - 12);
    var y = r.bottom + 8;
    if (y + globo.offsetHeight > window.innerHeight - 8) y = Math.max(8, r.top - globo.offsetHeight - 8);
    globo.style.left = x + "px";
    globo.style.top = y + "px";
  }
  function ocultarGlobo() {
    if (globo) globo.style.display = "none";
    if (duenoGlobo) duenoGlobo.removeAttribute("aria-describedby");
    duenoGlobo = null;
  }
  function conGlobo(el, texto, titulo, variante) {
    if (!el.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT)$/.test(el.tagName)) el.tabIndex = 0;
    el.addEventListener("mouseenter", function () { mostrarGlobo(el, texto, titulo, variante); });
    el.addEventListener("mouseleave", ocultarGlobo);
    el.addEventListener("focus", function () { mostrarGlobo(el, texto, titulo, variante); });
    el.addEventListener("blur", ocultarGlobo);
    el.addEventListener("click", function (e) {
      if (el.tagName === "A") return;
      e.stopPropagation();
      if (duenoGlobo === el && globo.style.display === "block") ocultarGlobo();
      else mostrarGlobo(el, texto, titulo, variante);
    });
  }
  LZ.conGlobo = conGlobo;
  LZ.ocultarGlobo = ocultarGlobo;
  window.addEventListener("scroll", ocultarGlobo, { passive: true });
  document.addEventListener("click", ocultarGlobo);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") ocultarGlobo(); });

  /* ---------- Descripciones de objetos (assets/data/objetos.json) ---------- */
  var objetosPromesa = null;
  LZ.objetos = function () {
    if (!objetosPromesa) {
      objetosPromesa = fetch(RAIZ + "assets/data/objetos.json")
        .then(function (r) { return r.json(); })
        .catch(function () { return {}; });
    }
    return objetosPromesa;
  };
  LZ.descripcionObjeto = function (D, nombre) {
    var t = (nombre || "").replace(/\s+/g, " ").trim();
    return D[t] || D[t.replace(/\s*\*$/, "")] || D[t.replace(/\s*\(\d+\)$/, "")] || null;
  };
  cuandoListo(function () {
    if (!/\/documentos\/(tesoro|tesoro-facciones|mercado)\//.test(location.pathname)) return;
    LZ.objetos().then(function (D) {
      document.querySelectorAll(".md-typeset table td").forEach(function (td) {
        var d = LZ.descripcionObjeto(D, td.textContent);
        if (!d) return;
        td.classList.add("con-desc");
        conGlobo(td, d);
      });
    });
  });

  /* ---------- Consejos del DM: <span class="dm-consejo" data-tip="..."></span> ---------- */
  cuandoListo(function () {
    document.querySelectorAll(".dm-consejo[data-tip]").forEach(function (s) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "dm-consejo";
      b.setAttribute("aria-label", "Consejo del DM");
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 2h6v2h-1v1.1A6 6 0 0 1 18 11v6l2 3H4l2-3v-6a6 6 0 0 1 4-5.9V4H9zm3 6a1.6 1.6 0 0 0-1.6 1.6c0 .9 1.6 3.4 1.6 3.4s1.6-2.5 1.6-3.4A1.6 1.6 0 0 0 12 8m-2 13h4a2 2 0 0 1-4 0"/></svg><span>DM</span>';
      conGlobo(b, s.getAttribute("data-tip"), "Consejo del DM", "dm");
      s.replaceWith(b);
    });
  });

  /* ---------- Ordenar tablas al tocar el encabezado ---------- */
  var UNIDADES = { pc: 1, cp: 1, pp: 10, sp: 10, pe: 50, ep: 50, po: 100, gp: 100, ppt: 1000, pt: 1000, pl: 1000 };
  function valorNumerico(t) {
    t = (t || "").replace(/\u00a0/g, " ").trim();
    if (!t || t === "—" || t === "-") return null;
    var m = t.match(/(\d[\d.,]*)\s*(pc|cp|pp|sp|pe|ep|po|gp|ppt|pl)?\b/i);
    if (!m) return null;
    var n = m[1];
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(n)) n = n.replace(/\./g, "").replace(",", ".");
    else n = n.replace(",", ".");
    var v = parseFloat(n);
    if (isNaN(v)) return null;
    var u = (m[2] || "").toLowerCase();
    return v * (UNIDADES[u] || 1);
  }
  function hacerOrdenable(tabla) {
    var cuerpo = tabla.tBodies[0];
    if (!cuerpo || cuerpo.rows.length < 6 || !tabla.tHead) return;
    var ths = tabla.tHead.rows[0].cells;
    Array.prototype.forEach.call(ths, function (th, col) {
      th.classList.add("lz-ordenable");
      th.tabIndex = 0;
      th.title = "Ordenar por esta columna";
      function ordenar() {
        var filas = Array.prototype.slice.call(cuerpo.rows);
        if (!cuerpo._orden) cuerpo._orden = filas.slice();
        var estado = th.getAttribute("aria-sort");
        var siguiente = estado === "ascending" ? "descending" : estado === "descending" ? "none" : "ascending";
        Array.prototype.forEach.call(ths, function (o) { o.removeAttribute("aria-sort"); });
        if (siguiente === "none") {
          cuerpo._orden.forEach(function (f) { cuerpo.appendChild(f); });
          return;
        }
        th.setAttribute("aria-sort", siguiente);
        var celdas = filas.map(function (f) { return f.cells[col] ? f.cells[col].textContent : ""; });
        var nums = celdas.map(valorNumerico);
        var llenas = celdas.filter(function (c) { return c.trim() && c.trim() !== "—"; }).length;
        var numericas = nums.filter(function (n) { return n !== null; }).length;
        var esNum = llenas > 0 && numericas / llenas >= 0.6;
        var dir = siguiente === "ascending" ? 1 : -1;
        var idx = filas.map(function (f, i) { return i; });
        idx.sort(function (a, b) {
          if (esNum) {
            var x = nums[a], y = nums[b];
            if (x === null && y === null) return a - b;
            if (x === null) return 1;
            if (y === null) return -1;
            return (x - y) * dir || a - b;
          }
          return celdas[a].localeCompare(celdas[b], "es", { sensitivity: "base", numeric: true }) * dir || a - b;
        });
        idx.forEach(function (i) { cuerpo.appendChild(filas[i]); });
      }
      th.addEventListener("click", ordenar);
      th.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ordenar(); } });
    });
  }
  cuandoListo(function () {
    document.querySelectorAll("article .md-typeset__table table, article table").forEach(function (t) {
      if (t.dataset.lzOrden) return;
      t.dataset.lzOrden = "1";
      if (t.closest(".tesoro-indice, .pj-ficha")) return;
      hacerOrdenable(t);
    });
  });

  /* ---------- Buscador dentro de la página: <div class="lz-buscar"></div> ---------- */
  function contextoDe(tabla, titulos) {
    var h = null;
    for (var i = 0; i < titulos.length; i++) {
      if (titulos[i].compareDocumentPosition(tabla) & Node.DOCUMENT_POSITION_FOLLOWING) h = titulos[i];
      else break;
    }
    var partes = [];
    var bloque = tabla.closest(".tabbed-block");
    if (bloque) {
      var set = bloque.closest(".tabbed-set");
      var i2 = Array.prototype.indexOf.call(set.querySelector(".tabbed-content").children, bloque);
      var lab = set.querySelectorAll(".tabbed-labels > label")[i2];
      if (lab) partes.push(lab.textContent.trim());
    }
    if (h) partes.push(h.textContent.replace(/¶$/, "").trim());
    return partes.join(" · ");
  }
  function construirBuscador(caja) {
    var articulo = caja.closest("article") || document;
    var titulos = Array.prototype.slice.call(articulo.querySelectorAll("h2, h3"));
    var filas = [];
    articulo.querySelectorAll("table").forEach(function (tabla) {
      if (tabla.closest(".tesoro-indice")) return;
      var heads = tabla.tHead ? Array.prototype.map.call(tabla.tHead.rows[0].cells, function (c) { return c.textContent.trim(); }) : [];
      var ctx = contextoDe(tabla, titulos);
      var col = heads.length > 1 && /^(d\d+|#|nivel|tabla|asiento)/i.test(heads[0]) ? 1 : 0;
      Array.prototype.forEach.call(tabla.tBodies[0] ? tabla.tBodies[0].rows : [], function (tr) {
        var celdas = Array.prototype.map.call(tr.cells, function (c) { return c.textContent.replace(/\s+/g, " ").trim(); });
        if (!celdas.length) return;
        var nombre = celdas[col] || celdas[0];
        var resto = [];
        celdas.forEach(function (c, i) {
          if (i === col || !c || c === "—") return;
          resto.push((heads[i] ? heads[i] + ": " : "") + c);
        });
        filas.push({ tr: tr, nombre: nombre, resto: resto.join(" · "), ctx: ctx, clave: normalizar(celdas.join(" ") + " " + ctx) });
      });
    });

    // Suma la descripción de cada objeto, para poder buscar en español ("curación", "vuelo"…).
    LZ.objetos().then(function (D) {
      filas.forEach(function (f) {
        var d = LZ.descripcionObjeto(D, f.nombre);
        if (d) f.clave += " " + normalizar(d);
      });
    });

    caja.classList.add("lz-buscar--listo");
    var etiqueta = document.createElement("label");
    etiqueta.className = "lz-buscar__campo";
    var icono = document.createElement("span");
    icono.className = "lz-buscar__icono";
    icono.setAttribute("aria-hidden", "true");
    var entrada = document.createElement("input");
    entrada.type = "search";
    entrada.placeholder = caja.getAttribute("data-placeholder") || "Busca en esta página…";
    entrada.setAttribute("aria-label", entrada.placeholder);
    entrada.autocomplete = "off";
    etiqueta.appendChild(icono);
    etiqueta.appendChild(entrada);
    var lista = document.createElement("ol");
    lista.className = "lz-buscar__resultados";
    lista.setAttribute("aria-live", "polite");
    var nota = document.createElement("p");
    nota.className = "lz-buscar__nota";
    caja.replaceChildren(etiqueta, nota, lista);

    function pintar() {
      var q = normalizar(entrada.value);
      lista.replaceChildren();
      nota.textContent = "";
      if (q.length < 2) return;
      var palabras = q.split(" ");
      var hallados = filas.filter(function (f) {
        return palabras.every(function (p) { return f.clave.indexOf(p) >= 0; });
      });
      nota.textContent = hallados.length === 0 ? "Sin resultados. Prueba con el nombre en inglés o con menos letras."
        : hallados.length === 1 ? "1 resultado" : hallados.length + " resultados" + (hallados.length > 40 ? " (se muestran 40)" : "");
      hallados.slice(0, 40).forEach(function (f) {
        var li = document.createElement("li");
        var b = document.createElement("button");
        b.type = "button";
        var n = document.createElement("b"); n.textContent = f.nombre;
        var r = document.createElement("span"); r.textContent = f.resto;
        var c = document.createElement("small"); c.textContent = f.ctx;
        b.appendChild(n);
        if (f.resto) b.appendChild(r);
        if (f.ctx) b.appendChild(c);
        b.addEventListener("click", function () { irA(f.tr, true); });
        li.appendChild(b);
        lista.appendChild(li);
      });
    }
    entrada.addEventListener("input", pintar);
    entrada.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var primero = lista.querySelector("button");
        if (primero) { e.preventDefault(); primero.click(); }
      }
    });
  }
  cuandoListo(function () {
    document.querySelectorAll(".lz-buscar").forEach(construirBuscador);
  });

  /* ---------- Formulario, tablón y comentarios (assets/data/interaccion.json) ---------- */
  function marco(url, titulo, alto) {
    var f = document.createElement("iframe");
    f.src = url; f.title = titulo; f.loading = "lazy";
    f.className = "lz-marco"; f.style.height = alto + "px";
    return f;
  }
  function comentarios(appId) {
    var articulo = document.querySelector("article.md-content__inner");
    var ruta = location.href.split("#")[0].split("?")[0].replace(RAIZ, "");
    if (!articulo || ruta === "" || ruta === "index.html" || ruta.indexOf("404") === 0 || ruta.indexOf("personajes/ficha") === 0) return;
    var caja = document.createElement("section");
    caja.className = "lz-comentarios";
    var h = document.createElement("h2"); h.textContent = "Comentarios"; caja.appendChild(h);
    var p = document.createElement("p");
    p.textContent = "Pon tu nombre o el de tu personaje. No pongas datos personales. El DM revisa cada comentario antes de publicarlo.";
    caja.appendChild(p);
    var hilo = document.createElement("div");
    hilo.id = "cusdis_thread";
    hilo.setAttribute("data-host", "https://cusdis.com");
    hilo.setAttribute("data-app-id", appId);
    hilo.setAttribute("data-page-id", ruta);
    hilo.setAttribute("data-page-url", location.href.split("#")[0]);
    hilo.setAttribute("data-page-title", document.title);
    hilo.setAttribute("data-theme", "dark");
    caja.appendChild(hilo);
    articulo.appendChild(caja);
    var idioma = document.createElement("script");
    idioma.src = "https://cusdis.com/js/widget/lang/es.js";
    idioma.onload = idioma.onerror = function () {
      var s = document.createElement("script");
      s.src = "https://cusdis.com/js/cusdis.es.js"; s.async = true;
      document.body.appendChild(s);
    };
    document.body.appendChild(idioma);
  }
  cuandoListo(function () {
    fetch(RAIZ + "assets/data/interaccion.json", { cache: "no-cache" })
      .then(function (r) { return r.json(); })
      .then(function (C) {
        document.querySelectorAll(".lz-embed[data-campo]").forEach(function (div) {
          var url = (C[div.getAttribute("data-campo")] || "").trim();
          if (!url) return;
          if (div.getAttribute("data-campo") === "formulario") {
            if (url.indexOf("embedded=true") < 0) url += (url.indexOf("?") < 0 ? "?" : "&") + "embedded=true";
            div.replaceChildren(marco(url, "Formulario de solicitudes", 1100));
          } else {
            div.replaceChildren(marco(url, "Tablón de solicitudes", 520));
          }
        });
        var appId = (C.cusdis_app_id || "").trim();
        if (appId) comentarios(appId);
      })
      .catch(function () {});
  });
})();
