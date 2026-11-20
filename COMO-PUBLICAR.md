# Cómo publicar el sitio de La Lanza de Plata

El sitio se publica gratis en **GitHub Pages**. No necesitas instalar nada: todo se hace desde el navegador.

## 1. Crear la cuenta y el repositorio (una sola vez)

1. Entra a **github.com** y crea una cuenta. Activa la **verificación en dos pasos**: así nadie más puede tocar el sitio.
2. Arriba a la derecha, haz clic en **+ → New repository**.
3. En *Repository name* escribe `lanza-de-plata`, deja la opción **Public** y haz clic en **Create repository**.

## 2. Subir los archivos

1. Descomprime `lanza-de-plata-wiki.zip` en tu PC.
2. En la página del repositorio, haz clic en **uploading an existing file** (o en **Add file → Upload files**).
3. Arrastra **todo lo que hay dentro** de la carpeta descomprimida: `docs`, `.github`, `mkdocs.yml`, `requirements.txt`, `.gitignore` y este archivo.
4. Abajo, haz clic en **Commit changes**.

> **Nota:** si la carpeta `.github` no aparece al arrastrar, haz clic en **Add file → Create new file**, escribe como nombre `.github/workflows/publicar.yml` y pega el contenido de ese archivo.

## 3. Encender la publicación (una sola vez)

1. En el repositorio, ve a **Settings → Pages**.
2. En *Build and deployment → Source*, elige **GitHub Actions**.
3. Ve a la pestaña **Actions**. Verás "Publicar sitio" en curso. Cuando tenga el check verde (1 a 2 minutos), el sitio queda en línea en:

   `https://TU-USUARIO.github.io/lanza-de-plata/`

4. Abre `mkdocs.yml`, quita el `#` de la línea `site_url` y pon esa dirección.

## 4. Editar el sitio (día a día)

1. En GitHub, entra a la carpeta `docs` y abre la página que quieres cambiar (por ejemplo, `empezar/horarios.md`).
2. Haz clic en el **lápiz** (Edit), haz el cambio y luego **Commit changes**.
3. En un par de minutos el sitio se actualiza solo.

GitHub guarda **todas las versiones**: en *History* ves quién cambió qué y cuándo, y puedes volver atrás.

## Dónde va cada cosa

| Quiero… | Archivo |
|---|---|
| Cambiar horarios | `docs/empezar/horarios.md` |
| Cambiar reglas | `docs/reglas/` |
| Escribir lore | `docs/mundo/` |
| Agregar un documento nuevo | crear `docs/documentos/nombre.md` y agregarlo en `nav` dentro de `mkdocs.yml` |
| Subir el mapa | subir la imagen como `docs/assets/img/mapa.jpg` |
| Cambiar colores | `docs/assets/css/lanza.css` |

## Seguridad

- El sitio no tiene base de datos, contraseñas ni comentarios: no hay nada que hackear desde afuera.
- Solo tú (y quien agregues en *Settings → Collaborators*) puede editar.
- **Nunca pongas en `docs/` secretos de la campaña**: todo lo que está ahí es público.
