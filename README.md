# Gorilla Screens — app de campo

Una app web para vendedores de **Gorilla Screening Solutions LLC**. El vendedor captura la dirección, las fotos y las medidas, y la app genera:

- **Modelo 3D** de la casa con los screens: antes y después, y 7 vistas.
- **Área total en pie²**: arcos, rectangulares y top screen.
- **Cotización PDF** por pie², con botones de $15, $20, $25 u Otro, extras y versión en español o inglés.
- **Plano PDF de 3 hojas** estilo hoja de ingeniería, con logo, dirección, sello del ingeniero, notas y detalles. Rojo = trabajo nuevo.
- **Link para el cliente** con el 3D y la cotización. El precio es opcional.

Todo corre en el navegador. No hay servidor ni base de datos, y los proyectos se guardan en el dispositivo del vendedor.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub, por ejemplo `gorilla-screens`.
2. Sube **todo el contenido de esta carpeta** a la raíz del repo, incluido el archivo `.nojekyll`.
   ```bash
   git init
   git add .
   git commit -m "Gorilla Screens v1"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/gorilla-screens.git
   git push -u origin main
   ```
3. En GitHub, ve a **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`** y guarda.
4. En 1 o 2 minutos queda en `https://TU-USUARIO.github.io/gorilla-screens/`.
5. En el iPhone, abre el link en Safari y toca **Compartir → Agregar a pantalla de inicio**. Queda como una app.

Para probarla en tu computadora: `python3 -m http.server 8080` y abre `http://localhost:8080`. Tiene que abrirse desde un servidor, porque abriendo el archivo directamente no funciona.

## Primer uso

- **Ajustes** (el engrane en la pantalla de proyectos): nombre, dirección, teléfono, email, licencia e ingeniero de récord. Salen en el plano y en la cotización.
- **Cargar proyecto de ejemplo**: abre 22743 SW 56th Ave con sus fotos y medidas.

## Flujo del vendedor

| Pestaña | Qué hace |
|---|---|
| Datos | Dirección, mapa satelital, botones a vista aérea y Street View, cliente, vendedor y notas |
| Fotos | Lista guiada por categoría, con cámara directa |
| Medidas | Openings (arco o rectangular, ancho y alto en pies y pulgadas, puerta), pilares, porche, top screen, gutters, color y malla. Pie² en vivo |
| 3D | Antes y con screens, vistas, landscaping, palmas y captura |
| Precio | Pie² × tarifa ($15, $20, $25 u Otro), extras, total y cotización PDF |
| Entregar | Plano PDF, cotización, link para el cliente y exportar el proyecto |

**Fórmula del arco:** área = W × (H − W/2) + π × (W/2)² / 2, donde H es la altura total del arco.

## Límites actuales (v1)

- **Capturas de Google:** el vendedor las toma y las sube. Automatizarlas requiere una API key de Google Maps Platform y un servidor, y sus términos restringen ese uso.
- **Proyectos por dispositivo:** se usa **Exportar / Importar** para pasarlos entre teléfonos o a la oficina. Para compartir entre todo el equipo, el siguiente paso es Supabase o Firebase.
- **Modelo 3D:** representa una casa tipo ala izquierda + porche de openings + garage. Las medidas de los openings, el porche, el top screen y los gutters son exactas a lo ingresado. El resto de la casa es aproximado y solo sirve de referencia visual.
- **Sello del ingeniero:** el plano sale como **borrador**. El sello y las especificaciones de anclaje las pone el ingeniero de récord.
- **Fotos de Google:** no subas capturas de Google a un repositorio público.

## Estructura

```
index.html              shell de la app
css/app.css             estilos (claro y oscuro, móvil primero)
js/model.js             datos del proyecto, áreas, pies y pulgadas, link de cliente
js/storage.js           IndexedDB (proyectos + fotos)
js/scene3d.js           modelo 3D paramétrico (three.js r128)
js/plan.js              plano PDF de 3 hojas (jsPDF)
js/quote.js             cotización PDF
js/app.js               pantallas y lógica
sw.js                   cache para abrir con mala señal
manifest.webmanifest    instalar en la pantalla de inicio
assets/                 logo e íconos
demo/                   fotos del proyecto de ejemplo
```

Librerías por CDN, con versiones fijas: three.js r128, OrbitControls 0.128.0 y jsPDF 2.5.1.
