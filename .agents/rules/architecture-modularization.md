# Regla: Arquitectura y Modularización del Código

## Contexto
El proyecto actualmente cuenta con un archivo `index.html` monolítico de más de 2000 líneas y scripts independientes en `js/` desacoplados. Esta regla establece la dirección técnica para mantener la calidad y escalabilidad.

## Directrices Obligatorias

1. **Desacoplamiento Gradual:**
   - La lógica JS no debe agregarse inline dentro de `index.html`.
   - Las funciones de base de datos deben estar en `js/db.js`.
   - La lógica de renderizado y eventos debe estar en `js/app.js` o módulos específicos (`js/facturas.js`, `js/presupuestos.js`).
   - La generación de PDF debe centralizarse en `js/pdf.js`.

2. **Uso Exclusivo de IndexedDB:**
   - Reducir la dependencia de `localStorage` para almacenamiento masivo de facturas e imágenes/logos Base64.
   - Usar `js/db.js` como la capa de persistencia asíncrona unificada basada en Promesas (`async/await`).

3. **Separación de CSS:**
   - Mantener estilos globales en `css/style.css` y desacoplarlos de los bloques `<style>` de `index.html`.
   - Utilizar variables CSS (`:root`) para controlar temas, colores primarios/secundarios y espaciado responsive.

4. **Compatibilidad PWA Offline:**
   - Asegurar que `sw.js` (Service Worker) registre correctamente los assets estáticos.
   - Las librerías de terceros (ej. `jsPDF`) deben ofrecer un mecanismo de caché o carga local para funcionamiento sin conexión a internet.
