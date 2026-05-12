const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('nexuschat.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_user TEXT NOT NULL,
        to_user TEXT NOT NULL,
        text TEXT NOT NULL,
        time TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run("INSERT OR IGNORE INTO users (username, password) VALUES ('admin', 'admin123')");
});

// Регистрация
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], function(err) {
        if (err) return res.status(400).json({ error: 'Пользователь уже существует' });
        res.json({ success: true });
    });
});

// Вход
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT username, created_at FROM users WHERE username = ? AND password = ?', [username, password], (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Неверный логин или пароль' });
        res.json({ success: true, user });
    });
});

// Список пользователей
app.get('/api/users', (req, res) => {
    db.all('SELECT username, created_at FROM users', [], (err, users) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(users);
    });
});

// Получить сообщения
app.get('/api/messages', (req, res) => {
    const { user1, user2 } = req.query;
    db.all('SELECT * FROM messages WHERE (from_user = ? AND to_user = ?) OR (from_user = ? AND to_user = ?) ORDER BY created_at ASC',
        [user1, user2, user2, user1], (err, messages) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(messages);
    });
});

// Отправить сообщение
app.post('/api/messages', (req, res) => {
    const { from_user, to_user, text, time } = req.body;
    db.run('INSERT INTO messages (from_user, to_user, text, time) VALUES (?, ?, ?, ?)',
        [from_user, to_user, text, time], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

// Админ: все сообщения
app.get('/api/admin/messages', (req, res) => {
    db.all('SELECT * FROM messages ORDER BY created_at DESC', [], (err, messages) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(messages);
    });
});

// Админ: чаты пользователя
app.get('/api/admin/user-chats/:username', (req, res) => {
    const { username } = req.params;
    db.all('SELECT * FROM messages WHERE from_user = ? OR to_user = ? ORDER BY created_at ASC',
        [username, username], (err, messages) => {
        if (err) return res.status(500).json({ error: err.message });
        const chats = {};
        messages.forEach(msg => {
            const partner = msg.from_user === username ? msg.to_user : msg.from_user;
            if (!chats[partner]) chats[partner] = [];
            chats[partner].push(msg);
        });
        res.json({ chats });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
    console.log(`👑 Админ: http://localhost:${PORT}/admin.html`);
});
