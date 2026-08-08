const DB_NAME = 'PresupuestosDB'
const DB_VERSION = 1

const CATEGORIES_DEFAULT = [
  { id: 'cat-1', name: 'Obra gruesa', icon: '🏗️', orderIndex: 1 },
  { id: 'cat-2', name: 'Albañilería', icon: '🧱', orderIndex: 2 },
  { id: 'cat-3', name: 'Electricidad', icon: '⚡', orderIndex: 3 },
  { id: 'cat-4', name: 'Fontanería', icon: '🔧', orderIndex: 4 },
  { id: 'cat-5', name: 'Climatización', icon: '🌡️', orderIndex: 5 },
  { id: 'cat-6', name: 'Carpintería', icon: '🪵', orderIndex: 6 },
  { id: 'cat-7', name: 'Pintura', icon: '🎨', orderIndex: 7 },
  { id: 'cat-8', name: 'Suelos', icon: '🏠', orderIndex: 8 },
  { id: 'cat-9', name: 'Cocina', icon: '🍳', orderIndex: 9 },
  { id: 'cat-10', name: 'Baños', icon: '🚿', orderIndex: 10 },
  { id: 'cat-11', name: 'Acabados', icon: '✨', orderIndex: 11 },
  { id: 'cat-12', name: 'Varios', icon: '📦', orderIndex: 12 }
]

let db = null

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = e => {
      const d = e.target.result
      if (!d.objectStoreNames.contains('budgets')) {
        d.createObjectStore('budgets', { keyPath: 'id', autoIncrement: true })
      }
      if (!d.objectStoreNames.contains('items')) {
        const s = d.createObjectStore('items', { keyPath: 'id', autoIncrement: true })
        s.createIndex('budgetId', 'budgetId', { unique: false })
        s.createIndex('categoryId', 'categoryId', { unique: false })
      }
      if (!d.objectStoreNames.contains('categories')) {
        const s = d.createObjectStore('categories', { keyPath: 'id' })
        s.createIndex('orderIndex', 'orderIndex', { unique: false })
      }
      if (!d.objectStoreNames.contains('templates')) {
        d.createObjectStore('templates', { keyPath: 'id', autoIncrement: true })
      }
      if (!d.objectStoreNames.contains('photos')) {
        const s = d.createObjectStore('photos', { keyPath: 'id', autoIncrement: true })
        s.createIndex('itemId', 'itemId', { unique: false })
      }
    }
    req.onsuccess = e => {
      db = e.target.result
      resolve(db)
    }
    req.onerror = e => reject(e.target.error)
  })
}

function getAll(store) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const s = tx.objectStore(store)
    const req = s.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function getByIndex(store, index, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const s = tx.objectStore(store)
    const idx = s.index(index)
    const req = idx.getAll(value)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function get(store, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const s = tx.objectStore(store)
    const req = s.get(id)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function put(store, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    const s = tx.objectStore(store)
    const req = s.put(data)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function del(store, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    const s = tx.objectStore(store)
    const req = s.delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

async function initCategories() {
  const cats = await getAll('categories')
  if (cats.length === 0) {
    for (const c of CATEGORIES_DEFAULT) {
      await put('categories', c)
    }
  }
}

async function getCategoriesSorted() {
  const cats = await getAll('categories')
  return cats.sort((a, b) => a.orderIndex - b.orderIndex)
}

async function getItemsByBudget(budgetId) {
  return await getByIndex('items', 'budgetId', budgetId)
}

async function saveBudget(data) {
  return await put('budgets', data)
}

async function saveItem(data) {
  return await put('items', data)
}

async function deleteItem(id) {
  const photos = await getByIndex('photos', 'itemId', id)
  for (const p of photos) {
    await del('photos', p.id)
  }
  await del('items', id)
}

async function savePhoto(itemId, dataUrl) {
  return await put('photos', { itemId, dataUrl, createdAt: new Date().toISOString() })
}

async function getPhotosByItem(itemId) {
  return await getByIndex('photos', 'itemId', itemId)
}

async function deleteItemsByBudget(budgetId) {
  const items = await getItemsByBudget(budgetId)
  for (const item of items) {
    const photos = await getPhotosByItem(item.id)
    for (const p of photos) {
      await del('photos', p.id)
    }
    await del('items', item.id)
  }
}

async function deleteBudget(id) {
  await deleteItemsByBudget(id)
  await del('budgets', id)
}

async function duplicateBudget(id) {
  const original = await get('budgets', id)
  if (!original) return null
  const items = await getItemsByBudget(id)
  const newBudget = { ...original }
  delete newBudget.id
  newBudget.name = original.name + ' (copia)'
  newBudget.date = new Date().toISOString().slice(0, 10)
  const budgetId = await saveBudget(newBudget)
  for (const item of items) {
    const newItem = { ...item }
    delete newItem.id
    newItem.budgetId = budgetId
    await saveItem(newItem)
  }
  return budgetId
}

async function exportAllData() {
  const budgets = await getAll('budgets')
  const items = await getAll('items')
  const templates = await getAll('templates')
  return JSON.stringify({ budgets, items, templates }, null, 2)
}

async function importAllData(json) {
  const data = JSON.parse(json)
  if (data.budgets) {
    for (const b of data.budgets) {
      const { id, ...rest } = b
      await put('budgets', rest)
    }
  }
  if (data.items) {
    for (const i of data.items) {
      const { id, ...rest } = i
      await put('items', rest)
    }
  }
  if (data.templates) {
    for (const t of data.templates) {
      const { id, ...rest } = t
      await put('templates', rest)
    }
  }
}
