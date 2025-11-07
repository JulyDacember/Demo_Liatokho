
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import Products from './products.jsx'
import ProductForm from './product_form.jsx'
import Orders from './orders.jsx'
import OrderForm from './order_form.jsx'

const api = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function useAuth(){
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user')||'null')
  return { token, user }
}
function setAuth(token, user){
  if(token){ localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)) }
  else { localStorage.removeItem('token'); localStorage.removeItem('user') }
}

function Nav(){
  const { user } = useAuth()
  const nav = useNavigate()
  return (<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:8,borderBottom:'1px solid #ddd'}}>
    <div><Link to="/">Super Shoes</Link></div>
    <div>
      {user? <span style={{marginRight:12}}>{user.full_name} ({user.role})</span>: null}
      {user? <button onClick={()=>{ setAuth(null,null); nav('/'); }}>Выход</button>: null}
    </div>
  </div>)
}

function Login(){
  const [login,setLogin]=React.useState('admin')
  const [password,setPassword]=React.useState('admin123')
  const nav=useNavigate()
  async function onSubmit(e){
    e.preventDefault()
    try{
      const r = await fetch(api+'/api/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({login,password})})
      if(!r.ok) throw new Error('Ошибка входа')
      const data = await r.json()
      setAuth(data.token, data.user)
      nav('/products')
    }catch(e){ alert(e.message) }
  }
  return (<div style={{maxWidth:420, margin:'64px auto'}}>
    <h2>Вход</h2>
    <form onSubmit={onSubmit}>
      <div><input placeholder="Логин" value={login} onChange={e=>setLogin(e.target.value)} /></div>
      <div><input placeholder="Пароль" type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
      <div style={{display:'flex', gap:8, marginTop:8}}>
        <button type="submit">Войти</button>
        <Link to="/products">Продолжить как гость</Link>
      </div>
    </form>
  </div>)
}

function RequireRole({ roles, children }){
  const { user } = useAuth()
  if (!user || (roles && !roles.includes(user.role))) return <div style={{padding:16}}>Нет доступа</div>
  return children
}

function App(){
  return (
    <BrowserRouter>
      <Nav/>
      <Routes>
        <Route path="/" element={<Login/>}/>
        <Route path="/products" element={<Products/>}/>
        <Route path="/products/new" element={<RequireRole roles={['admin']}><ProductForm/></RequireRole>}/>
        <Route path="/products/:id" element={<RequireRole roles={['admin']}><ProductForm/></RequireRole>}/>
        <Route path="/orders" element={<RequireRole roles={['manager','admin']}><Orders/></RequireRole>}/>
        <Route path="/orders/new" element={<RequireRole roles={['admin']}><OrderForm/></RequireRole>}/>
        <Route path="/orders/:id" element={<RequireRole roles={['admin']}><OrderForm/></RequireRole>}/>
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App/>)
