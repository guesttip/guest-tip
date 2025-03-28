const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const db = new sqlite3.Database('guesttip.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS waiters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    link TEXT NOT NULL,
    date TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS menu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    price REAL,
    payment_method TEXT
  )`);
});

// --- Order Routes ---

app.post('/orders', (req, res) => {
  const { item } = req.body;
  if (!item) return res.status(400).json({ error: 'Missing item' });
  db.run('INSERT INTO orders (item) VALUES (?)', [item], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Order saved', id: this.lastID });
  });
});

app.get('/orders', (req, res) => {
  db.all('SELECT * FROM orders WHERE timestamp >= datetime("now", "-2 hours")', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/orders/:id', (req, res) => {
  const { price, payment_method } = req.body;
  db.run('UPDATE orders SET price = ?, payment_method = ? WHERE id = ?', [price, payment_method, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Order updated' });
  });
});

// --- Waiters & Menu routes remain (omitted here to shorten) ---

app.listen(port, () => {
  console.log(`GuestTip Server running at http://localhost:${port}`);
});
