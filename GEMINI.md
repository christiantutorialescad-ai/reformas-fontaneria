# Reglas del Proyecto: Gestión de Reformas y Facturación

Este archivo define las reglas generales para el desarrollo y mantenimiento del proyecto de **Gestión de Reformas & Facturas**.

---

## 1. Arquitectura y Estructura de Código

- **Modularidad:** El código JavaScript debe desacoplarse del HTML monolítico (`index.html`). Utilizar módulos en la carpeta `js/` (`db.js`, `app.js`, `pdf.js`, `templates.js`, etc.).
- **Almacenamiento de Datos:** El sistema principal debe usar **IndexedDB** (`js/db.js`) en lugar de `localStorage` para evitar los límites de memoria (5MB) al almacenar imágenes/logos Base64 y PDF grandes.
- **Formato Visual:** Mantener la estética limpia adaptada a dispositivos móviles (PWA) e impresoras. Preservar las variables CSS globales (`:root`).

---

## 2. Normativa de Facturación y Presupuestos (España)

- **Serie y Numeración:** Las facturas deben mantener correlatividad y números de serie configurables (ej. `FAC-2026/001`).
- **Impuestos (IVA e IRPF):**
  - IVA por defecto: 21% (con opción de 10% o 4% según el tipo de reforma).
  - Retención IRPF opcional para autónomos/profesionales (-15% o -7%).
- **Campos Obligatorios:** Las facturas deben incluir NIF/CIF del emisor y receptor, dirección completa, fecha de expedición y desglose de bases imponibles.

---

## 3. Seguridad y Privacidad

- **Credenciales:** Evitar almacenar claves fijas en el código de producción. Usar autenticación segura o hash local si aplica.
- **Datos de Clientes:** Garantizar la privacidad y el aislamiento de los datos guardados localmente.

---

## 4. Prácticas de Codificación

- **Estilo JS:** JavaScript moderno (ES6+), funciones asíncronas (`async/await`), manejo explícito de errores (`try/catch`).
- **Generación de PDF:** Usar `jsPDF` con plantillas claras, garantizando soporte offline cuando sea posible.
