const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./database');
const https = require('https');
const querystring = require('querystring');
require('dotenv').config();

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

// --- API AYARLARI ---
const SMM_API_URL = 'https://smmpanelali.xyz/api/v2';
const SMM_API_KEY = '2a99dbf9859fdc459342444986c8abb0';

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

// --- SOCKET.IO LOGIC ---
io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı:', socket.id);

    // Son 50 mesajı gönder
    db.all("SELECT * FROM chat_messages ORDER BY createdAt DESC LIMIT 50", (err, rows) => {
        if (rows) socket.emit('chat-history', rows.reverse());
    });

    socket.on('send-message', (data) => {
        if (!data.username || !data.message) return;
        db.run("INSERT INTO chat_messages (userId, username, message) VALUES (?, ?, ?)",
            [data.userId || 0, data.username, data.message], function (err) {
                if (!err) {
                    const msg = { id: this.lastID, username: data.username, message: data.message, createdAt: new Date() };
                    io.emit('new-message', msg);
                }
            });
    });

    socket.on('disconnect', () => {
        console.log('Kullanıcı ayrıldı:', socket.id);
    });
});

// Helper to notify a specific user (via their ID or broadcasting if simpler)
function notifyUser(userId, message, type = 'info') {
    io.emit('notification', { userId, message, type });
}

// Auth Middlewares
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) return next();
    res.redirect('/');
};

const isAdmin = (req, res, next) => {
    if (req.session.role === 'admin') return next();
    res.status(403).json({ error: 'Yetkisiz erişim.' });
};

// --- DIŞ API FONKSİYONU ---
function callSmmApi(data) {
    return new Promise((resolve, reject) => {
        const postData = querystring.stringify({
            key: SMM_API_KEY,
            ...data
        });
        const options = {
            hostname: 'smmpanelali.xyz',
            path: '/api/v2',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length
            },
            rejectUnauthorized: false // SSL hatalarını görmezden gel (PHP'deki gibi)
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve(parsed);
                } catch (e) {
                    console.error("API Yanıt Hatası:", body);
                    resolve({ error: 'Geçersiz API yanıtı.' });
                }
            });
        });
        req.on('error', (e) => {
            console.error("API Bağlantı Hatası:", e);
            reject(e);
        });
        req.write(postData);
        req.end();
    });
}

// --- AUTH API ---
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
    } catch (e) { res.status(500).json({ error: 'Sunucu hatası.' }); }
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

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/api/me', isAuthenticated, (req, res) => {
    db.get("SELECT id, username, email, fullName, balance, role FROM users WHERE id = ?", [req.session.userId], (err, user) => {
        res.json(user);
    });
});

// --- PANEL ROUTES ---
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

app.get('/admin', isAuthenticated, isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin.html'));
});

// --- SERVICES & STATS ---
app.get('/api/services', (req, res) => {
    db.all("SELECT * FROM services", (err, rows) => {
        res.json(rows || []);
    });
});

app.get('/api/stats', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    db.get(`
        SELECT 
            (SELECT COUNT(*) FROM orders WHERE userId = ?) as totalOrders,
            (SELECT SUM(price) FROM orders WHERE userId = ? AND status = 'Tamamlandı') as totalSpent,
            (SELECT balance FROM users WHERE id = ?) as currentBalance
    `, [userId, userId, userId], (err, stats) => {
        res.json({
            totalOrders: stats.totalOrders || 0,
            totalSpent: stats.totalSpent || 0,
            currentBalance: stats.currentBalance || 0
        });
    });
});

app.get('/api/transactions', isAuthenticated, (req, res) => {
    db.all("SELECT * FROM balance_logs WHERE userId = ? ORDER BY createdAt DESC", [req.session.userId], (err, rows) => {
        res.json(rows || []);
    });
});

// --- SİPARİŞ VERME (BAKİYE ANINDA DÜŞER - İPTALDE İADE EDİLİR) ---
app.post('/api/purchase', isAuthenticated, async (req, res) => {
    const { price, service, amount, link, serviceId } = req.body;
    const userId = req.session.userId;

    if (!link) return res.status(400).json({ error: 'Lütfen hesap adı veya link girin.' });

    db.get("SELECT balance FROM users WHERE id = ?", [userId], (err, user) => {
        if (err || !user) return res.status(500).json({ error: 'Kullanıcı bulunamadı.' });
        if (user.balance < price) return res.status(400).json({ error: 'Yetersiz bakiye!' });

        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            // Bakiyeyi anında düş
            db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [price, userId]);
            // Siparişi beklemede olarak kaydet
            db.run("INSERT INTO orders (userId, serviceId, serviceName, amount, price, link, status) VALUES (?, ?, ?, ?, ?, ?, 'Beklemede')",
                [userId, serviceId, service, amount, price, link]);
            // Log kaydı tut
            db.run("INSERT INTO balance_logs (userId, amount, type, description) VALUES (?, ?, 'spent', ?)",
                    [userId, price, `${amount} ${service} (Onay Bekliyor)`]);

            db.run("COMMIT", (err) => {
                if (err) return res.status(500).json({ error: 'İşlem hatası.' });
                notifyUser(userId, `${amount} ${service} siparişiniz alındı. Bakiyenizden ${price.toFixed(2)} TL düşüldü, onay bekleniyor.`, 'info');
                res.json({ message: 'Siparişiniz alındı, bakiye düşüldü. Admin onayı bekleniyor.' });
            });
        });
    });
});

