---
name: invoice-generator
description: Guía para implementar nuevas funcionalidades en el sistema de facturas (retención IRPF, numeración correlativa, cobros parciales y estados).
---

# Skill: Desarrollo y Ampliación del Módulo de Facturas

Esta skill guía la incorporación de mejoras operativas y legales en el generador de facturas para reformas y fontanería.

## Procedimientos de Implementación

### 1. Añadir Soporte para Retención IRPF
- Añadir campo `irpfRate` en el objeto factura / presupuesto (valores típicos: 0%, 7%, 15%).
- Actualizar el cálculo del resumen financiero:
  $$\text{Subtotal} = \sum (\text{cantidad} \times \text{precioUnitario})$$
  $$\text{Base Imponible} = \text{Subtotal} - \text{Descuento}$$
  $$\text{IVA} = \text{Base Imponible} \times \frac{\text{taxRate}}{100}$$
  $$\text{IRPF} = \text{Base Imponible} \times \frac{\text{irpfRate}}{100}$$
  $$\text{Total Factura} = \text{Base Imponible} + \text{IVA} - \text{IRPF}$$
- Actualizar la interfaz HTML (`index.html`) para mostrar la fila de IRPF.
- Actualizar la exportación en `js/pdf.js` para incluir la línea de retención de IRPF.

### 2. Gestión de Numeración Serie Correlativa
- Formato configurable: `FAC-[AÑO]-[NÚMERO]` (ej. `FAC-2026-001`).
- Auto-incrementar el número observando la última factura registrada en el año corriente.

### 3. Estados de Factura y Seguimiento de Cobro
- Estados permitidos: `Borrador`, `Enviada`, `Cobrada`, `Parcialmente Cobrada`, `Anulada`.
- En caso de cobro parcial, permitir registrar fecha de cobro y saldo pendiente.

### 4. Integración de Envío por WhatsApp
- Formatear mensaje predefinido con el desglose del total y enlace de descarga o detalle.
- Usar la API de `https://wa.me/?text=...` adecuadamente codificada con `encodeURIComponent()`.
