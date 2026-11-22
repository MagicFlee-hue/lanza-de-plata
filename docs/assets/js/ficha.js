/* ============================================================
   La Lanza de Plata — galería y ficha interactiva de personajes
   Datos: assets/data/personajes/lista.json y assets/data/personajes/<id>.json
   Retratos: assets/img/personajes/
   Lo que el jugador marca (PG, espacios, recursos…) se guarda solo en su navegador.
   ============================================================ */
(function () {
  "use strict";

  var galeria = document.querySelector(".pj-galeria");
  var ficha = document.querySelector(".pj-ficha");
  if (!galeria && !ficha) return;

  var script = document.querySelector("script[src*='assets/js/ficha.js']");
  var RAIZ = script ? script.src.replace(/assets\/js\/ficha\.js.*$/, "") : "/";
  var DATOS = RAIZ + "assets/data/personajes/";
  var RETRATOS = RAIZ + "assets/img/personajes/";
  var CONJURO_URL = "https://5e.tools/spells.html#";

  /* ---------- Reglas base (PHB 2024) ---------- */
  var DADOS = { "Artífice": 8, "Bárbaro": 12, "Bardo": 8, "Brujo": 8, "Clérigo": 8, "Druida": 8, "Explorador": 10,
    "Guerrero": 10, "Hechicero": 6, "Mago": 6, "Monje": 8, "Paladín": 10, "Pícaro": 8 };
  var CARACS = [["FUE", "Fuerza"], ["DES", "Destreza"], ["CON", "Constitución"], ["INT", "Inteligencia"], ["SAB", "Sabiduría"], ["CAR", "Carisma"]];
  var HABILIDADES = [
    ["Acrobacias", "DES"], ["Arcanos", "INT"], ["Atletismo", "FUE"], ["Engaño", "CAR"], ["Historia", "INT"],
    ["Interpretación", "CAR"], ["Intimidación", "CAR"], ["Investigación", "INT"], ["Juego de Manos", "DES"],
    ["Medicina", "SAB"], ["Naturaleza", "INT"], ["Percepción", "SAB"], ["Perspicacia", "SAB"], ["Persuasión", "CAR"],
    ["Religión", "INT"], ["Sigilo", "DES"], ["Supervivencia", "SAB"], ["Trato con Animales", "SAB"]];
  var CONDICIONES = [
    ["Agarrado", "Tu velocidad es 0. Desventaja al atacar a cualquiera que no sea quien te agarra. Te puede mover consigo."],
    ["Apresado", "Velocidad 0. Desventaja en tus ataques y en salvaciones de Destreza; los ataques contra ti tienen ventaja."],
    ["Asustado", "Desventaja en pruebas y ataques mientras veas la fuente del miedo. No puedes acercarte a ella por voluntad propia."],
    ["Aturdido", "Incapacitado y no puedes moverte. Fallas las salvaciones de Fuerza y Destreza; los ataques contra ti tienen ventaja."],
    ["Cegado", "Fallas lo que requiera vista. Tus ataques tienen desventaja y los ataques contra ti tienen ventaja."],
    ["Derribado", "Solo puedes arrastrarte, o gastar la mitad del movimiento para levantarte. Desventaja al atacar. Contra ti: ventaja a 5 pies, desventaja de lejos."],
    ["Ensordecido", "No oyes y fallas lo que requiera oído."],
    ["Envenenado", "Desventaja en tiradas de ataque y pruebas de característica."],
    ["Hechizado", "No puedes atacar ni dañar a quien te hechizó, y tiene ventaja en pruebas sociales contigo."],
    ["Incapacitado", "No puedes hacer acciones, acciones adicionales ni reacciones. Pierdes la concentración y no puedes hablar."],
    ["Inconsciente", "Incapacitado, derribado y sueltas lo que tengas. Fallas salvaciones de Fuerza y Destreza. Los golpes a 5 pies son críticos."],
    ["Invisible", "Ventaja en iniciativa. Los ataques contra ti tienen desventaja y los tuyos ventaja, salvo que te puedan ver."],
    ["Paralizado", "Incapacitado y sin moverte. Fallas salvaciones de Fuerza y Destreza. Los golpes a 5 pies son críticos."],
    ["Petrificado", "Te vuelves piedra: incapacitado, resistencia a todo el daño, inmune a veneno."]];
  var ACCIONES = [
    ["Atacar", "Un ataque con arma o golpe sin armas (más si tienes Ataque Extra)."],
    ["Magia", "Lanzar un conjuro o usar un objeto mágico o rasgo mágico."],
    ["Correr", "Ganas movimiento extra igual a tu velocidad este turno."],
    ["Destrabarse", "Tu movimiento no provoca ataques de oportunidad este turno."],
    ["Esquivar", "Los ataques contra ti tienen desventaja y tienes ventaja en salvaciones de Destreza."],
    ["Ayudar", "Das ventaja a un aliado en su siguiente prueba o ataque."],
    ["Esconderse", "Prueba de Destreza (Sigilo) para quedar oculto."],
    ["Influir", "Intentas convencer a una criatura con una prueba social."],
    ["Preparar", "Dejas lista una acción para cuando ocurra algo concreto (usa tu reacción)."],
    ["Buscar / Estudiar", "Percepción o Perspicacia para buscar; Arcanos, Historia, etc. para estudiar algo."],
    ["Usar objeto", "Usar un objeto que no sea mágico, como una poción, o interactuar con algo complejo."]];

  function mod(p) { return Math.floor(((+p || 10) - 10) / 2); }
  function signo(n) { return (n >= 0 ? "+" : "−") + Math.abs(n); }
  function tierDe(n) { return n <= 4 ? 1 : n <= 10 ? 2 : n <= 16 ? 3 : 4; }

  /* ---------- Creación de elementos ---------- */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.indexOf("on") === 0) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    function poner(c) {
      if (c === null || c === undefined || c === false) return;
      if (Array.isArray(c)) { c.forEach(poner); return; }
      el.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
    }
    for (var i = 2; i < arguments.length; i++) poner(arguments[i]);
    return el;
  }
  function aplanar(arr) {
    var out = [];
    (function f(a) { a.forEach(function (x) { if (Array.isArray(x)) f(x); else if (x) out.push(x); }); })(arr);
    return out;
  }
  function lista(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v.filter(Boolean);
    return String(v).split(/\s*[,;]\s*|\n/).filter(Boolean);
  }
  function retrato(pj, clase) {
    if (pj.imagen) {
      var src = /^https?:/.test(pj.imagen) ? pj.imagen : RETRATOS + pj.imagen;
      return h("img", { class: clase, src: src, alt: "Retrato de " + pj.nombre, loading: "lazy" });
    }
    var ini = (pj.nombre || "?").split(/\s+/).map(function (p) { return p[0]; }).slice(0, 2).join("").toUpperCase();
    return h("div", { class: clase + " pj-sin-retrato", "aria-hidden": "true" }, h("span", { text: ini }));
  }
  function lineaClases(pj) {
    return (pj.clases || []).map(function (c) {
      return c.clase + (c.nivel ? " " + c.nivel : "") + (c.subclase ? " (" + c.subclase + ")" : "");
    }).join(" / ");
  }
  function nivelTotal(pj) { return pj.nivel_total || (pj.clases || []).reduce(function (s, c) { return s + (+c.nivel || 0); }, 0); }

  function cargarJSON(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  /* ============================================================
     Galería
     ============================================================ */
  if (galeria) {
    galeria.textContent = "Cargando personajes…";
    cargarJSON(DATOS + "lista.json").then(function (ids) {
      return Promise.all(ids.map(function (id) {
        return cargarJSON(DATOS + id + ".json").then(function (pj) { pj.id = id; return pj; }).catch(function () { return null; });
      }).concat([cargarJSON(DATOS + "registro.json").catch(function () { return []; })]));
    }).then(function (todo) {
      var registro = todo.pop() || [];
      var pjs = todo.filter(Boolean);
      var conFicha = {};
      pjs.forEach(function (pj) { conFicha[pj.id] = 1; });
      registro.forEach(function (pj) { if (!conFicha[pj.id]) { pj.pendiente = true; pjs.push(pj); } });
      function orden(pj) { return (pj.ejemplo ? 3 : 0) + (pj.estado === "En pausa" ? 2 : 0) + (pj.pendiente ? 1 : 0); }
      pjs.sort(function (a, b) { return orden(a) - orden(b) || a.nombre.localeCompare(b.nombre, "es"); });
      var filtroTier = 0;
      var buscar = h("input", { type: "search", placeholder: "Busca por nombre, clase o jugador…", "aria-label": "Buscar personaje" });
      var botones = [0, 1, 2, 3, 4].map(function (t) {
        return h("button", { type: "button", class: "pj-chip" + (t ? " t" + t : "") + (t === 0 ? " activo" : ""), "aria-pressed": t === 0 ? "true" : "false",
          onclick: function () {
            filtroTier = t;
            botones.forEach(function (b, i) { b.classList.toggle("activo", i === t); b.setAttribute("aria-pressed", i === t ? "true" : "false"); });
            pintar();
          } }, t ? "Tier " + t : "Todos");
      });
      var rejilla = h("div", { class: "pj-rejilla" });
      var vacio = h("p", { class: "pj-vacio" });
      galeria.replaceChildren(h("div", { class: "pj-filtros" }, h("label", { class: "lz-buscar__campo" }, h("span", { class: "lz-buscar__icono", "aria-hidden": "true" }), buscar), h("div", { class: "pj-chips" }, botones)), rejilla, vacio);

      var tarjetas = pjs.map(function (pj) {
        var n = nivelTotal(pj), t = tierDe(n);
        var a = h(pj.pendiente ? "div" : "a", { class: "pj-tarjeta t" + t + (pj.pendiente ? " pj-tarjeta--pendiente" : ""), href: pj.pendiente ? null : RAIZ + "personajes/ficha/?pj=" + encodeURIComponent(pj.id) },
          retrato(pj, "pj-tarjeta__retrato"),
          h("span", { class: "pj-tarjeta__texto" },
            h("b", { text: pj.nombre }),
            h("span", { text: lineaClases(pj) }),
            h("small", { text: [pj.especie, pj.jugador ? "Jugador: " + pj.jugador : ""].filter(Boolean).join(" · ") })),
          h("span", { class: "pj-tarjeta__tier", text: "T" + t + " · Nv " + n }),
          pj.ejemplo ? h("span", { class: "pj-tarjeta__ejemplo", text: "Ejemplo" }) : null,
          pj.pendiente || pj.estado === "En pausa" ? h("span", { class: "pj-tarjeta__ejemplo", text: [pj.estado === "En pausa" ? "En pausa" : "", pj.pendiente ? "Ficha pendiente" : ""].filter(Boolean).join(" · ") }) : null);
        a._clave = (window.LZ ? LZ.normalizar : function (x) { return x.toLowerCase(); })([pj.nombre, lineaClases(pj), pj.especie, pj.jugador].join(" "));
        a._tier = t;
        rejilla.appendChild(a);
        return a;
      });
      function pintar() {
        var q = window.LZ ? LZ.normalizar(buscar.value) : buscar.value.toLowerCase();
        var vis = 0;
        tarjetas.forEach(function (a) {
          var ok = (!filtroTier || a._tier === filtroTier) && (!q || a._clave.indexOf(q) >= 0);
          a.hidden = !ok;
          if (ok) vis++;
        });
        vacio.textContent = vis ? "" : "Ningún personaje coincide.";
      }
      buscar.addEventListener("input", pintar);
      pintar();
    }).catch(function () {
      galeria.textContent = "No se pudo cargar la lista de personajes.";
    });
  }

  /* ============================================================
     Ficha
     ============================================================ */
  if (!ficha) return;
  var id = new URLSearchParams(location.search).get("pj");
  if (!id) {
    ficha.replaceChildren(h("p", null, "Elige un personaje en la ", h("a", { href: RAIZ + "personajes/" }, "galería de personajes"), "."));
    return;
  }
  ficha.textContent = "Cargando ficha…";
  cargarJSON(DATOS + encodeURIComponent(id) + ".json").then(function (pj) {
    pj.id = id;
    construirFicha(pj);
  }).catch(function () {
    ficha.replaceChildren(h("p", null, "No encontramos a ese personaje. Vuelve a la ", h("a", { href: RAIZ + "personajes/" }, "galería"), "."));
  });

  function construirFicha(pj) {
    var n = nivelTotal(pj) || 1;
    var prof = 2 + Math.floor((n - 1) / 4);
    var tier = tierDe(n);
    var C = pj.caracteristicas || {};
    var M = {};
    CARACS.forEach(function (c) { M[c[0]] = mod(C[c[0]]); });
    var salv = pj.salvaciones || [];
    var hab = pj.habilidades || {};
    function bonoHab(nombre, car) {
      var e = hab[nombre];
      return M[car] + (e === "Pericia" ? 2 * prof : e === "Competente" ? prof : 0);
    }
    var iniciativa = M.DES + (+pj.iniciativa_extra || 0);
    var pasiva = 10 + bonoHab("Percepción", "SAB");
    var conj = pj.conjuros || {};
    var tieneConjuros = !!(conj.car || (conj.lista && conj.lista.length));
    var cdConj = conj.car ? 8 + prof + M[conj.car] : null;
    var atqConj = conj.car ? prof + M[conj.car] : null;
    var espacios = (conj.espacios || []).map(function (x) { return +x || 0; });
    var pacto = conj.pacto && typeof conj.pacto === "object" ? conj.pacto : null;
    var dadosGolpe = (pj.clases || []).map(function (c) { return { caras: DADOS[c.clase] || 8, total: +c.nivel || 0, clase: c.clase }; });
    var recursos = pj.recursos || [];
    var pgMax = +pj.pg_max || 1;

    document.title = pj.nombre + " - La Lanza de Plata";
    var h1 = document.querySelector("article h1");
    if (h1) h1.remove();

    /* ---------- Estado guardado en este dispositivo ---------- */
    var CLAVE = "lz-ficha:" + id;
    function estadoInicial() {
      return { pg: pgMax, temp: 0, dados: dadosGolpe.map(function () { return 0; }), espacios: espacios.map(function () { return 0; }),
        pacto: 0, recursos: recursos.map(function () { return 0; }), muerte: { ok: 0, fallo: 0 }, agotamiento: 0,
        inspiracion: false, condiciones: [], notas: "", pestana: "resumen" };
    }
    var E;
    try { E = JSON.parse(localStorage.getItem(CLAVE)) || estadoInicial(); } catch (e) { E = estadoInicial(); }
    var base = estadoInicial();
    Object.keys(base).forEach(function (k) { if (E[k] === undefined) E[k] = base[k]; });
    if (E.dados.length !== dadosGolpe.length) E.dados = base.dados;
    if (E.espacios.length !== espacios.length) E.espacios = base.espacios;
    if (E.recursos.length !== recursos.length) E.recursos = base.recursos;
    E.pg = Math.min(E.pg, pgMax);
    function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(E)); } catch (e) {} }

    var aviso = h("div", { class: "pj-aviso", role: "status", "aria-live": "polite" });
    var avisoTimer;
    function avisar(t) {
      aviso.textContent = t;
      aviso.classList.add("visible");
      clearTimeout(avisoTimer);
      avisoTimer = setTimeout(function () { aviso.classList.remove("visible"); }, 4200);
    }

    /* Contador de puntos (pips): marcados = gastados */
    function pips(total, usados, alCambiar, etiqueta) {
      var cont = h("span", { class: "pj-pips", role: "group", "aria-label": etiqueta });
      function pintar() {
        cont.replaceChildren();
        if (total > 12) {
          var menos = h("button", { type: "button", class: "pj-mini", "aria-label": "Gastar uno", onclick: function () { if (usados < total) { usados++; alCambiar(usados); pintar(); } } }, "−");
          var mas = h("button", { type: "button", class: "pj-mini", "aria-label": "Recuperar uno", onclick: function () { if (usados > 0) { usados--; alCambiar(usados); pintar(); } } }, "+");
          cont.append(menos, h("b", { class: "pj-pips__num", text: (total - usados) + " / " + total }), mas);
          return;
        }
        for (var i = 0; i < total; i++) {
          (function (i) {
            var gastado = i >= total - usados;
            cont.appendChild(h("button", { type: "button", class: "pj-pip" + (gastado ? " gastado" : ""),
              "aria-label": etiqueta + " " + (i + 1) + (gastado ? ", gastado" : ", disponible"),
              onclick: function () {
                usados = gastado ? total - i - 1 : total - i;
                alCambiar(usados); pintar();
              } }));
          })(i);
        }
      }
      pintar();
      cont._set = function (u) { usados = u; pintar(); };
      return cont;
    }

    /* ---------- Cabecera ---------- */
    var claseIni = (pj.clases && pj.clases[0]) || {};
    var cabecera = h("header", { class: "pj-cabecera t" + tier },
      retrato(pj, "pj-cabecera__retrato"),
      h("div", { class: "pj-cabecera__texto" },
        pj.ejemplo ? h("span", { class: "pj-etiqueta-ejemplo", text: "Personaje de ejemplo" }) : null,
        h("h1", { text: pj.nombre }),
        h("p", { class: "pj-cabecera__linea", text: [pj.especie, lineaClases(pj)].filter(Boolean).join(" · ") }),
        h("p", { class: "pj-cabecera__meta" },
          h("span", { class: "pj-chip t" + tier, text: "Tier " + tier }),
          h("span", { text: "Nivel " + n }),
          pj.trasfondo ? h("span", { text: "Trasfondo: " + pj.trasfondo }) : null,
          pj.jugador ? h("span", { text: "Jugador: " + pj.jugador }) : null)));

    function dato(valor, etiqueta, tip) {
      var d = h("div", { class: "pj-dato" }, h("b", { text: valor }), h("small", { text: etiqueta }));
      if (tip && window.LZ) LZ.conGlobo(d, tip, etiqueta);
      return d;
    }
    var datos = h("div", { class: "pj-datos" },
      dato(String(pj.ca || "—"), "CA", "Clase de Armadura: un ataque debe igualarla o superarla para acertarte."),
      dato(signo(iniciativa), "Iniciativa", "Tiras 1d20 " + signo(iniciativa) + " al empezar el combate."),
      dato((pj.velocidad || 30) + " pies", "Velocidad"),
      dato(signo(prof), "Competencia", "Se suma a todo lo que dominas: ataques con tus armas, habilidades y salvaciones competentes, y conjuros."),
      dato(String(pasiva), "Percepción pasiva", "El DM la usa para saber si notas algo sin buscarlo."),
      cdConj ? dato(String(cdConj), "CD de conjuros", "Lo que tus enemigos deben sacar en su salvación contra tus conjuros.") : null);

    /* ---------- Panel de seguimiento (PG, temporales, dados, descansos) ---------- */
    var pgNum = h("b", { class: "pj-pg__num" });
    var pgBarra = h("span", { class: "pj-pg__barra" }, h("span"));
    var tempNum = h("b");
    var cantidad = h("input", { type: "number", min: "0", inputmode: "numeric", class: "pj-cantidad", "aria-label": "Cantidad", placeholder: "0" });
    var muerteCaja = h("div", { class: "pj-muerte" });
    function pintarPG() {
      pgNum.textContent = E.pg + " / " + pgMax;
      var pct = Math.max(0, Math.min(100, E.pg / pgMax * 100));
      pgBarra.firstChild.style.width = pct + "%";
      pgBarra.className = "pj-pg__barra" + (pct <= 25 ? " critico" : pct <= 50 ? " herido" : "");
      tempNum.textContent = E.temp;
      muerteCaja.hidden = E.pg > 0;
      pintarMuerte();
      pintarDados();
    }
    function leerCantidad() { var v = parseInt(cantidad.value, 10); return isNaN(v) || v < 0 ? 0 : v; }
    function danar() {
      var v = leerCantidad(); if (!v) { cantidad.focus(); return; }
      var absorbe = Math.min(E.temp, v);
      E.temp -= absorbe; E.pg = Math.max(0, E.pg - (v - absorbe));
      cantidad.value = ""; guardar(); pintarPG();
      avisar(E.pg === 0 ? "Caes a 0 PG: haces salvaciones de muerte al inicio de tu turno." : "Recibes " + v + " de daño" + (absorbe ? " (" + absorbe + " a los temporales)" : "") + ".");
    }
    function curar() {
      var v = leerCantidad(); if (!v) { cantidad.focus(); return; }
      var antes = E.pg; E.pg = Math.min(pgMax, E.pg + v);
      if (antes === 0 && E.pg > 0) E.muerte = { ok: 0, fallo: 0 };
      cantidad.value = ""; guardar(); pintarPG(); avisar("Recuperas " + (E.pg - antes) + " PG.");
    }
    function darTemp() {
      var v = leerCantidad(); if (!v) { cantidad.focus(); return; }
      E.temp = Math.max(E.temp, v); cantidad.value = ""; guardar(); pintarPG();
      avisar("Los PG temporales no se suman: te quedas con el valor más alto.");
    }
    function pintarMuerte() {
      muerteCaja.replaceChildren(h("span", { text: "Salvaciones de muerte" }),
        h("span", { class: "pj-muerte__fila" }, h("small", { text: "Éxitos" }), pips(3, E.muerte.ok, function (u) { E.muerte.ok = u; guardar(); if (u >= 3) avisar("Tres éxitos: quedas estable a 0 PG."); }, "Éxito")),
        h("span", { class: "pj-muerte__fila fallos" }, h("small", { text: "Fallos" }), pips(3, E.muerte.fallo, function (u) { E.muerte.fallo = u; guardar(); if (u >= 3) avisar("Tres fallos: tu personaje muere. Habla con el DM."); }, "Fallo")));
    }

    var dadosCaja = h("div", { class: "pj-dados" });
    function pintarDados() {
      dadosCaja.replaceChildren();
      dadosGolpe.forEach(function (d, i) {
        var libres = d.total - E.dados[i];
        dadosCaja.appendChild(h("div", { class: "pj-dados__fila" },
          h("span", { text: "d" + d.caras + (dadosGolpe.length > 1 ? " (" + d.clase + ")" : "") }),
          pips(d.total, E.dados[i], function (u) { E.dados[i] = u; guardar(); pintarDados(); }, "Dado de golpe d" + d.caras),
          h("button", { type: "button", class: "pj-boton pj-boton--chico", disabled: libres <= 0 || E.pg >= pgMax ? true : null,
            title: "Solo en un descanso corto",
            onclick: function () {
              var tirada = 1 + Math.floor(Math.random() * d.caras);
              var cura = Math.max(1, tirada + M.CON);
              E.dados[i]++; var antes = E.pg; E.pg = Math.min(pgMax, E.pg + cura);
              guardar(); pintarPG();
              avisar("Dado de golpe: " + tirada + " " + signo(M.CON) + " = " + cura + ". Recuperas " + (E.pg - antes) + " PG.");
            } }, "Gastar uno")));
      });
    }

    var inspiracion = h("button", { type: "button", class: "pj-toggle", "aria-pressed": E.inspiracion ? "true" : "false",
      onclick: function () { E.inspiracion = !E.inspiracion; inspiracion.setAttribute("aria-pressed", E.inspiracion ? "true" : "false"); guardar(); } }, "Inspiración heroica");
    if (window.LZ) LZ.conGlobo(inspiracion, "Gástala para repetir cualquier tirada de dado. Solo puedes tener una a la vez.", "Inspiración heroica");

    var agotNum = h("b");
    function pintarAgot() { agotNum.textContent = E.agotamiento; }
    var agotamiento = h("span", { class: "pj-agot" }, h("span", { text: "Agotamiento" }),
      h("button", { type: "button", class: "pj-mini", "aria-label": "Quitar un nivel de agotamiento", onclick: function () { if (E.agotamiento > 0) { E.agotamiento--; guardar(); pintarAgot(); } } }, "−"),
      agotNum,
      h("button", { type: "button", class: "pj-mini", "aria-label": "Sumar un nivel de agotamiento", onclick: function () { if (E.agotamiento < 6) { E.agotamiento++; guardar(); pintarAgot(); if (E.agotamiento >= 6) avisar("Con 6 niveles de agotamiento el personaje muere."); } } }, "+"));
    if (window.LZ) LZ.conGlobo(agotamiento, "Cada nivel resta 2 a tus pruebas con d20 y 5 pies a tu velocidad. Un descanso largo quita un nivel. Con 6, mueres.", "Agotamiento");

    var refrescos = [];
    function descansoCorto() {
      recursos.forEach(function (r, i) { if (/corto/i.test(r.recupera || "")) E.recursos[i] = 0; });
      if (pacto) E.pacto = 0;
      guardar(); refrescos.forEach(function (f) { f(); });
      avisar("Descanso corto: recuperas lo que vuelve con descanso corto" + (pacto ? " y tus espacios de pacto" : "") + ". Si quieres, gasta dados de golpe para curarte.");
    }
    function descansoLargo() {
      E.pg = pgMax; E.temp = 0;
      E.dados = dadosGolpe.map(function () { return 0; });
      E.espacios = espacios.map(function () { return 0; }); E.pacto = 0;
      recursos.forEach(function (r, i) { if (!/otro/i.test(r.recupera || "")) E.recursos[i] = 0; });
      E.muerte = { ok: 0, fallo: 0 };
      if (E.agotamiento > 0) E.agotamiento--;
      guardar(); refrescos.forEach(function (f) { f(); });
      avisar("Descanso largo: PG, dados de golpe, espacios de conjuro y recursos al máximo." + (E.agotamiento ? " Te queda " + E.agotamiento + " de agotamiento." : ""));
    }
    var reiniciar = h("button", { type: "button", class: "pj-boton pj-boton--fantasma" }, "Reiniciar ficha");
    var confirmaTimer;
    reiniciar.addEventListener("click", function () {
      if (!reiniciar.classList.contains("confirmar")) {
        reiniciar.classList.add("confirmar"); reiniciar.textContent = "¿Seguro? Toca otra vez";
        confirmaTimer = setTimeout(function () { reiniciar.classList.remove("confirmar"); reiniciar.textContent = "Reiniciar ficha"; }, 3500);
        return;
      }
      clearTimeout(confirmaTimer);
      var notas = E.notas; E = estadoInicial(); E.notas = notas; guardar();
      reiniciar.classList.remove("confirmar"); reiniciar.textContent = "Reiniciar ficha";
      refrescos.forEach(function (f) { f(); });
      avisar("Ficha reiniciada. Tus notas se conservan.");
    });
    refrescos.push(pintarPG, pintarDados, pintarAgot, function () { inspiracion.setAttribute("aria-pressed", E.inspiracion ? "true" : "false"); });

    var panel = h("section", { class: "pj-panel", "aria-label": "Seguimiento en la mesa" },
      h("div", { class: "pj-pg" },
        h("div", { class: "pj-pg__cabeza" }, h("span", { text: "Puntos de golpe" }), pgNum),
        pgBarra,
        h("div", { class: "pj-pg__temp" }, h("span", { text: "Temporales " }), tempNum),
        h("div", { class: "pj-pg__acciones" }, cantidad,
          h("button", { type: "button", class: "pj-boton pj-boton--dano", onclick: danar }, "Daño"),
          h("button", { type: "button", class: "pj-boton", onclick: curar }, "Curar"),
          h("button", { type: "button", class: "pj-boton pj-boton--fantasma", onclick: darTemp }, "Temporales")),
        muerteCaja),
      h("div", { class: "pj-panel__lado" },
        h("div", { class: "pj-panel__titulo", text: "Dados de golpe" }), dadosCaja,
        h("div", { class: "pj-panel__fila" }, inspiracion, agotamiento),
        h("div", { class: "pj-descansos" },
          h("button", { type: "button", class: "pj-boton pj-boton--luz", onclick: descansoCorto }, "Descanso corto"),
          h("button", { type: "button", class: "pj-boton pj-boton--luz", onclick: descansoLargo }, "Descanso largo"),
          reiniciar)));

    /* ---------- Pestañas ---------- */
    var secciones = [];
    function seccion(idS, titulo, contenido) {
      secciones.push({ id: idS, titulo: titulo, el: h("section", { class: "pj-seccion", id: "pj-" + idS, role: "tabpanel", "aria-label": titulo }, contenido) });
    }

    /* Resumen */
    var consejos = lista(pj.consejos), recordar = lista(pj.recordatorios);
    seccion("resumen", "Resumen", [
      pj.descripcion ? h("p", { class: "pj-descripcion", text: pj.descripcion }) : null,
      consejos.length ? h("div", { class: "pj-consejos" },
        h("h3", null, h("span", { class: "pj-farol", "aria-hidden": "true" }), "Consejos del DM"),
        h("ul", null, consejos.map(function (c) { return h("li", { text: c }); }))) : null,
      recordar.length ? h("div", { class: "pj-recordar" }, h("h3", { text: "Que no se te olvide" }),
        h("ul", null, recordar.map(function (c) { return h("li", { text: c }); }))) : null,
      h("h3", { text: "Características" }),
      h("div", { class: "pj-caracs" }, CARACS.map(function (c) {
        var comp = salv.indexOf(c[0]) >= 0;
        var s = M[c[0]] + (comp ? prof : 0);
        var caja = h("div", { class: "pj-carac" + (comp ? " comp" : "") },
          h("small", { text: c[1] }), h("b", { text: signo(M[c[0]]) }), h("span", { text: C[c[0]] || "—" }),
          h("em", { text: "Salv. " + signo(s) }));
        if (window.LZ) LZ.conGlobo(caja, "Puntuación " + (C[c[0]] || "—") + ", modificador " + signo(M[c[0]]) + ". Salvación " + signo(s) + (comp ? " (competente)." : "."), c[1]);
        return caja;
      })),
      h("h3", { text: "Habilidades" }),
      h("ul", { class: "pj-habs" }, HABILIDADES.map(function (x) {
        var e = hab[x[0]];
        return h("li", { class: e === "Pericia" ? "pericia" : e === "Competente" ? "comp" : "" },
          h("b", { text: signo(bonoHab(x[0], x[1])) }), h("span", { text: x[0] }), h("small", { text: x[1] + (e === "Pericia" ? " · pericia" : "") }));
      })),
      h("p", { class: "pj-leyenda" }, h("span", { class: "punto comp" }), " competente  ", h("span", { class: "punto pericia" }), " pericia (doble competencia)"),
      bloqueTexto("Rasgos de especie", lista(pj.rasgos_especie)),
      bloqueTexto("Dotes", lista(pj.dotes)),
      bloqueTexto("Idiomas", lista(pj.idiomas)),
      pj.competencias ? h("div", { class: "pj-bloque" }, h("h3", { text: "Competencias" }), h("p", { text: pj.competencias })) : null,
      pj.proximo_nivel ? h("div", { class: "pj-bloque pj-proximo" }, h("h3", { text: "Al subir de nivel" }), h("p", { text: pj.proximo_nivel })) : null
    ]);
    function bloqueTexto(titulo, items) {
      if (!items.length) return null;
      return h("div", { class: "pj-bloque" }, h("h3", { text: titulo }), h("ul", { class: "pj-etiquetas" }, items.map(function (t) { return h("li", { text: t }); })));
    }

    /* Guía de combate: cómo tirar cada ataque o rasgo */
    function guiaCombate(lista) {
      if (!lista.length) return null;
      var filas = [["cuando", "Cuándo"], ["tira", "Qué tiras"], ["ojo", "Ojo"]];
      var base = h("details", { class: "pj-guia__item pj-guia__item--base" },
        h("summary", null, h("b", { text: "Cómo funciona una tirada" })),
        h("dl", null,
          h("dt", { text: "Atacar" }), h("dd", { text: "Tira 1d20 y suma tu bono de Golpe. Si iguala o supera la CA del enemigo, aciertas y tiras el daño." }),
          h("dt", { text: "Ventaja" }), h("dd", { text: "Tira 2d20 y quédate con el más alto. Desventaja: el más bajo. Si tienes las dos a la vez, se cancelan y tiras uno solo." }),
          h("dt", { text: "Crítico" }), h("dd", { text: "Un 20 natural siempre acierta: tira el doble de dados de daño (también los extra, como Ataque Furtivo) y suma el modificador una sola vez. Un 1 natural siempre falla." }),
          h("dt", { text: "Salvaciones" }), h("dd", { text: "Si el conjuro pide salvación, tú no tiras: el enemigo tira 1d20 contra tu CD de conjuros." })));
      return h("div", { class: "pj-guia" },
        h("h3", { text: "Cómo sacarle provecho a tus ataques" }),
        h("p", { class: "pj-leyenda", text: "Consejos del DM: lo que más se olvida en la mesa. Toca cada uno para abrirlo." }),
        base,
        lista.map(function (g, i) {
          return h("details", { class: "pj-guia__item", open: i === 0 },
            h("summary", null, h("b", { text: g.nombre }), g.resumen ? h("span", { text: g.resumen }) : null),
            h("dl", null, filas.map(function (f) {
              return g[f[0]] ? [h("dt", { text: f[1] }), h("dd", { text: g[f[0]] })] : null;
            })));
        }));
    }

    /* Combate */
    var condCaja = h("div", { class: "pj-condiciones" });
    function pintarCond() {
      condCaja.replaceChildren();
      CONDICIONES.forEach(function (c) {
        var activa = E.condiciones.indexOf(c[0]) >= 0;
        var b = h("button", { type: "button", class: "pj-toggle", "aria-pressed": activa ? "true" : "false",
          onclick: function () {
            var i = E.condiciones.indexOf(c[0]);
            if (i >= 0) E.condiciones.splice(i, 1); else E.condiciones.push(c[0]);
            guardar(); pintarCond();
          } }, c[0]);
        if (window.LZ) LZ.conGlobo(b, c[1], c[0]);
        condCaja.appendChild(b);
      });
    }
    pintarCond(); refrescos.push(pintarCond);
    var ataques = pj.ataques || [];
    seccion("combate", "Combate", [
      ataques.length ? h("div", { class: "pj-tabla" }, h("table", null,
        h("thead", null, h("tr", null, ["Ataque", "Golpe", "Daño", "Maestría", "Alcance"].map(function (t) { return h("th", { text: t }); }))),
        h("tbody", null, ataques.map(function (a) {
          var nombre = h("td", null, h("b", { text: a.nombre }), a.notas ? h("small", { text: a.notas }) : null);
          nombre.setAttribute("data-objeto", a.nombre);
          var maes = h("td", { text: a.maestria || "—" });
          return h("tr", null, nombre, h("td", { class: "num", text: a.ataque || "—" }),
            h("td", { text: [a.dano, a.tipo].filter(Boolean).join(" ") || "—" }), maes, h("td", { text: a.alcance || "—" }));
        })))) : h("p", { class: "pj-leyenda", text: "Sin ataques anotados." }),
      guiaCombate(pj.guia_combate || []),
      h("h3", { text: "Tu turno" }),
      h("div", { class: "pj-turno" },
        h("div", null, h("b", { text: "Movimiento" }), h("span", { text: "Hasta " + (pj.velocidad || 30) + " pies, repartido como quieras antes y después de actuar." })),
        h("div", null, h("b", { text: "Acción" }), h("span", { text: "Una por turno. Toca una para ver qué hace:" }),
          h("span", { class: "pj-acciones" }, ACCIONES.map(function (a) {
            var b = h("button", { type: "button", class: "pj-toggle pj-toggle--quieto" }, a[0]);
            if (window.LZ) LZ.conGlobo(b, a[1], a[0]);
            return b;
          }))),
        h("div", null, h("b", { text: "Acción adicional" }), h("span", { text: "Solo si un rasgo, conjuro u objeto te la da. Una por turno." })),
        h("div", null, h("b", { text: "Reacción" }), h("span", { text: "Una por ronda, incluso fuera de tu turno: ataque de oportunidad o un rasgo que la use." })),
        h("div", null, h("b", { text: "Interacción gratis" }), h("span", { text: "Sacar o guardar un arma, abrir una puerta o recoger algo, una vez por turno." }))),
      h("h3", { text: "Condiciones" }),
      h("p", { class: "pj-leyenda", text: "Marca las que te afectan ahora. Toca una para ver qué hace." }),
      condCaja
    ]);

    /* Conjuros */
    if (tieneConjuros) {
      var espaciosCaja = h("div", { class: "pj-espacios" });
      var pintarEspacios = function () {
        espaciosCaja.replaceChildren();
        espacios.forEach(function (total, i) {
          if (!total) return;
          espaciosCaja.appendChild(h("div", { class: "pj-espacio" }, h("small", { text: "Nivel " + (i + 1) }),
            pips(total, E.espacios[i], function (u) { E.espacios[i] = u; guardar(); }, "Espacio de nivel " + (i + 1))));
        });
        if (pacto) {
          espaciosCaja.appendChild(h("div", { class: "pj-espacio pacto" }, h("small", { text: "Pacto (nivel " + pacto.nivel + ")" }),
            pips(+pacto.cantidad || 0, E.pacto, function (u) { E.pacto = u; guardar(); }, "Espacio de pacto")));
        }
      };
      pintarEspacios(); refrescos.push(pintarEspacios);
      var porNivel = {};
      (conj.lista || []).forEach(function (s) { var k = +s.nivel || 0; (porNivel[k] = porNivel[k] || []).push(s); });
      seccion("conjuros", "Conjuros", [
        h("div", { class: "pj-datos pj-datos--chico" },
          conj.car ? dato(conj.car, "Característica") : null,
          cdConj ? dato(String(cdConj), "CD de salvación") : null,
          atqConj !== null ? dato(signo(atqConj), "Ataque de conjuro") : null),
        espacios.some(Boolean) || pacto ? h("h3", { text: "Espacios de conjuro" }) : null,
        espaciosCaja,
        Object.keys(porNivel).sort(function (a, b) { return a - b; }).map(function (k) {
          return h("div", { class: "pj-conj-nivel" },
            h("h3", { text: +k === 0 ? "Trucos" : "Nivel " + k }),
            h("ul", { class: "pj-conj" }, porNivel[k].map(function (s) {
              var url = CONJURO_URL + encodeURIComponent(s.nombre.toLowerCase()) + "_xphb";
              return h("li", null,
                h("a", { href: url, target: "_blank", rel: "noopener", text: s.nombre }),
                s.estado && !/^truco$/i.test(s.estado) ? h("span", { class: "pj-insignia" + (/siempre/i.test(s.estado) ? " siempre" : ""), text: s.estado }) : null,
                s.fuente ? h("small", { text: s.fuente }) : null,
                s.notas ? h("em", { text: s.notas }) : null);
            })));
        }),
        h("p", { class: "pj-leyenda", text: "Cada conjuro abre su texto completo en 5etools (versión 2024)." })
      ]);
    }

    /* Recursos y equipo */
    var recursosCaja = h("div", { class: "pj-recursos" });
    function pintarRecursos() {
      recursosCaja.replaceChildren();
      recursos.forEach(function (r, i) {
        recursosCaja.appendChild(h("div", { class: "pj-recurso" },
          h("div", null, h("b", { text: r.nombre }), h("small", { text: r.recupera ? "Vuelve con: " + r.recupera.toLowerCase() : "" }), r.notas ? h("em", { text: r.notas }) : null),
          pips(+r.max || 0, E.recursos[i], function (u) { E.recursos[i] = u; guardar(); }, r.nombre)));
      });
    }
    pintarRecursos(); refrescos.push(pintarRecursos);
    var objetos = (pj.objetos || []).map(function (o) { return typeof o === "string" ? { nombre: o.replace(/\*$/, "").trim(), sintonizado: /\*$/.test(o) } : o; });
    var sinton = objetos.filter(function (o) { return o.sintonizado; }).length;
    var listaObjetos = h("ul", { class: "pj-objetos" }, objetos.map(function (o) {
      return h("li", { "data-objeto": o.nombre }, h("span", { text: o.nombre }), o.sintonizado ? h("span", { class: "pj-insignia siempre", text: "Sintonizado" }) : null);
    }));
    seccion("recursos", "Recursos y equipo", [
      recursos.length ? h("h3", { text: "Recursos" }) : null,
      recursos.length ? recursosCaja : null,
      recursos.length ? h("p", { class: "pj-leyenda", text: "Toca un punto para gastarlo. Los botones de descanso los recuperan solos." }) : null,
      objetos.length ? h("h3", null, "Objetos mágicos ", h("small", { class: "pj-sinton" + (sinton > 3 ? " exceso" : ""), text: "Sintonía " + sinton + " / 3" })) : null,
      objetos.length ? listaObjetos : null,
      pj.armadura ? h("div", { class: "pj-bloque" }, h("h3", { text: "Armadura" }), h("p", { text: pj.armadura })) : null,
      bloqueTexto("Bendiciones y dones", lista(pj.bendiciones).filter(function (x) { return x !== "—"; })),
      pj.bastion ? h("div", { class: "pj-bloque" }, h("h3", { text: "Bastión" }), h("p", { text: pj.bastion })) : null,
      pj.oro ? h("div", { class: "pj-bloque" }, h("h3", { text: "Oro" }), h("p", { text: pj.oro + " (según la última actualización del DM)" })) : null
    ]);

    /* Notas */
    var notas = h("textarea", { class: "pj-notas", rows: "10", placeholder: "Nombres, pistas, deudas, lo que pasó en la última mesa…" });
    notas.value = E.notas || "";
    var notasTimer;
    notas.addEventListener("input", function () { clearTimeout(notasTimer); notasTimer = setTimeout(function () { E.notas = notas.value; guardar(); }, 400); });
    seccion("notas", "Notas", [
      h("p", { class: "pj-leyenda", text: "Tus notas se guardan solo en este dispositivo y navegador. Nadie más las ve." }),
      notas
    ]);

    var botonesTab = h("div", { class: "pj-tabs", role: "tablist", "aria-label": "Secciones de la ficha" });
    function activar(idS) {
      E.pestana = idS; guardar();
      secciones.forEach(function (s) {
        var act = s.id === idS;
        s.el.hidden = !act;
        s.boton.setAttribute("aria-selected", act ? "true" : "false");
        s.boton.tabIndex = act ? 0 : -1;
      });
    }
    secciones.forEach(function (s, i) {
      s.boton = h("button", { type: "button", role: "tab", id: "tab-" + s.id, "aria-controls": "pj-" + s.id, text: s.titulo,
        onclick: function () { activar(s.id); },
        onkeydown: function (e) {
          var j = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
          if (j === null) return;
          var t = secciones[(j + secciones.length) % secciones.length];
          activar(t.id); t.boton.focus();
        } });
      botonesTab.appendChild(s.boton);
    });

    ficha.replaceChildren.apply(ficha, aplanar([cabecera, datos, panel, botonesTab, secciones.map(function (s) { return s.el; }), aviso,
      h("p", { class: "pj-pie" }, "¿Algo no cuadra con tu hoja? Avísale al DM o mándalo por ", h("a", { href: RAIZ + "solicitudes/" }, "Solicitudes"), ". ",
        h("a", { href: RAIZ + "personajes/" }, "Volver a la galería"), ".")]));
    activar(secciones.some(function (s) { return s.id === E.pestana; }) ? E.pestana : "resumen");
    refrescos.forEach(function (f) { f(); });

    /* Descripción de objetos mágicos y armas */
    if (window.LZ && LZ.objetos) {
      LZ.objetos().then(function (D) {
        ficha.querySelectorAll("[data-objeto]").forEach(function (el) {
          var d = LZ.descripcionObjeto(D, el.getAttribute("data-objeto"));
          if (!d) return;
          el.classList.add("con-desc");
          LZ.conGlobo(el, d, el.getAttribute("data-objeto"));
        });
      });
    }
  }
})();
