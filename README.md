# Compresor de Presentaciones — Bong Studio

Herramienta web para comprimir archivos **PPTX** y **PDF** directamente en el navegador. Sin servidores, sin registro, sin límites de privacidad.

**Stack:** HTML + CSS + Vanilla JS
**Librerías:** [pdf-lib 1.17.1](https://pdf-lib.js.org/) · [JSZip 3.10.1](https://stuk.github.io/jszip/) · [Feather Icons](https://feathericons.com/)
**Fuentes:** Satoshi (Fontshare) · Space Mono (Google Fonts)

---

## Estructura del proyecto

```
compresor v2/
├── index.html     — Markup: 4 pantallas SPA + controles PDF/PPT
├── styles.css     — Estilos: variables CSS, dark/light theme, animaciones
├── app.js         — Lógica: compresión PPT y PDF, UI, i18n, confetti
└── README.md      — Este archivo
```

---

## Arquitectura de la UI (4 pantallas)

El app es un SPA de pantalla única con 4 estados gestionados por `showScreen(name)`:

| ID | Nombre | Contenido |
|----|--------|-----------|
| `#screen-drop` | Drop | Hero + dropzone de arrastre |
| `#screen-file` | File | Nombre/tamaño del archivo + controles de compresión |
| `#screen-compressing` | Compressing | Logo pulsando + porcentaje |
| `#screen-results` | Results | Stats animados + botón de descarga |

**Transición entre pantallas:** `screenEnter` — fade + translateY + blur, `0.6s cubic-bezier(0.16, 1, 0.3, 1)`.
**Animaciones de entrada (screen-drop):** `.anim-item` con `--delay` CSS variable en cada elemento del hero + dropzone.

---

## Compresión PPTX (JSZip)

Flujo en `compressPPT()`:

1. Carga el `.pptx` como ZIP con `JSZip.loadAsync()`
2. Lista todos los archivos en `ppt/media/` con extensión `.png`, `.jpg`, `.jpeg`, `.bmp`
3. Por cada imagen: carga como Blob → dibuja en `<canvas>` → re-encodea a JPEG (o PNG si tiene transparencia) al quality elegido
4. Sólo reemplaza si el resultado es más pequeño que el original
5. Genera el ZIP final con compresión DEFLATE nivel 9

**Control:** Slider de calidad 60–95% (default 85%).

---

## Compresión PDF (pdf-lib)

Flujo en `compressPDF()`:

### Detección de imágenes JPEG

Busca streams con filtro `DCTDecode` en **dos pasadas**:
- **Pass 1:** `pdfDoc.context.enumerateIndirectObjects()` — escanea todos los objetos indirectos
- **Pass 2:** Resources/XObject de cada página — captura imágenes que no aparecen en Pass 1

La función `hasDCTFilter(filter)` maneja tanto `PDFName` (scalar) como `PDFArray` (array de filtros), porque la spec PDF permite ambas formas.

### Re-compresión JPEG (`recompressJPEGStream`)

Por cada imagen JPEG encontrada:
1. Carga los bytes raw del stream en un `<img>` via Blob URL
2. Si la imagen supera el maxDIM calculado por DPI, escala hacia abajo manteniendo aspect ratio
3. Re-encodea a JPEG via `canvas.toBlob()` al quality elegido
4. Sólo reemplaza el stream si el resultado es más pequeño
5. Actualiza `Length`, `Width`, `Height` en el dict del stream

### Conversión PNG→JPEG (`convertFlatDecodeToJPEG`)

Activado con el checkbox **"Convertir imágenes PNG a JPEG"**. Solo actúa sobre imágenes `FlateDecode + DeviceRGB + 8bit`:

1. Descomprime el stream con la **DecompressionStream API nativa** (zlib primero, deflate-raw como fallback)
2. Si el stream tiene predictor PNG (10-15 en `DecodeParms`), aplica `applyPNGUnpredictor()` — reimplementa los 5 filtros de fila PNG (None, Sub, Up, Average, Paeth)
3. Construye un `ImageData` RGBA desde los bytes RGB raw
4. Dibuja en canvas, escala si supera el DPI máximo, encodea a JPEG
5. Cambia el filtro de `FlateDecode` a `DCTDecode`, elimina `DecodeParms` y referencia `SMask`
6. Sólo reemplaza si el resultado es más pequeño

> **Limitación:** Solo procesa imágenes `DeviceRGB`. CMYK, Indexed y Grayscale se saltean para evitar conversiones de color incorrectas.

### Guardado

`pdfDoc.save({ useObjectStreams: true })` — además de las imágenes, comprime las tablas de referencias cruzadas y streams de objetos del PDF.

### Lo que NO toca

- Texto (fuentes, streams de contenido)
- Anotaciones y links
- Estructura de páginas y layout
- Formularios interactivos
- Imágenes que ya están comprimidas y cuyo reemplazo sería más grande

---

## Controles PDF

| Control | Default | Descripción |
|---------|---------|-------------|
| Calidad imágenes | 75% | Slider 40–95% para re-encodeo JPEG |
| DPI máximo | **72** | Radio pills: 72 / 100 / 150 / 300 DPI |
| Eliminar metadatos | off | Limpia título, autor, keywords, creator |
| Convertir PNG a JPEG | off | Convierte FlateDecode RGB a JPEG (pierde transparencia) |

**Mapeo DPI → píxeles máximos** (basado en el lado largo de A4):

| DPI | Max píxeles |
|-----|-------------|
| 72  | 842 px |
| 100 | 1170 px |
| 150 | 1754 px |
| 200 | 2340 px |
| 300 | sin límite |

---

## Límites y validaciones

| Parámetro | Valor |
|-----------|-------|
| Tamaño máximo de archivo | **200 MB** |
| Formatos aceptados | `.pptx`, `.pdf` |
| Imágenes JPEG mínimas | 30×30 px (se saltean thumbnails tiny) |

---

## i18n

El app soporta español e inglés. El idioma se detecta automáticamente via `navigator.language` y se persiste en `localStorage`. Todas las strings están en el objeto `i18n` en `app.js`. Los elementos HTML usan `data-i18n="key"` para updates automáticos al cambiar idioma.

---

## Tema

Dark/light theme via atributo `data-theme` en `<html>`. Los colores se definen con CSS custom properties en `:root[data-theme="dark"]` y `:root[data-theme="light"]`. Persiste en `localStorage`.

**Paleta (dark):**
- Fondo primario: `#004831`
- Fondo secundario: `#182F25`
- Accent: `#20C683`
- Accent hover: `#001f12`
- Texto secundario: `#95B5A9`

---

## Notas de compatibilidad

- La conversión PNG→JPEG usa `DecompressionStream` (Chrome 80+, Firefox 113+, Safari 16.4+). El checkbox sólo funciona si la API está disponible — se verifica con `typeof DecompressionStream !== 'undefined'`.
- Todo el procesamiento usa APIs de navegador estándar (Canvas, Blob, URL.createObjectURL). No hay WASM ni Web Workers.
- Funciona desde `file://` (sin servidor local) porque pdf-lib es pure JS.

---

## Archivos que falta agregar

- `og-image.png` — imagen 1200×630 para previsualización en redes sociales/WhatsApp (referenciada en las meta OG del `<head>`)
- Favicon (actualmente usa el ícono del navegador por defecto)

---

*Bong Studio · [bongstudio.ar](https://bongstudio.ar)*
