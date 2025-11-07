
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
const api = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const token = ()=> localStorage.getItem('token')
const user = ()=> JSON.parse(localStorage.getItem('user')||'null')

export default function Products(){
  const u = user()
  const nav = useNavigate()
  const [list,setList]=React.useState([])
  const [lookups,setLookups]=React.useState({suppliers:[]})
  const [search,setSearch]=React.useState('')
  const [supplierId,setSupplierId]=React.useState('')
  const [sort,setSort]=React.useState('')

  React.useEffect(()=>{ (async()=>{
    const lu = await fetch(api+'/api/lookups').then(r=>r.json())
    setLookups(lu)
  })() },[])

  async function load(){
    const qs = new URLSearchParams({search, supplierId, sort}).toString()
    const data = await fetch(api+'/api/products?'+qs).then(r=>r.json())
    setList(data)
  }
  React.useEffect(()=>{ load() },[search,supplierId,sort])

  function priceRow(p){
    const hasDiscount = Number(p.discount)>0
    const finalPrice = (Number(p.price)*(100-Number(p.discount)) / 100).toFixed(2)
    return (<div>
      {hasDiscount? <span style={{textDecoration:'line-through', color:'red', marginRight:8}}>{p.price} ₽</span>: null}
      <span style={{color:'#000'}}>{hasDiscount? finalPrice : p.price} ₽</span>
    </div>)
  }

  return (<div style={{padding:16}}>
    <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:8}}>
      {(u && (u.role==='manager' || u.role==='admin'))? <>
        <input placeholder="Поиск..." value={search} onChange={e=>setSearch(e.target.value)} />
        <select value={supplierId} onChange={e=>setSupplierId(e.target.value)}>
          <option value="">Все поставщики</option>
          {lookups.suppliers?.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="">Без сортировки</option>
          <option value="qty_asc">Количество: по возрастанию</option>
          <option value="qty_desc">Количество: по убыванию</option>
        </select>
      </> : <div style={{opacity:.7}}>Просмотр товаров</div>}
      <div style={{flex:1}} />
      {u && u.role==='admin'? <button onClick={()=>nav('/products/new')}>Добавить товар</button>: null}
      {u && (u.role==='manager' || u.role==='admin')? <Link to="/orders" style={{marginLeft:8}}>Заказы</Link>: null}
    </div>

    <div>
      {list.map(p=>{
        const style = {}
        if (Number(p.discount) > 15) style.background = '#2E8B57'
        if (Number(p.stock_quantity) === 0) style.background = '#cfefff'
        return <div key={p.id} style={{display:'grid', gridTemplateColumns:'120px 1fr 1fr 1fr 120px 100px', gap:8, padding:8, border:'1px solid #ddd', borderRadius:8, marginBottom:8, ...style}}>
          <div>
            <img src={p.image_path? (api + p.image_path) : '/picture.png'} alt="" style={{width:120, height:80, objectFit:'cover'}}/>
          </div>
          <div>
            <div style={{fontWeight:'bold'}}>{p.name}</div>
            <div style={{fontSize:12, opacity:.8}}>{p.description}</div>
          </div>
          <div>
            <div>Категория: {p.category||'-'}</div>
            <div>Производитель: {p.manufacturer||'-'}</div>
            <div>Поставщик: {p.supplier||'-'}</div>
          </div>
          <div>
            <div>Ед. изм.: {p.unit}</div>
            <div>Кол-во: {p.stock_quantity}</div>
            <div>Скидка: {p.discount||0}%</div>
          </div>
          <div>{priceRow(p)}</div>
          <div style={{display:'flex', gap:6}}>
            {u && u.role==='admin'? <button onClick={()=>nav('/products/'+p.id)}>Изм.</button> : null}
            {u && u.role==='admin'? <button onClick={async()=>{
              if(!confirm('Удалить товар?')) return
              const r = await fetch(api+'/api/products/'+p.id, { method:'DELETE', headers:{Authorization:'Bearer '+token()} })
              const data = await r.json().catch(()=>({}))
              if(!r.ok){ alert(data.message||'Ошибка удаления'); return }
              load()
            }}>Удал.</button> : null}
          </div>
        </div>
      })}
    </div>
  </div>)
}
