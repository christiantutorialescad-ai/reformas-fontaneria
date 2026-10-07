---
name: refactor-modularization
description: Guía paso a paso para desacoplar el archivo monolítico index.html e integrar la arquitectura modular basada en IndexedDB (js/db.js, js/app.js, js/pdf.js).
---

# Skill: Refactorización y Modularización del Proyecto

Esta skill se utiliza para migrar progresivamente el código monolítico incrustado en `index.html` hacia una estructura modular moderna y escalable.

## Pasos para la Refactorización

### 1. Migración de Persistencia (localStorage -> IndexedDB)
- Revisar las funciones actuales de almacenamiento en `index.html` (`cargarDatos()`, `guardarDatos()`, objeto global `M`).
- Conectar `js/db.js` en `index.html` mediante etiquetas `<script src="js/db.js"></script>`.
- Reemplazar las operaciones sincrónicas sobre `M` por llamadas asíncronas a `openDB()`, `getAll()`, `put()`, `get()`, `del()`.

### 2. Extracción de Estilos CSS
- Mover los estilos `<style>` de `index.html` hacia `css/style.css`.
- Enlazar `css/style.css` en el `<head>` de `index.html`.

### 3. Separación de Lógica JS por Dominios
- **`js/db.js`**: Gestión del esquema IndexedDB (budgets, items, invoices, clients, templates, config, photos).
- **`js/pdf.js`**: Construcción del PDF con `jsPDF` (cabeceras, tabla de partidas, desgloses fiscales, logos).
- **`js/templates.js`**: Lógica de gestión e importación de plantillas predefinidas.
- **`js/app.js`**: Controlador de interfaz, eventos del DOM, gestión de paneles y navegación.

### 4. Verificación y Pruebas
- Probar el ciclo completo: Crear cliente -> Crear presupuesto -> Convertir a factura -> Exportar a PDF.
- Verificar el funcionamiento sin conexión usando el Service Worker (`sw.js`).
