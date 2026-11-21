"""Convierte una plantilla de ficha llena (Ficha_Lanza_de_Plata.xlsx) en el JSON
que usa la web: docs/assets/data/personajes/<id>.json

Uso:  python ficha_a_json.py "Ficha - Kaelen.xlsx" kaelen
Necesita openpyxl (pip install openpyxl). Después:
  1. Revisa el JSON y escribe los "consejos" del DM.
  2. Añade el <id> a docs/assets/data/personajes/lista.json.
  3. Si hay retrato, súbelo a docs/assets/img/personajes/ y pon su nombre en "imagen".
"""
import json, re, sys
from openpyxl import load_workbook

def limpio(v):
    if v is None: return ""
    if isinstance(v, float) and v.is_integer(): v = int(v)
    return str(v).strip()

def num(v, defecto=0):
    try: return int(float(v))
    except (TypeError, ValueError): return defecto

def lista(v):
    return [x.strip() for x in re.split(r"[,;\n]", limpio(v)) if x.strip() and x.strip() != "—"]

def main(ruta, ident):
    wb = load_workbook(ruta, data_only=True)
    P = wb["Personaje"]
    campos = {limpio(P.cell(row=r, column=1).value): P.cell(row=r, column=2).value for r in range(4, 40)}
    def c(nombre): return limpio(campos.get(nombre))

    clases = []
    if c("Clase"):
        clases.append({"clase": c("Clase"), "subclase": c("Subclase"), "nivel": num(campos.get("Nivel en esa clase"), 1)})
    if c("Segunda clase (si es multiclase)"):
        clases.append({"clase": c("Segunda clase (si es multiclase)"), "subclase": c("Subclase de la segunda clase"),
                       "nivel": num(campos.get("Nivel en la segunda clase"), 1)})

    car, salv = {}, []
    for i, k in enumerate(["FUE", "DES", "CON", "INT", "SAB", "CAR"]):
        car[k] = num(P.cell(row=4 + i, column=6).value, 10)
        if limpio(P.cell(row=4 + i, column=8).value).lower().startswith("s"):
            salv.append(k)
    hab = {}
    for r in range(14, 32):
        nombre = limpio(P.cell(row=r, column=5).value).split(" (")[0]
        nivel = limpio(P.cell(row=r, column=7).value)
        if nombre and nivel in ("Competente", "Pericia"):
            hab[nombre] = nivel

    objetos = [{"nombre": o.rstrip("*").strip(), "sintonizado": o.endswith("*")}
               for o in lista(campos.get("Objetos mágicos (marca con * los sintonizados, máx. 3)"))]

    A = wb["Ataques"]
    ataques = []
    for r in range(3, A.max_row + 1):
        f = [limpio(A.cell(row=r, column=i).value) for i in range(1, 9)]
        if f[0]:
            ataques.append(dict(zip(["nombre", "car", "ataque", "dano", "tipo", "maestria", "alcance", "notas"], f)))

    S = wb["Conjuros"]
    conj = {"car": limpio(S["B4"].value), "espacios": [num(S.cell(row=10, column=1 + i).value) for i in range(1, 10)], "lista": []}
    pacto = limpio(S["B12"].value)
    m = re.match(r"(\d+)\D+(\d+)", pacto)
    if m:
        conj["pacto"] = {"cantidad": int(m.group(1)), "nivel": int(m.group(2))}
    for r in range(17, S.max_row + 1):
        f = [limpio(S.cell(row=r, column=i).value) for i in range(1, 6)]
        if f[0]:
            conj["lista"].append({"nombre": f[0], "nivel": num(f[1]), "estado": f[2], "fuente": f[3], "notas": f[4]})

    R = wb["Recursos"]
    recursos = []
    for r in range(3, 15):
        f = [limpio(R.cell(row=r, column=i).value) for i in range(1, 5)]
        if f[0]:
            recursos.append({"nombre": f[0], "max": num(f[1], 1), "recupera": f[2], "notas": f[3]})

    D = wb["Para el DM"]
    resp = [limpio(D.cell(row=4 + i * 2, column=2).value) for i in range(6)]

    pj = {
        "jugador": c("Jugador (apodo)"), "nombre": c("Nombre del personaje"), "imagen": "",
        "especie": c("Especie"), "trasfondo": c("Trasfondo"), "clases": clases,
        "pg_max": num(campos.get("Puntos de golpe máximos"), 1), "ca": num(campos.get("Clase de armadura (CA)"), 10),
        "velocidad": num(campos.get("Velocidad (pies)"), 30),
        "iniciativa_extra": num(campos.get("Bonificación extra a iniciativa (dotes, objetos)")),
        "caracteristicas": car, "salvaciones": salv, "habilidades": hab,
        "armadura": c("Armadura y escudo que usas"), "idiomas": lista(campos.get("Idiomas")),
        "competencias": c("Competencias con armas, armaduras y herramientas"),
        "dotes": lista(campos.get("Dotes (incluye la del trasfondo)")),
        "rasgos_especie": lista(campos.get("Rasgos de especie")),
        "objetos": objetos,
        "bendiciones": lista(campos.get("Bendiciones / dones de la Lanza (máx. 1 en T1–T2, 2 en T3–T4)")),
        "bastion": c("Bastión (solo desde nivel 5 y Tier 2)"), "oro": c("Oro y monedas"),
        "ataques": ataques, "conjuros": conj if (conj["car"] or conj["lista"]) else {}, "recursos": recursos,
        "descripcion": resp[0],
        "consejos": [],
        "recordatorios": [x for x in [resp[1]] if x],
        "proximo_nivel": resp[4],
        "_privado_no_publicar": {"dudas": resp[2], "objetivo": resp[3], "nota_privada": resp[5]},
    }
    salida = f"{ident}.json"
    with open(salida, "w", encoding="utf-8") as fh:
        json.dump(pj, fh, ensure_ascii=False, indent=2)
    print("Listo:", salida, "· Borra el bloque _privado_no_publicar antes de subirlo.")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
