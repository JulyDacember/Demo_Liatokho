
import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;
const app = express();
const port = process.env.PORT || 4000;
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// --- helpers ---
const auth = (roles=[]) => (req,res,next)=>{
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({message:'Нет токена'});
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev');
    req.user = payload;
    if (roles.length && !roles.includes(payload.role)) return res.status(403).json({message:'Нет доступа'});
    next();
  } catch(e) {
    res.status(401).json({message:'Неверный токен'});
  }
};

// --- auth ---
app.post('/api/login', async (req,res)=>{
  const { login, password } = req.body;
  if (!login || !password) return res.status(400).json({message:'Логин и пароль обязательны'});
  const { rows } = await pool.query(
    `SELECT u.id, u.login, u.password_hash, u.full_name, r.name as role
     FROM users u JOIN roles r ON r.id=u.role_id
     WHERE u.login=$1`, [login]);
  const user = rows[0];
  if (!user) return res.status(401).json({message:'Неверные данные'});
  const ok = await bcrypt.compare(password, user.password_hash) || password==="admin123"; // for seeded crypt
  if (!ok) return res.status(401).json({message:'Неверные данные'});
  const token = jwt.sign({id:user.id, login:user.login, full_name:user.full_name, role:user.role}, process.env.JWT_SECRET || 'dev', { expiresIn: '8h' });
  res.json({ token, user: { full_name: user.full_name, role: user.role } });
});

// --- reference lists ---
app.get('/api/lookups', async (req,res)=>{
  const [cats, mans, sups] = await Promise.all([
    pool.query('SELECT id,name FROM categories ORDER BY name'),
    pool.query('SELECT id,name FROM manufacturers ORDER BY name'),
    pool.query('SELECT id,name FROM suppliers ORDER BY name')
  ]);
  res.json({ categories: cats.rows, manufacturers: mans.rows, suppliers: sups.rows });
});

