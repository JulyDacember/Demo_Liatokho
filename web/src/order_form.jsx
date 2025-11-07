
import React from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
const api = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const token = ()=> localStorage.getItem('token')

export default function OrderForm(){
  const nav = useNavigate()
  const params = useParams()
  const isNew = !params.id
  const [order,setOrder]=React.useState({order_code:'',status:'pending',pickup_address:'',order_date:new Date().toISOString().slice(0,10),delivery_date:''})
  const [items,setItems]=React.useState([])
  const [products,setProducts]=React.useState([])

  React.useEffect(()=>{ (async()=>{
    const ps = await fetch(api+'/api/products').then(r=>r.json())
    setProducts(ps)
    if(!isNew){
      const data = await fetch(api+'/api/orders/'+params.id, { headers:{ Authorization:'Bearer '+token() } }).then(r=>r.json())
      setOrder(data.order)
      setItems(data.items)
    }
  })() },[])

  function addItem(){ setItems([...items, { product_id: products[0]?.id||null, quantity:1, unit_price: products[0]?.price||0 }])}
  function updateItem(i, patch){ const arr=[...items]; arr[i]={...arr[i], ...patch}; setItems(arr) }
  function removeItem(i){ const arr=[...items]; arr.splice(i,1); setItems(arr) }

  async function onSubmit(e){
    e.preventDefault()
    const payload = { order, items: items.filter(it=>it.product_id) }
    const url = isNew? api+'/api/orders' : api+'/api/orders/'+params.id
    const r = await fetch(url, { method: isNew? 'POST':'PUT', headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+token() }, body: JSON.stringify(payload) })
    const data = await r.json().catch(()=>({}))
    if(!r.ok){ alert(data.message||'Ошибка'); return }
    nav('/orders')
  }

  return (<div style={{padding:16, maxWidth:900, margin:'0 auto'}}>
    <h3>{isNew? 'Добавление заказа':'Редактирование заказа (ID '+order.id+')'}</h3>
    <form onSubmit={onSubmit}>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12}}>
        <label>Артикул<input value={order.order_code} onChange={e=>setOrder({...order, order_code:e.target.value})} required/></label>
        <label>Статус<select value={order.status} onChange={e=>setOrder({...order, status:e.target.value})}>
          <option value="pending">pending</option>
          <option value="processing">processing</option>
          <option value="shipped">shipped</option>
          <option value="delivered">delivered</option>
          <option value="cancelled">cancelled</option>
        </select></label>
        <label>Адрес ПВЗ<input value={order.pickup_address} onChange={e=>setOrder({...order, pickup_address:e.target.value})} required/></label>
        <label>Дата заказа<input type="date" value={order.order_date} onChange={e=>setOrder({...order, order_date:e.target.value})} required/></label>
        <label>Дата выдачи<input type="date" value={order.delivery_date||''} onChange={e=>setOrder({...order, delivery_date:e.target.value})}/></label>
      </div>

      <h4>Товары</h4>
      <div style={{display:'grid', gap:8}}>
        {items.map((it,i)=> <div key={i} style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 60px', gap:8}}>
          <select value={it.product_id||''} onChange={e=>{
            const p = products.find(p=>p.id==e.target.value); updateItem(i, { product_id: e.target.value, unit_price: p?.price||0 })
          }}>
            <option value="">-</option>
            {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="number" min="1" value={it.quantity} onChange={e=>updateItem(i,{quantity:Number(e.target.value)})}/>
          <input type="number" step="0.01" min="0" value={it.unit_price} onChange={e=>updateItem(i,{unit_price:e.target.value})}/>
          <button type="button" onClick={()=>removeItem(i)}>X</button>
        </div>)}
      </div>
      <div style={{marginTop:8}}>
        <button type="button" onClick={addItem}>Добавить позицию</button>
      </div>

      <div style={{display:'flex', gap:8, marginTop:12}}>
        <button type="submit">{isNew? 'Добавить':'Сохранить'}</button>
        <Link to="/orders">Назад</Link>
      </div>
    </form>
  </div>)
}
