# Regla: Cumplimiento de Normativa de Facturación en España

## Contexto
Esta regla se aplica a cualquier modificación o extensión del módulo de facturas y presupuestos.

## Directrices Obligatorias

1. **Estructura Legal de Factura:**
   - Número de factura correlativo único.
   - Fecha de emisión y fecha de vencimiento (opcional pero recomendada).
   - Datos fiscales completos del Emisor: Nombre/Razón Social, NIF/CIF, Dirección, Teléfono, Email.
   - Datos fiscales completos del Cliente: Nombre/Razón Social, NIF/CIF, Dirección.

2. **Cálculos Financieros:**
   - **Subtotal / Base Imponible:** Suma de `cantidad * precioUnitario` de cada partida.
   - **Descuentos:** Aplicables antes de impuestos (por porcentaje o importe fijo).
   - **IVA:** Desglose por tipo impositivo (21%, 10%, 4%, 0%). Cálculo: `Base Imponible tras descuento * (% IVA / 100)`.
   - **IRPF (Retención):** Aplicable opcionalmente para profesionales autónomos. Cálculo: `Base Imponible * (% IRPF / 100)` (restando del total).
   - **Total a Pagar:** `Base Imponible - Descuento + IVA - IRPF`.

3. **Estados de Factura:**
   - `Borrador`: Editable.
   - `Enviada`: Emitida al cliente.
   - `Cobrada`: Pagada completamente.
   - `Anulada`: Factura rectificativa o cancelada.

4. **Conversión Presupuesto a Factura:**
   - Mantener trazabilidad del presupuesto de origen.
   - Copiar cliente, partidas, IVA y notas.
   - Asignar nuevo número correlativo de factura y fecha actual.
