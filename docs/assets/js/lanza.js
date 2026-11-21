// Si un enlace apunta a algo dentro de una pestaña oculta (por ejemplo, una tabla
// de Tesoro de otro tier), abre esa pestaña y baja hasta el destino.
(function () {
  function abrirDestino() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    var bloque = el.closest(".tabbed-block");
    if (!bloque) return;
    var set = bloque.closest(".tabbed-set");
    var bloques = Array.prototype.slice.call(set.querySelector(".tabbed-content").children);
    var entradas = set.querySelectorAll(":scope > input");
    var i = bloques.indexOf(bloque);
    if (entradas[i] && !entradas[i].checked) entradas[i].click();
    setTimeout(function () { el.scrollIntoView(); }, 30);
  }
  window.addEventListener("hashchange", abrirDestino);
  window.addEventListener("load", abrirDestino);
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href*='#']");
    if (!a || a.pathname !== location.pathname) return;
    setTimeout(abrirDestino, 0);
  });
})();

// Descripciones flotantes de objetos (Tesoro y Mercado).
// Los textos viven en assets/data/objetos.json: clave = nombre exacto de la tabla.
(function () {
  if (!/\/documentos\/(tesoro|mercado)\//.test(location.pathname)) return;
  var script = document.querySelector("script[src*='assets/js/lanza.js']");
  if (!script) return;
  var url = script.src.replace(/js\/lanza\.js.*$/, "data/objetos.json");
  var globo = null;

  function limpiar(t) { return t.replace(/\s*\*$/, "").replace(/\s+/g, " ").trim(); }

  function mostrar(celda) {
    if (!globo) {
      globo = document.createElement("div");
      globo.className = "objeto-globo";
      globo.setAttribute("role", "tooltip");
      document.body.appendChild(globo);
    }
    globo.textContent = celda.getAttribute("data-desc");
    globo.style.display = "block";
    var r = celda.getBoundingClientRect();
    var ancho = Math.min(340, window.innerWidth - 24);
    globo.style.maxWidth = ancho + "px";
    var x = Math.min(Math.max(12, r.left), window.innerWidth - ancho - 12);
    var y = r.bottom + 8;
    if (y + globo.offsetHeight > window.innerHeight - 8) y = r.top - globo.offsetHeight - 8;
    globo.style.left = x + "px";
    globo.style.top = y + "px";
  }
  function ocultar() { if (globo) globo.style.display = "none"; }

  fetch(url).then(function (r) { return r.json(); }).then(function (D) {
    document.querySelectorAll(".md-typeset table td").forEach(function (td) {
      var txt = td.textContent.replace(/\s+/g, " ").trim();
      var d = D[txt] || D[limpiar(txt)];
      if (!d) return;
      td.setAttribute("data-desc", d);
      td.classList.add("con-desc");
      td.tabIndex = 0;
      td.addEventListener("mouseenter", function () { mostrar(td); });
      td.addEventListener("mouseleave", ocultar);
      td.addEventListener("focus", function () { mostrar(td); });
      td.addEventListener("blur", ocultar);
    });
    window.addEventListener("scroll", ocultar, { passive: true });
  });
})();

// Interacción de jugadores: formulario, tablón y comentarios.
// Los enlaces se configuran en assets/data/interaccion.json. Si un campo está vacío, esa parte no se muestra.
(function () {
  var script = document.querySelector("script[src*='assets/js/lanza.js']");
  if (!script) return;
  var raiz = script.src.replace(/assets\/js\/lanza\.js.*$/, "");

  function marco(url, titulo, alto) {
    var f = document.createElement("iframe");
    f.src = url; f.title = titulo; f.loading = "lazy";
    f.className = "lz-marco"; f.style.height = alto + "px";
    return f;
  }

  function comentarios(appId) {
    var articulo = document.querySelector("article.md-content__inner");
    var ruta = location.href.split("#")[0].split("?")[0].replace(raiz, "");
    if (!articulo || ruta === "" || ruta === "index.html" || ruta.indexOf("404") === 0) return;
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

  fetch(raiz + "assets/data/interaccion.json", { cache: "no-cache" })
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
})();
