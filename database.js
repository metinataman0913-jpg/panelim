const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Veritabanı bağlantı hatası:', err.message);
    } else {
        console.log('SQLite veritabanına bağlanıldı.');
    }
});

// Tabloları oluştur
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            fullName TEXT NOT NULL,
            password TEXT NOT NULL,
            balance REAL DEFAULT 0,
            role TEXT DEFAULT 'user'
        )
    `, async (err) => {
        if (err) {
            console.error('Tablo oluşturma hatası:', err.message);
        } else {
            // Admin kullanıcısını otomatik oluştur
            const adminUser = 'metin.0913';
            const adminPass = 'metin.0913';
            const adminEmail = 'admin@cyber.com';
            const adminName = 'Metin Admin';
            
            db.get("SELECT * FROM users WHERE username = ? OR email = ?", [adminUser, adminEmail], async (err, row) => {
                if (!row) {
                    const hashed = await bcrypt.hash(adminPass, 10);
                    db.run("INSERT INTO users (username, email, fullName, password, role) VALUES (?, ?, ?, ?, ?)",
                        [adminUser, adminEmail, adminName, hashed, 'admin'], (err) => {
                            if (err) console.error('Admin oluşturma hatası:', err.message);
                            else console.log('Admin hesabı oluşturuldu: metin.0913');
                        });
                }
            });
        }
    });

    // Hizmetler Tablosu
    db.run(`
        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            api_service_id INTEGER DEFAULT 0,
            min_order INTEGER DEFAULT 100,
            max_order INTEGER DEFAULT 10000
        )
    `, (err) => {
        if (err) console.error('Hizmetler tablosu hatası:', err.message);
        else {
            db.get("SELECT COUNT(*) as count FROM services", (err, row) => {
                if (row && row.count === 0) {
                    const stmt = db.prepare("INSERT INTO services (category, name, price, min_order, max_order) VALUES (?, ?, ?, ?, ?)");
                    stmt.run('Instagram', 'Takipçi (Garantili)', 90.00, 100, 50000);
                    stmt.run('Instagram', 'Beğeni (Global)', 40.00, 50, 100000);
                    stmt.run('Instagram', 'Video İzlenme', 20.00, 100, 100000);
                    stmt.run('Tiktok', 'Takipçi (Premium)', 110.00, 100, 50000);
                    stmt.run('Tiktok', 'Beğeni (Keşfet)', 45.00, 50, 100000);
                    stmt.run('Tiktok', 'İzlenme (Anlık)', 25.00, 100, 1000000);
                    stmt.run('Youtube', 'Abone (Global)', 300.00, 100, 10000);
                    stmt.run('Youtube', 'İzlenme (Organik)', 150.00, 100, 50000);
                    stmt.run('Telegram', 'Kanal Üyesi', 60.00, 100, 20000);
                    stmt.run('Telegram', 'Post Görüntülenme', 15.00, 100, 100000);
                    stmt.finalize();
                }
            });
        }
    });

    // Siparişler Tablosu
    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            serviceId INTEGER,
            serviceName TEXT NOT NULL,
            amount INTEGER NOT NULL,
            price REAL NOT NULL,
            link TEXT,
            status TEXT DEFAULT 'Beklemede',
            api_order_id INTEGER DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(userId) REFERENCES users(id)
        )
    `);

    // Bakiye Logları Tablosu
    db.run(`
        CREATE TABLE IF NOT EXISTS balance_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            amount REAL NOT NULL,
            type TEXT NOT NULL,
            description TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(userId) REFERENCES users(id)
        )
    `);

    // Ayarlar Tablosu
    db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `, (err) => {
        if (!err) {
            db.get("SELECT * FROM settings WHERE key = 'announcement'", (err, row) => {
                if (!row) {
                    db.run("INSERT INTO settings (key, value) VALUES ('announcement', '🚀 TÜM SERVİSLER AKTİF! TIKTOK, INSTAGRAM VE YOUTUBE PAKETLERİNDE %50 İNDİRİM BAŞLADI 🚀')");
                }
            });
        }
    });

    // Kuponlar Tablosu
    db.run(`
        CREATE TABLE IF NOT EXISTS coupons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            amount REAL NOT NULL,
            usageLimit INTEGER DEFAULT 1,
            usedCount INTEGER DEFAULT 0,
            status TEXT DEFAULT 'active'
        )
    `);

    // Destek Talepleri (Tickets)
    db.run(`
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            subject TEXT NOT NULL,
            status TEXT DEFAULT 'Açık',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(userId) REFERENCES users(id)
        )
    `);

    // Destek Mesajları
    db.run(`
        CREATE TABLE IF NOT EXISTS ticket_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticketId INTEGER NOT NULL,
            userId INTEGER NOT NULL,
            message TEXT NOT NULL,
            isAdmin INTEGER DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(ticketId) REFERENCES tickets(id)
        )
    `);

    // Global Sohbet Mesajları
    db.run(`
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            username TEXT NOT NULL,
            message TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(userId) REFERENCES users(id)
        )
    `);
});

module.exports = db;
