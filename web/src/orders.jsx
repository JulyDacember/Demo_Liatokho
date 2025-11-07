
import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
const api = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const token = ()=> localStorage.getItem('token')
export default function Orders(){
  const nav = useNavigate()
  const [list,setList]=React.useState([])
  async function load(){
    const r = await fetch(api+'/api/orders', { headers: { Authorization:'Bearer '+token() } })
    if (!r.ok){ alert('Нет доступа'); return }
    setList(await r.json())
  }
  React.useEffect(()=>{ load() },[])
  return (<div style={{padding:16}}>
    <div style={{display:'flex', gap:8, marginBottom:8}}>
      <h3 style={{margin:0}}>Заказы</h3>
      <div style={{flex:1}}/>
      <button onClick={()=>nav('/orders/new')}>Добавить заказ</button>
      <Link to="/products" style={{marginLeft:8}}>Назад</Link>
    </div>
    <div>
      {list.map(o=> <div key={o.id} style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr 160px', gap:8, padding:8, border:'1px solid #ddd', borderRadius:8, marginBottom:8}}>
        <div><b>{o.order_code}</b></div>
        <div>{o.status}</div>
        <div>{o.pickup_address}</div>
        <div>{o.order_date}</div>
        <div>{o.delivery_date||'-'}</div>
        <div style={{display:'flex', gap:6}}>
          <button onClick={()=>nav('/orders/'+o.id)}>Изм.</button>
          <button onClick={async()=>{
            if(!confirm('Удалить заказ?')) return
            const r = await fetch(api+'/api/orders/'+o.id, { method:'DELETE', headers:{ Authorization:'Bearer '+token() } })
            if(!r.ok){ alert('Ошибка'); return }
            load()
          }}>Удал.</button>
        </div>
      </div>)}
    </div>
  </div>)
}
