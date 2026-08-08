let currentTemplate = null

async function showTemplatesPanel() {
  hideAllPanels()
  document.getElementById('templatesPanel').classList.remove('hidden')
  await renderTemplateList()
}

async function renderTemplateList() {
  const list = document.getElementById('templateList')
  const templates = await getAll('templates')
  if (templates.length === 0) {
    list.innerHTML = '<p class="empty-msg">No hay plantillas. Crea una desde un presupuesto.</p>'
    return
  }
  list.innerHTML = templates.map(t => `
    <div class="template-card card" data-id="${t.id}">
      <div class="template-info">
        <strong>${escapeHtml(t.name)}</strong>
        <small>${t.items ? t.items.length : 0} partidas</small>
      </div>
      <div class="template-actions">
        <button class="btn-sm btn-primary" onclick="useTemplate(${t.id})">Usar</button>
        <button class="btn-sm btn-danger" onclick="deleteTemplate(${t.id})">×</button>
      </div>
    </div>
  `).join('')
}

function saveAsTemplate() {
  const name = prompt('Nombre de la plantilla:')
  if (!name) return
  const items = budgetItems.map((item, i) => ({
    name: item.name,
    categoryId: item.categoryId,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unitPrice
  }))
  put('templates', { name, items })
  alert('Plantilla guardada')
}

async function useTemplate(id) {
  const t = await get('templates', id)
  if (!t || !t.items) return
  for (const ti of t.items) {
    budgetItems.push({
      id: Date.now() + Math.random(),
      budgetId: currentBudgetId,
      name: ti.name,
      categoryId: ti.categoryId,
      quantity: ti.quantity,
      unit: ti.unit || 'ud',
      unitPrice: ti.unitPrice,
      total: (ti.quantity || 0) * (ti.unitPrice || 0)
    })
  }
  await renderItems()
  await saveCurrentBudget()
  showToast('Plantilla aplicada')
}

async function deleteTemplate(id) {
  if (!confirm('Eliminar plantilla?')) return
  await del('templates', id)
  await renderTemplateList()
}
