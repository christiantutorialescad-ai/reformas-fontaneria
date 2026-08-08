let currentBudgetId = null
let budgetItems = []
let budgetData = null

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await openDB()
    await initCategories()
    await renderBudgetList()

    // Search input
    document.getElementById('searchBudget').addEventListener('input', e => {
      renderBudgetList(e.target.value)
    })

    // Menu overlay close
    document.getElementById('menuOverlay').addEventListener('click', toggleMenu)

  } catch (e) {
    showToast('Error al iniciar la app: ' + e.message)
    console.error(e)
  }
})

function escapeHtml(t) {
  const d = document.createElement('div')
  d.textContent = t
  return d.innerHTML
}

function fmtPrice(n) {
  return (n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function fmtDate(d) {
  if (!d) return ''
  const parts = d.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return d
}

function showToast(msg) {
  const existing = document.querySelector('.toast')
  if (existing) existing.remove()
  const t = document.createElement('div')
  t.className = 'toast'
  t.textContent = msg
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 2500)
}

function hideAllPanels() {
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'))
}

function goHome() {
  hideAllPanels()
  document.getElementById('budgetListPanel').classList.remove('hidden')
  document.getElementById('pageTitle').textContent = 'Presupuestos'
  document.getElementById('backBtn').classList.add('hidden')
  if (currentBudgetId && !document.getElementById('editPanel').classList.contains('hidden')) {
    renderBudgetList()
  }
  currentBudgetId = null
  budgetItems = []
}

async function renderBudgetList(filter = '') {
  const container = document.getElementById('budgetList')
  let budgets = await getAll('budgets')
  if (filter) {
    const f = filter.toLowerCase()
    budgets = budgets.filter(b => (b.name || '').toLowerCase().includes(f) || (b.client || '').toLowerCase().includes(f))
  }
  if (budgets.length === 0) {
    container.innerHTML = '<p class="empty-msg">No hay presupuestos aún. Pulsa + para crear uno.</p>'
    return
  }
  container.innerHTML = budgets.sort((a, b) => (b.id || 0) - (a.id || 0)).map(b => {
    const total = b.totalCalculated || 0
    return `<div class="budget-card" onclick="openBudget(${b.id})">
      <div class="budget-info">
        <h3>${escapeHtml(b.name || 'Sin nombre')}</h3>
        <small>${b.client ? escapeHtml(b.client) + ' · ' : ''}${fmtDate(b.date)}</small>
      </div>
      <div class="budget-total">${fmtPrice(total)}</div>
    </div>`
  }).join('')
}


async function openBudget(id) {
  currentBudgetId = id
  budgetData = await get('budgets', id)
  budgetItems = await getItemsByBudget(id)
  hideAllPanels()
  document.getElementById('editPanel').classList.remove('hidden')
  document.getElementById('pageTitle').textContent = budgetData.name || 'Editar presupuesto'
  document.getElementById('backBtn').classList.remove('hidden')
  populateForm()
  await renderItems()
}

function newBudget() {
  currentBudgetId = null
  budgetData = {
    name: '',
    client: '',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
    taxRate: 21,
    discountType: 'percent',
    discountValue: 0
  }
  budgetItems = []
  hideAllPanels()
  document.getElementById('editPanel').classList.remove('hidden')
  document.getElementById('pageTitle').textContent = 'Nuevo presupuesto'
  document.getElementById('backBtn').classList.remove('hidden')
  populateForm()
  renderItems()
}

function populateForm() {
  document.getElementById('budgetName').value = budgetData.name || ''
  document.getElementById('budgetClient').value = budgetData.client || ''
  document.getElementById('budgetDate').value = budgetData.date || ''
  document.getElementById('budgetNotes').value = budgetData.notes || ''
  document.getElementById('taxRate').value = budgetData.taxRate || 0
  document.getElementById('discountType').value = budgetData.discountType || 'percent'
  document.getElementById('discountValue').value = budgetData.discountValue || 0
}

async function saveCurrentBudget() {
  const data = {
    name: document.getElementById('budgetName').value.trim() || 'Presupuesto',
    client: document.getElementById('budgetClient').value.trim(),
    date: document.getElementById('budgetDate').value,
    notes: document.getElementById('budgetNotes').value.trim(),
    taxRate: parseFloat(document.getElementById('taxRate').value) || 0,
    discountType: document.getElementById('discountType').value,
    discountValue: parseFloat(document.getElementById('discountValue').value) || 0,
    totalCalculated: calculateTotal()
  }
  if (currentBudgetId) data.id = currentBudgetId
  currentBudgetId = await saveBudget(data)
  budgetData = data
  budgetData.id = currentBudgetId
}

async function renderItems() {
  const container = document.getElementById('itemsContainer')
  const cats = await getCategoriesSorted()
  const catMap = {}
  cats.forEach(c => { catMap[c.id] = c })

  const grouped = {}
  for (const item of budgetItems) {
    const cid = item.categoryId || 'cat-12'
    if (!grouped[cid]) grouped[cid] = []
    grouped[cid].push(item)
  }

  let html = ''

  for (const cat of cats) {
    const items = grouped[cat.id] || []
    if (items.length === 0 && cat.id !== 'cat-12') continue
    if (items.length > 0) {
      html += `<div class="item-row cat-header"><span>${cat.icon} ${cat.name}</span></div>`
      for (const item of items) {
        html += renderItemRow(item, cats)
      }
    }
  }

  const ungrouped = grouped['cat-12'] || []
  if (ungrouped.length > 0) {
    html += `<div class="item-row cat-header"><span>📦 Varios</span></div>`
    for (const item of ungrouped) {
      html += renderItemRow(item, cats)
    }
  }

  html += `<button class="btn btn-outline btn-sm" onclick="addItem()" style="margin-top:8px;width:100%">+ Añadir partida</button>`

  container.innerHTML = html
  updateSummary()
}

function renderItemRow(item, cats) {
  const catOptions = cats.map(c => `<option value="${c.id}" ${c.id === item.categoryId ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')
  return `<div class="item-row" data-id="${item.id}">
    <select onchange="updateItem(${item.id},'categoryId',this.value)">${catOptions}</select>
    <input type="text" value="${escapeHtml(item.name)}" onchange="updateItem(${item.id},'name',this.value)" placeholder="Partida">
    <input type="number" step="0.01" min="0" value="${item.quantity || 0}" onchange="updateItem(${item.id},'quantity',parseFloat(this.value)||0)" style="width:70px">
    <select onchange="updateItem(${item.id},'unit',this.value)" style="width:60px">
      <option value="ud" ${item.unit === 'ud' ? 'selected' : ''}>ud</option>
      <option value="m²" ${item.unit === 'm²' ? 'selected' : ''}>m²</option>
      <option value="m" ${item.unit === 'm' ? 'selected' : ''}>m</option>
      <option value="l" ${item.unit === 'l' ? 'selected' : ''}>l</option>
      <option value="kg" ${item.unit === 'kg' ? 'selected' : ''}>kg</option>
      <option value="h" ${item.unit === 'h' ? 'selected' : ''}>h</option>
    </select>
    <input type="number" step="0.01" min="0" value="${item.unitPrice || 0}" onchange="updateItem(${item.id},'unitPrice',parseFloat(this.value)||0)" placeholder="€/ud" style="width:80px">
    <span class="item-total">${fmtPrice(item.total || 0)}</span>
    <button class="del-item" onclick="deleteItemPrompt(${item.id})">×</button>
  </div>`
}

function addItem() {
  const newItem = {
    id: Date.now() + Math.random(),
    budgetId: currentBudgetId,
    categoryId: 'cat-2',
    name: '',
    quantity: 0,
    unit: 'ud',
    unitPrice: 0,
    total: 0
  }
  budgetItems.push(newItem)
  renderItems()
}

function updateItem(id, field, value) {
  const item = budgetItems.find(i => i.id === id)
  if (!item) return
  item[field] = value
  item.total = (item.quantity || 0) * (item.unitPrice || 0)
  renderItems()
}

function deleteItemPrompt(id) {
  if (!confirm('Eliminar esta partida?')) return
  budgetItems = budgetItems.filter(i => i.id !== id)
  renderItems()
}

function updateSummary() {
  const subtotal = budgetItems.reduce((s, i) => s + (i.total || 0), 0)
  const discountType = document.getElementById('discountType').value
  const discountValue = parseFloat(document.getElementById('discountValue').value) || 0
  const taxRate = parseFloat(document.getElementById('taxRate').value) || 0

  let discountAmount = 0
  if (discountValue > 0) {
    discountAmount = discountType === 'percent' ? subtotal * (discountValue / 100) : discountValue
  }

  const afterDiscount = subtotal - discountAmount
  const taxAmount = afterDiscount * (taxRate / 100)
  const total = afterDiscount + taxAmount

  document.getElementById('summarySubtotal').textContent = fmtPrice(subtotal)
  document.getElementById('summaryDiscount').textContent = discountAmount > 0 ? `-${fmtPrice(discountAmount)}` : '0,00 €'
  document.getElementById('summaryTax').textContent = fmtPrice(taxAmount)
  document.getElementById('summaryTotal').textContent = fmtPrice(total)

  document.getElementById('summaryDiscountRow').style.display = discountAmount > 0 ? 'flex' : 'none'
}

function calculateTotal() {
  const subtotal = budgetItems.reduce((s, i) => s + (i.total || 0), 0)
  const discountType = document.getElementById('discountType').value
  const discountValue = parseFloat(document.getElementById('discountValue').value) || 0
  const taxRate = parseFloat(document.getElementById('taxRate').value) || 0
  let discountAmount = 0
  if (discountValue > 0) {
    discountAmount = discountType === 'percent' ? subtotal * (discountValue / 100) : discountValue
  }
  const afterDiscount = subtotal - discountAmount
  return afterDiscount + (afterDiscount * (taxRate / 100))
}

async function saveBudgetFromUI() {
  await saveCurrentBudget()
  if (budgetData && budgetData.id) {
    await deleteItemsByBudget(budgetData.id)
    for (const item of budgetItems) {
      await saveItem({
        budgetId: budgetData.id,
        categoryId: item.categoryId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        total: (item.quantity || 0) * (item.unitPrice || 0)
      })
    }
    budgetItems = await getItemsByBudget(budgetData.id)
  }
  showToast('Presupuesto guardado')
}

function toggleMenu() {
  const overlay = document.getElementById('menuOverlay')
  const menu = document.getElementById('sideMenu')
  const showing = !overlay.classList.contains('hidden')
  overlay.classList.toggle('hidden', showing)
  menu.classList.toggle('hidden', showing)
  document.getElementById('menuOpen').classList.toggle('hidden', !showing)
}


function menuNewBudget() {
  toggleMenu()
  newBudget()
}

function menuHome() {
  toggleMenu()
  goHome()
}

async function menuTemplates() {
  toggleMenu()
  hideAllPanels()
  document.getElementById('templatesPanel').classList.remove('hidden')
  document.getElementById('pageTitle').textContent = 'Plantillas'
  document.getElementById('backBtn').classList.remove('hidden')
  await renderTemplateList()
}

function menuExportPDF() {
  toggleMenu()
  if (!currentBudgetId) return showToast('Abre un presupuesto primero')
  exportToPDF()
}

function menuExportData() {
  toggleMenu()
  exportAllData().then(json => {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'presupuestos_backup.json'
    a.click()
    URL.revokeObjectURL(url)
    showToast('Datos exportados')
  })
}

function menuImportData() {
  toggleMenu()
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async e => {
    const file = e.target.files[0]
    if (!file) return
    const text = await file.text()
    try {
      await importAllData(text)
      showToast('Datos importados')
      renderBudgetList()
    } catch (err) {
      showToast('Error al importar: ' + err.message)
    }
  }
  input.click()
}

function menuSaveAsTemplate() {
  toggleMenu()
  saveAsTemplate()
}