app.get('/api/orders', isAuthenticated, (req, res) => {
    db.all("SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC", [req.session.userId], (err, rows) => {
        res.json(rows || []);
    });
});

// --- ADMIN API (ONAYLAMA VE İPTAL/İADE MANTIĞI) ---
app.get('/api/admin/orders', isAuthenticated, isAdmin, (req, res) => {
    db.all("SELECT orders.*, users.username FROM orders JOIN users ON orders.userId = users.id ORDER BY createdAt DESC", (err, rows) => {
        res.json(rows || []);
    });
});

app.post('/api/admin/orders/update-status', isAuthenticated, isAdmin, (req, res) => {
    const { orderId, status } = req.body;

    db.get(`
        SELECT o.*, s.api_service_id 
        FROM orders o 
        LEFT JOIN services s ON o.serviceId = s.id 
        WHERE o.id = ?
    `, [orderId], async (err, order) => {
        if (!order || order.status === 'Tamamlandı' || order.status === 'İptal Edildi') {
            return res.status(400).json({ error: 'Sipariş zaten sonuçlandırılmış.' });
        }

        if (status === 'Tamamlandı') {
            const realApiId = order.api_service_id || 1;
            try {
                const apiResult = await callSmmApi({
                    action: 'add',
                    service: realApiId,
                    link: order.link,
                    quantity: order.amount
                });

                if (apiResult.order || apiResult.status === 'success') {
                    db.run("UPDATE orders SET status = 'Tamamlandı', api_order_id = ? WHERE id = ?", [apiResult.order || 0, orderId], (err) => {
                        notifyUser(order.userId, `${order.amount} ${order.serviceName} siparişiniz ONAYLANDI!`, 'success');
                        res.json({ message: 'Onaylandı ve API\'ye iletildi!' });
                    });
                } else {
                    res.status(400).json({ error: 'API Hatası: ' + (apiResult.error || 'Bilinmeyen hata') });
                }
            } catch (e) {
                res.status(500).json({ error: 'API bağlantı hatası.' });
            }
        } else if (status === 'İptal Edildi') {
            // İPTAL DURUMUNDA PARAYI İADE ET
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");
                db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [order.price, order.userId]);
                db.run("UPDATE orders SET status = 'İptal Edildi' WHERE id = ?", [orderId]);
                db.run("INSERT INTO balance_logs (userId, amount, type, description) VALUES (?, ?, 'deposit', ?)",
                    [order.userId, order.price, `${order.serviceName} Sipariş İptali - İADE`]);
                db.run("COMMIT", (err) => {
                    notifyUser(order.userId, `${order.amount} ${order.serviceName} siparişiniz İPTAL EDİLDİ ve ${order.price.toFixed(2)} TL iade edildi.`, 'error');
                    res.json({ message: 'Sipariş iptal edildi ve bakiye iade edildi.' });
                });
            });
        } else {
            db.run("UPDATE orders SET status = ? WHERE id = ?", [status, orderId], (err) => {
                res.json({ message: 'Durum güncellendi.' });
            });
        }
    });
});

app.post('/api/admin/services/update-api-id', isAuthenticated, isAdmin, (req, res) => {
    const { id, apiId } = req.body;
    db.run("UPDATE services SET api_service_id = ? WHERE id = ?", [apiId, id], (err) => {
        if (err) return res.status(500).json({ error: 'Güncellenemedi.' });
        res.json({ message: 'Güncellendi.' });
    });
});

app.get('/api/admin/orders/:id/status-check', isAuthenticated, isAdmin, async (req, res) => {
    db.get("SELECT api_order_id FROM orders WHERE id = ?", [req.params.id], async (err, row) => {
        if (!row || !row.api_order_id) return res.status(404).json({ error: 'API ID yok.' });
        try {
            const result = await callSmmApi({ action: 'status', order: row.api_order_id });
            res.json(result);
        } catch (e) { res.status(500).json({ error: 'Hata.' }); }
    });
});

app.get('/api/admin/global-stats', isAuthenticated, isAdmin, (req, res) => {
    db.get(`SELECT COUNT(*) as totalUsers, (SELECT COUNT(*) FROM orders) as totalOrders, (SELECT SUM(price) FROM orders WHERE status = 'Tamamlandı') as totalRevenue, (SELECT SUM(balance) FROM users) as totalBalances FROM users`, (err, stats) => {
        res.json(stats);
    });
});

