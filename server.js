const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'cyber-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Auth Kontrolü
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) return next();
    res.redirect('/');
};

const isAdmin = (req, res, next) => {
    if (req.session.role === 'admin') return next();
    res.status(403).send('Yetkisiz erişim.');
};

// API Rotaları
app.post('/api/register', async (req, res) => {
    const { username, email, fullName, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const role = username === 'metin.0913' ? 'admin' : 'user';
        db.run("INSERT INTO users (username, email, fullName, password, role) VALUES (?, ?, ?, ?, ?)", 
            [username, email, fullName, hashedPassword, role], (err) => {
            if (err) return res.status(400).json({ error: 'Kullanıcı adı veya e-posta zaten kullanımda.' });
            res.json({ message: 'Kayıt başarılı.' });
        });
    } catch (e) {
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

app.post('/api/login', (req, res) => {
    const { loginIdent, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? OR email = ?", [loginIdent, loginIdent], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Kullanıcı bulunamadı.' });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: 'Hatalı şifre.' });
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        res.json({ role: user.role });
    });
});

app.get('/api/me', isAuthenticated, (req, res) => {
    db.get("SELECT id, username, email, fullName, balance, role FROM users WHERE id = ?", [req.session.userId], (err, user) => {
        res.json(user);
    });
});

app.get('/api/users', isAuthenticated, isAdmin, (req, res) => {
    db.all("SELECT id, username, email, fullName, balance, role FROM users", (err, users) => {
        res.json(users);
    });
});

app.post('/api/admin/update-balance', isAuthenticated, isAdmin, (req, res) => {
    const { userId, amount } = req.body;
    db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, userId], (err) => {
        if (err) return res.status(500).json({ error: 'Güncelleme hatası.' });
        res.json({ message: 'Bakiye güncellendi.' });
    });
});

app.post('/api/admin/delete-user', isAuthenticated, isAdmin, (req, res) => {
    const { userId } = req.body;
    if (userId == req.session.userId) return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz.' });
    db.run("DELETE FROM users WHERE id = ?", [userId], (err) => {
        if (err) return res.status(500).json({ error: 'Silme hatası.' });
        res.json({ message: 'Kullanıcı silindi.' });
    });
});

// --- Hizmetler API ---
app.get('/api/services', (req, res) => {
    db.all("SELECT * FROM services", (err, rows) => {
        if (err) return res.status(500).json({ error: 'Veri çekme hatası.' });
        res.json(rows);
    });
});

app.post('/api/admin/services', isAuthenticated, isAdmin, (req, res) => {
    const { category, name, price, min_order, max_order } = req.body;
    db.run("INSERT INTO services (category, name, price, min_order, max_order) VALUES (?, ?, ?, ?, ?)",
        [category, name, price, min_order, max_order], (err) => {
            if (err) return res.status(500).json({ error: 'Ekleme hatası.' });
            res.json({ message: 'Hizmet eklendi.' });
        });
});

app.post('/api/admin/services/delete', isAuthenticated, isAdmin, (req, res) => {
    const { id } = req.body;
    db.run("DELETE FROM services WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: 'Silme hatası.' });
        res.json({ message: 'Hizmet silindi.' });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

app.get('/admin', isAuthenticated, isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin.html'));
});

app.post('/api/purchase', isAuthenticated, (req, res) => {
    const { price, service, amount } = req.body;
    const userId = req.session.userId;

    db.get("SELECT balance FROM users WHERE id = ?", [userId], (err, user) => {
        if (err || !user) return res.status(500).json({ error: 'Kullanıcı bulunamadı.' });
        
        if (user.balance < price) {
            return res.status(400).json({ error: 'Yetersiz bakiye!' });
        }

        db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [price, userId], (err) => {
            if (err) return res.status(500).json({ error: 'İşlem hatası.' });
            res.json({ message: 'Sipariş onaylandı, bakiye düşüldü.' });
        });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
});
