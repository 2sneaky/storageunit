const STORAGE_KEY = 'store-stuff:v1'
let items = []

const el = id => document.getElementById(id)
const itemForm = el('itemForm')
const nameInput = el('name')
const categoryInput = el('category')
const qtyInput = el('qty')
const noteInput = el('note')
const saveBtn = el('saveBtn')
const itemsList = el('itemsList')
const empty = el('empty')
const searchInput = el('search')
const filterCategory = el('filterCategory')
const exportBtn = el('exportBtn')
const importFile = el('importFile')
const clearAllBtn = el('clearAllBtn')

function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8)
}

function load(){
  const raw = localStorage.getItem(STORAGE_KEY)
  items = raw ? JSON.parse(raw) : []
  render()
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  render()
}

function addItem(obj){
  obj.id = uid()
  obj.created = new Date().toISOString()
  items.unshift(obj)
  save()
}

function updateItem(id, patch){
  const i = items.findIndex(x=>x.id===id)
  if(i>-1){
    items[i] = {...items[i], ...patch, updated: new Date().toISOString()}
    save()
  }
}

function deleteItem(id){
  items = items.filter(x=>x.id!==id)
  save()
}

function clearAll(){
  if(!confirm('clear all items?')) return
  items = []
  save()
}

function buildCategoryOptions(){
  const cats = Array.from(new Set(items.map(i=>i.category).filter(Boolean))).sort()
  filterCategory.innerHTML = '<option value="">all categories</option>'
  cats.forEach(c=>{
    const o = document.createElement('option')
    o.value = c
    o.textContent = c
    filterCategory.appendChild(o)
  })
}

function render(){
  buildCategoryOptions()
  const q = searchInput.value.trim().toLowerCase()
  const cat = filterCategory.value
  const filtered = items.filter(it=>{
    if(cat && it.category !== cat) return false
    if(!q) return true
    return (it.name + ' ' + (it.note||'') + ' ' + (it.category||'')).toLowerCase().includes(q)
  })
  itemsList.innerHTML = ''
  if(filtered.length===0){
    empty.style.display='block'
  } else {
    empty.style.display='none'
    filtered.forEach(it=>{
      const li = document.createElement('li')
      li.className = 'item'
      const left = document.createElement('div')
      left.className = 'item-left'
      const badge = document.createElement('div')
      badge.className = 'badge'
      badge.textContent = it.qty + 'x'
      const meta = document.createElement('div')
      meta.className = 'meta'
      const title = document.createElement('div')
      title.className = 'title'
      title.textContent = it.name
      const note = document.createElement('div')
      note.className = 'note'
      note.textContent = (it.category ? it.category + ' · ' : '') + (it.note || '')
      meta.appendChild(title)
      meta.appendChild(note)
      left.appendChild(badge)
      left.appendChild(meta)

      const actions = document.createElement('div')
      actions.className = 'actions'
      const editBtn = document.createElement('button')
      editBtn.className = 'btn'
      editBtn.textContent = 'edit'
      editBtn.onclick = ()=>beginEdit(it.id)
      const delBtn = document.createElement('button')
      delBtn.className = 'btn danger'
      delBtn.textContent = 'delete'
      delBtn.onclick = ()=>{ if(confirm('delete item?')) deleteItem(it.id) }
      actions.appendChild(editBtn)
      actions.appendChild(delBtn)

      li.appendChild(left)
      li.appendChild(actions)
      itemsList.appendChild(li)
    })
  }
}

function beginEdit(id){
  const it = items.find(x=>x.id===id)
  if(!it) return
  nameInput.value = it.name
  categoryInput.value = it.category || ''
  qtyInput.value = it.qty || 1
  noteInput.value = it.note || ''
  saveBtn.textContent = 'save changes'
  saveBtn.dataset.editing = id
  nameInput.focus()
}

itemForm.addEventListener('submit', e=>{
  e.preventDefault()
  const payload = {
    name: nameInput.value.trim(),
    category: categoryInput.value.trim(),
    qty: Number(qtyInput.value) || 1,
    note: noteInput.value.trim()
  }
  const editing = saveBtn.dataset.editing
  if(editing){
    updateItem(editing, payload)
    delete saveBtn.dataset.editing
    saveBtn.textContent = 'add item'
  } else {
    addItem(payload)
  }
  itemForm.reset()
})

searchInput.addEventListener('input', render)
filterCategory.addEventListener('change', render)
clearAllBtn.addEventListener('click', clearAll)

exportBtn.addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(items, null, 2)], {type:'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'store-stuff-export.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
})

importFile.addEventListener('change', async (e)=>{
  const f = e.target.files && e.target.files[0]
  if(!f) return
  const txt = await f.text()
  try{
    const parsed = JSON.parse(txt)
    if(!Array.isArray(parsed)) throw new Error('invalid format')
    if(confirm(`import ${parsed.length} items and overwrite current?`)){
      items = parsed.map(it=>({...it, id: it.id || uid()}))
      save()
      importFile.value = ''
    }
  }catch(err){
    alert('bad json file')
  }
})

load()
