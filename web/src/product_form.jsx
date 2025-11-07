
import React from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
const api = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const token = ()=> localStorage.getItem('token')

export default function ProductForm(){
  const nav = useNavigate()
  const params = useParams()
  const isNew = !params.id
  const [lookups,setLookups]=React.useState({categories:[],manufacturers:[],suppliers:[]})
  const [model,setModel]=React.useState({name:'',description:'',price:0,unit:'пара',stock_quantity:0,discount:0})
  const [image,setImage]=React.useState(null)

  React.useEffect(()=>{ (async()=>{
    const lu = await fetch(api+'/api/lookups').then(r=>r.json())
    setLookups(lu)
    if(!isNew){
      const data = await fetch(api+'/api/products/'+params.id).then(r=>r.json())
      setModel(data)
    }
  })() },[])

  async function onSubmit(e){
    e.preventDefault()
    const fd = new FormData()
    for (const k of ['name','description','price','unit','stock_quantity','discount','category_id','manufacturer_id','supplier_id']){
      if (model[k]!==undefined && model[k]!==null) fd.append(k, model[k])
    }
    if (image) fd.append('image', image)
    const url = isNew? api+'/api/products' : api+'/api/products/'+params.id
    const r = await fetch(url, { method: isNew? 'POST':'PUT', headers: { Authorization: 'Bearer '+token() }, body: fd })
    const data = await r.json().catch(()=>({}))
    if(!r.ok){ alert(data.message || 'Ошибка'); return }
    nav('/products')
  }

  return (<div style={{padding:16,maxWidth:720, margin:'0 auto'}}>
    <h3>{isNew? 'Добавление товара':'Редактирование товара (ID '+model.id+')'}</h3>
    <form onSubmit={onSubmit}>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <label>Название<input value={model.name} onChange={e=>setModel({...model, name:e.target.value})} required/></label>
        <label>Категория<select value={model.category_id||''} onChange={e=>setModel({...model, category_id:e.target.value||null})}>
          <option value="">-</option>
          {lookups.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select></label>
        <label>Описание<textarea value={model.description||''} onChange={e=>setModel({...model, description:e.target.value})}/></label>
        <label>Производитель<select value={model.manufacturer_id||''} onChange={e=>setModel({...model, manufacturer_id:e.target.value||null})}>
          <option value="">-</option>
          {lookups.manufacturers.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
        </select></label>
        <label>Поставщик<select value={model.supplier_id||''} onChange={e=>setModel({...model, supplier_id:e.target.value||null})}>
          <option value="">-</option>
          {lookups.suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select></label>
        <label>Цена<input type="number" step="0.01" min="0" value={model.price} onChange={e=>setModel({...model, price:e.target.value})} required/></label>
        <label>Единица<input value={model.unit} onChange={e=>setModel({...model, unit:e.target.value})} required/></label>
        <label>Количество<input type="number" min="0" value={model.stock_quantity} onChange={e=>setModel({...model, stock_quantity:e.target.value})} required/></label>
        <label>Скидка (%)<input type="number" min="0" max="100" step="0.01" value={model.discount} onChange={e=>setModel({...model, discount:e.target.value})}/></label>
        <label>Фото<input type="file" accept="image/*" onChange={e=>setImage(e.target.files[0])}/></label>
      </div>
      <div style={{display:'flex', gap:8, marginTop:12}}>
        <button type="submit">{isNew? 'Добавить':'Сохранить'}</button>
        <Link to="/products">Назад</Link>
      </div>
    </form>
  </div>)
}
