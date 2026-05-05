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
            min_order INTEGER DEFAULT 100,
            max_order INTEGER DEFAULT 10000
        )
    `, (err) => {
        if (err) console.error('Hizmetler tablosu hatası:', err.message);
        else {
            db.get("SELECT COUNT(*) as count FROM services", (err, row) => {
                if (row && row.count === 0) {
                    const stmt = db.prepare("INSERT INTO services (category, name, price, min_order, max_order) VALUES (?, ?, ?, ?, ?)");
                    stmt.run('Instagram', 'Instagram Takipçi [Gerçek]', 15.50, 100, 50000);
                    stmt.run('Instagram', 'Instagram Beğeni [Hızlı]', 4.20, 50, 100000);
                    stmt.run('Tiktok', 'Tiktok İzlenme [Global]', 0.50, 1000, 1000000);
                    stmt.run('Twitter', 'Twitter Retweet', 25.00, 10, 5000);
                    stmt.finalize();
                }
            });
        }
    });
});

module.exports = db;
