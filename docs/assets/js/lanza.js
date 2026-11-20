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
