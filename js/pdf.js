async function exportToPDF() {
  // Cargar jsPDF si no está disponible
  if (!window.jspdf) {
    showToast('Cargando PDF...')
    await new Promise((resolve, reject) => {
      var s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      s.onload = resolve
      s.onerror = reject
      document.head.appendChild(s)
    }).catch(() => {
      showToast('Sin internet: no se puede generar PDF')
      return null
    })
    if (!window.jspdf) return
  }

  if (!currentBudgetId) {
    showToast('Primero guarda el presupuesto')
    return
  }

  const budget = await get('budgets', currentBudgetId)
  if (!budget) return showToast('Primero guarda el presupuesto')

  try {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = 190
    let y = 15

    function addText(text, size, bold, x, align) {
      doc.setFontSize(size)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.text(String(text), x || pageW / 2, y, { align: align || 'center' })
      y += size * 0.5
    }

    // Cabecera azul
    doc.setFillColor(21, 101, 192)
    doc.rect(0, 0, 210, 35, 'F')
    doc.setTextColor(255, 255, 255)
    addText('PRESUPUESTO DE REFORMAS', 20, true)
    doc.setTextColor(0, 0, 0)

    y += 5
    doc.setDrawColor(200, 200, 200)
    doc.line(10, y, 200, y)
    y += 8

    addText(`Presupuesto: ${budget.name || 'Sin nombre'}`, 12, true, 15, 'left')
    if (budget.client) addText(`Cliente: ${budget.client}`, 10, false, 15, 'left')
    addText(`Fecha: ${budget.date || new Date().toLocaleDateString('es')}`, 10, false, 15, 'left')
    y += 5

    const categories = await getCategoriesSorted()
    const items = await getItemsByCategory(currentBudgetId)

    for (const cat of categories) {
      const catItems = items.filter(i => i.categoryId === cat.id)
      if (catItems.length === 0) continue

      if (y > 250) { doc.addPage(); y = 20 }

      doc.setFillColor(240, 240, 240)
      doc.rect(10, y - 3, pageW, 7, 'F')
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`${cat.name}`, 15, y + 1)
      y += 8

      let catTotal = 0
      for (const item of catItems) {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(String(item.name || '-'), 15, y)
        doc.text(`${item.quantity || 0} ${item.unit || 'ud'}`, 110, y)
        doc.text(fmtPrice(item.unitPrice), 140, y)
        doc.text(fmtPrice(item.total), 175, y)
        catTotal += item.total || 0
        y += 5
      }

      doc.setFont('helvetica', 'bold')
      doc.text(`Subtotal ${cat.name}: ${fmtPrice(catTotal)}`, 15, y)
      y += 7
    }

    y += 5
    doc.setDrawColor(0, 0, 0)
    doc.line(10, y, 200, y)
    y += 8

    const subtotal = items.reduce((s, i) => s + (i.total || 0), 0)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Subtotal: ${fmtPrice(subtotal)}`, 140, y)
    y += 6

    let discountAmount = 0
    if (budget.discountValue && budget.discountValue > 0) {
      if (budget.discountType === 'percent') {
        discountAmount = subtotal * (budget.discountValue / 100)
        doc.text(`Descuento (${budget.discountValue}%): -${fmtPrice(discountAmount)}`, 140, y)
      } else {
        discountAmount = budget.discountValue
        doc.text(`Descuento: -${fmtPrice(discountAmount)}`, 140, y)
      }
      y += 6
    }

    const afterDiscount = subtotal - discountAmount
    let taxAmount = 0
    if (budget.taxRate && budget.taxRate > 0) {
      taxAmount = afterDiscount * (budget.taxRate / 100)
      doc.text(`IVA (${budget.taxRate}%): ${fmtPrice(taxAmount)}`, 140, y)
      y += 6
    }

    const total = afterDiscount + taxAmount
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`TOTAL: ${fmtPrice(total)}`, 140, y)
    y += 10

    if (budget.notes) {
      y += 5
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.text(`Notas: ${budget.notes}`, 15, y)
    }

    doc.save(`Presupuesto_${(budget.name || 'sin_nombre').replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`)
    showToast('PDF generado')
  } catch (e) {
    showToast('Error al generar PDF: ' + e.message)
  }
}

async function getItemsByCategory(budgetId) {
  const items = await getItemsByBudget(budgetId)
  const categories = await getCategoriesSorted()
  const catOrder = {}
  categories.forEach((c, i) => { catOrder[c.id] = i })
  return items.sort((a, b) => (catOrder[a.categoryId] || 99) - (catOrder[b.categoryId] || 99))
}