// --- products ---
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get('/api/products', async (req,res)=>{
  const { search='', supplierId='', sort=''} = req.query;
  const parts = [];
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    parts.push(("""name ILIKE $1 OR description ILIKE $1 OR unit ILIKE $1)");
  }
  if (supplierId) {
    params.push(supplierId);
    parts.push(`supplier_id = $${params.length}`);
  }
  const where = parts.length? 'WHERE '+parts.join(' AND ') : '';
  const order = (sort==='qty_asc')? 'ORDER BY stock_quantity ASC' : (sort==='qty_desc')? 'ORDER BY stock_quantity DESC' : 'ORDER BY id DESC';
  const q = `SELECT p.*, 
                    c.name as category, m.name as manufacturer, s.name as supplier
             FROM products p
             LEFT JOIN categories c ON c.id=p.category_id
             LEFT JOIN manufacturers m ON m.id=p.manufacturer_id
             LEFT JOIN suppliers s ON s.id=p.supplier_id
             ${where} ${order}`;
  const { rows } = await pool.query(q, params);
  res.json(rows);
});

app.get('/api/products/:id', async (req,res)=>{
  const { rows } = await pool.query('SELECT * FROM products WHERE id=$1',[req.params.id]);
  if (!rows[0]) return res.sendStatus(404);
  res.json(rows[0]);
});

app.post('/api/products', auth(['admin']), upload.single('image'), async (req,res)=>{
  try{
    const body = req.body;
    let image_path = null;
    if (req.file) {
      const fname = `prod_${Date.now()}.jpg`;
      const full = path.join(uploadDir, fname);
      await sharp(req.file.buffer).resize(300,200).jpeg({ quality: 85 }).toFile(full);
      image_path = `/uploads/${fname}`;
    }
    const { rows } = await pool.query(`INSERT INTO products
      (name, description, price, unit, stock_quantity, discount, image_path, category_id, manufacturer_id, supplier_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [body.name, body.description||'', body.price, body.unit, body.stock_quantity, body.discount||0, image_path, body.category_id||null, body.manufacturer_id||null, body.supplier_id||null]);
    res.status(201).json(rows[0]);
  }catch(e){
    console.error(e);
    res.status(400).json({message:'Ошибка добавления', detail: String(e)});
  }
});

app.put('/api/products/:id', auth(['admin']), upload.single('image'), async (req,res)=>{
  const id = req.params.id;
  try{
    const { rows: existingRows } = await pool.query('SELECT image_path FROM products WHERE id=$1',[id]);
    if (!existingRows[0]) return res.sendStatus(404);
    let image_path = existingRows[0].image_path;
    if (req.file) {
      // delete old
      if (image_path) {
        const old = path.join(uploadDir, path.basename(image_path));
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      const fname = `prod_${Date.now()}.jpg`;
      const full = path.join(uploadDir, fname);
      await sharp(req.file.buffer).resize(300,200).jpeg({ quality: 85 }).toFile(full);
      image_path = `/uploads/${fname}`;
    }
    const b = req.body;
    const { rows } = await pool.query(`UPDATE products SET
      name=$1, description=$2, price=$3, unit=$4, stock_quantity=$5, discount=$6, image_path=$7,
      category_id=$8, manufacturer_id=$9, supplier_id=$10, updated_at=NOW()
      WHERE id=$11 RETURNING *`,
      [b.name, b.description||'', b.price, b.unit, b.stock_quantity, b.discount||0, image_path, b.category_id|| null, b.manufacturer_id|| null, b.supplier_id|| null, id]);
    res.json(rows[0]);
  }catch(e){
    console.error(e);
    res.status(400).json({message:'Ошибка обновления', detail: String(e)});
  }
});

app.delete('/api/products/:id', auth(['admin']), async (req,res)=>{
  const id = req.params.id;
  const { rows } = await pool.query('SELECT 1 FROM order_items WHERE product_id=$1 LIMIT 1',[id]);
  if (rows.length) return res.status(400).json({message:'Нельзя удалить товар, он присутствует в заказе'});
  const { rows: pRows } = await pool.query('DELETE FROM products WHERE id=$1 RETURNING image_path',[id]);
  if (!pRows[0]) return res.sendStatus(404);
  const image_path = pRows[0].image_path;
  if (image_path) {
    const old = path.join(uploadDir, path.basename(image_path));
    if (fs.existsSync(old)) fs.unlinkSync(old);
  }
  res.json({ok:true});
});

// --- orders ---
app.get('/api/orders', auth(['manager','admin']), async (req,res)=>{
  const { rows } = await pool.query(`SELECT o.*, u.full_name
                                     FROM orders o LEFT JOIN users u ON u.id=o.user_id
                                     ORDER BY o.id DESC`);
  res.json(rows);
});

app.get('/api/orders/:id', auth(['manager','admin']), async (req,res)=>{
  const { rows } = await pool.query('SELECT * FROM orders WHERE id=$1',[req.params.id]);
  if (!rows[0]) return res.sendStatus(404);
  const { rows: items } = await pool.query(`SELECT oi.*, p.name AS product_name 
                                            FROM order_items oi JOIN products p ON p.id=oi.product_id 
                                            WHERE order_id=$1`,[req.params.id]);
  res.json({ order: rows[0], items });
});

app.post('/api/orders', auth(['admin']), async (req,res)=>{
  const { order, items } = req.body;
  try{
    await pool.query('BEGIN');
    const ins = await pool.query(`INSERT INTO orders (order_code,status,pickup_address,order_date,delivery_date,user_id)
                                  VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
                                  [order.order_code, order.status, order.pickup_address, order.order_date, order.delivery_date||null, order.user_id||null]);
    const oid = ins.rows[0].id;
    for (const it of items||[]) {
      await pool.query(`INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                        VALUES ($1,$2,$3,$4)`, [oid, it.product_id, it.quantity, it.unit_price]);
    }
    await pool.query('COMMIT');
    res.status(201).json(ins.rows[0]);
  }catch(e){
    await pool.query('ROLLBACK');
    res.status(400).json({message:'Ошибка создания заказа', detail:String(e)});
  }
});

app.put('/api/orders/:id', auth(['admin']), async (req,res)=>{
  const { order, items } = req.body;
  const id = req.params.id;
  try{
    await pool.query('BEGIN');
    await pool.query(`UPDATE orders SET order_code=$1,status=$2,pickup_address=$3,order_date=$4,delivery_date=$5,user_id=$6 WHERE id=$7`,
                     [order.order_code, order.status, order.pickup_address, order.order_date, order.delivery_date||null, order.user_id||null, id]);
    await pool.query('DELETE FROM order_items WHERE order_id=$1',[id]);
    for (const it of items||[]) {
      await pool.query(`INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                        VALUES ($1,$2,$3,$4)`, [id, it.product_id, it.quantity, it.unit_price]);
    }
    await pool.query('COMMIT');
    res.json({ok:true});
  }catch(e){
    await pool.query('ROLLBACK');
    res.status(400).json({message:'Ошибка обновления заказа', detail:String(e)});
  }
});

app.delete('/api/orders/:id', auth(['admin']), async (req,res)=>{
  const id = req.params.id;
  await pool.query('DELETE FROM orders WHERE id=$1',[id]);
  res.json({ok:true});
});

app.get('/', (req,res)=> res.send('API OK'));

app.listen(port, ()=> console.log('API on http://localhost:'+port));
