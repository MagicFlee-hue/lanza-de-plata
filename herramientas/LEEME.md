# Herramientas del DM

Esta carpeta no se publica en la web. Aquí está lo que usa el DM para mantener la sección de Personajes.

## Añadir o actualizar un personaje

Cada personaje son dos o tres archivos:

| Qué | Dónde | Nombre |
|---|---|---|
| Datos de la ficha | `docs/assets/data/personajes/` | `<id>.json`, por ejemplo `thalassa.json` |
| Retrato (opcional) | `docs/assets/img/personajes/` | el que quieras, por ejemplo `thalassa.jpg` |
| Lista de la galería | `docs/assets/data/personajes/lista.json` | se añade el `<id>` entre comillas |

El `<id>` va en minúsculas, sin tildes ni espacios (usa guiones): `kaelen-ejemplo`, `thalassa`, `ruug-el-grande`.

### 1. Convertir la plantilla de Excel

Con Python y openpyxl instalados:

```
python herramientas/ficha_a_json.py "Ficha - Thalassa.xlsx" thalassa
```

Abre el `thalassa.json` que sale y:

- Escribe los **consejos del DM** en `"consejos"` (una frase por línea, entre comillas y separadas por comas).
- Revisa `"recordatorios"` y `"proximo_nivel"`.
- **Borra el bloque `_privado_no_publicar`**: trae las respuestas privadas del jugador y la web es pública.

Si no tienes Python, pásale el Excel a Claude y te devuelve el JSON.

### 2. Subir los archivos a GitHub

1. Entra a la carpeta `docs/assets/data/personajes/` del repositorio.
2. **Add file → Upload files**, arrastra el `.json` y pulsa **Commit changes**.
3. Para el retrato, lo mismo en `docs/assets/img/personajes/`. Mejor si es vertical (proporción 4:5) y pesa menos de 500 KB.
4. En el JSON del personaje, pon el nombre del archivo en `"imagen"`, por ejemplo `"imagen": "thalassa.jpg"`. También sirve un enlace completo a una imagen en internet.
5. Edita `lista.json` y añade el id: `["kaelen-ejemplo", "thalassa"]`.

En uno o dos minutos aparece en la galería. Cuando haya personajes reales, puedes quitar `kaelen-ejemplo` de la lista.

### Campos del JSON

Mira `kaelen-ejemplo.json`: tiene todos los campos con un ejemplo. Los más importantes:

- `clases`: lista con `clase`, `subclase` y `nivel`. La clase va como en la plantilla (Explorador, Mago…) para que salga el dado de golpe correcto.
- `caracteristicas`, `salvaciones`, `habilidades`: el resto (modificadores, competencia, CD de conjuros, percepción pasiva) lo calcula la web.
- `conjuros.espacios`: nueve números, de nivel 1 a 9. Para brujos, `"pacto": {"cantidad": 2, "nivel": 3}`.
- `recursos`: `max` es cuántos usos tiene y `recupera` es `Descanso corto`, `Descanso largo`, `Amanecer` u `Otro` (no se recupera con descansos).
- `ejemplo: true` solo para el personaje de muestra.

## Formulario, tablón y comentarios

Los enlaces viven en `docs/assets/data/interaccion.json`. Si un campo está vacío, esa parte no se muestra.