app.get('/api/admin/stats/categories', isAuthenticated, isAdmin, (req, res) => {
    db.all("SELECT category, COUNT(*) as count FROM orders JOIN services ON orders.serviceName LIKE '%' || services.name || '%' GROUP BY category", (err, rows) => {
        res.json(rows || []);
    });
});

app.get('/api/settings/announcement', (req, res) => {
    db.get("SELECT value FROM settings WHERE key = 'announcement'", (err, row) => {
        res.json({ announcement: row ? row.value : '' });
    });
});

app.post('/api/admin/settings/announcement', isAuthenticated, isAdmin, (req, res) => {
    db.run("UPDATE settings SET value = ? WHERE key = 'announcement'", [req.body.value], () => res.json({ message: 'Güncellendi' }));
});

app.get('/api/users', isAuthenticated, isAdmin, (req, res) => {
    db.all("SELECT * FROM users", (err, rows) => res.json(rows));
});

app.post('/api/admin/update-balance', isAuthenticated, isAdmin, (req, res) => {
    db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [req.body.amount, req.body.userId], () => res.json({ message: 'Bakiye eklendi' }));
});

app.post('/api/admin/delete-user', isAuthenticated, isAdmin, (req, res) => {
    db.run("DELETE FROM users WHERE id = ?", [req.body.userId], () => res.json({ message: 'Silindi' }));
});

app.get('/api/admin/balance-logs', isAuthenticated, isAdmin, (req, res) => {
    db.all("SELECT balance_logs.*, users.username FROM balance_logs JOIN users ON balance_logs.userId = users.id ORDER BY createdAt DESC LIMIT 100", (err, rows) => {
        res.json(rows || []);
    });
});

// --- Kupon Sistemi ---
app.post('/api/coupons/redeem', isAuthenticated, (req, res) => {
    const { code } = req.body;
    db.get("SELECT * FROM coupons WHERE code = ? AND status = 'active' AND usedCount < usageLimit", [code], (err, coupon) => {
        if (err || !coupon) return res.status(400).json({ error: 'Geçersiz kupon.' });
        db.serialize(() => {
            db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [coupon.amount, req.session.userId]);
            db.run("UPDATE coupons SET usedCount = usedCount + 1 WHERE id = ?", [coupon.id]);
            db.run("INSERT INTO balance_logs (userId, amount, type, description) VALUES (?, ?, 'deposit', ?)",
                [req.session.userId, coupon.amount, `Kupon: ${code}`]);
            res.json({ message: `Tebrikler! ${coupon.amount} TL eklendi.` });
        });
    });
});

app.post('/api/admin/coupons', isAuthenticated, isAdmin, (req, res) => {
    const { code, amount, limit } = req.body;
    db.run("INSERT INTO coupons (code, amount, usageLimit) VALUES (?, ?, ?)", [code, amount, limit], () => res.json({ message: 'Kupon oluşturuldu' }));
});

// --- Destek Sistemi ---
app.post('/api/tickets', isAuthenticated, (req, res) => {
    const { subject, message } = req.body;
    db.run("INSERT INTO tickets (userId, subject) VALUES (?, ?)", [req.session.userId, subject], function (err) {
        const ticketId = this.lastID;
        db.run("INSERT INTO ticket_messages (ticketId, userId, message) VALUES (?, ?, ?)", [ticketId, req.session.userId, message], () => {
            res.json({ message: 'Talep iletildi.' });
        });
    });
});

app.get('/api/tickets', isAuthenticated, (req, res) => {
    db.all("SELECT * FROM tickets WHERE userId = ? ORDER BY createdAt DESC", [req.session.userId], (err, rows) => res.json(rows || []));
});

app.get('/api/tickets/:id', isAuthenticated, (req, res) => {
    db.all("SELECT * FROM ticket_messages WHERE ticketId = ? ORDER BY createdAt ASC", [req.params.id], (err, rows) => res.json(rows || []));
});

app.post('/api/tickets/:id/reply', isAuthenticated, (req, res) => {
    const isAdminUser = req.session.role === 'admin' ? 1 : 0;
    db.run("INSERT INTO ticket_messages (ticketId, userId, message, isAdmin) VALUES (?, ?, ?, ?)",
        [req.params.id, req.session.userId, req.body.message, isAdminUser], () => {
            if (isAdminUser) db.run("UPDATE tickets SET status = 'Cevaplandı' WHERE id = ?", [req.params.id]);
            else db.run("UPDATE tickets SET status = 'Müşteri Yanıtı' WHERE id = ?", [req.params.id]);
            res.json({ message: 'Mesaj iletildi.' });
        });
});

app.get('/api/admin/tickets', isAuthenticated, isAdmin, (req, res) => {
    db.all("SELECT tickets.*, users.username FROM tickets JOIN users ON tickets.userId = users.id ORDER BY createdAt DESC", (err, rows) => res.json(rows || []));
});

http.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
});
