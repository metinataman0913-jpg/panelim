const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

const API_URL = 'https://smmpanelali.xyz/api/v2';
const API_KEY = '2a99dbf9859fdc459342444986c8abb0';

async function syncServices() {
    try {
        console.log("Dış API'den servisler çekiliyor...");
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: API_KEY, action: 'services' })
        });
        
        const services = await response.json();
        
        if (!Array.isArray(services)) {
            console.error("Servisler alınamadı. API Yanıtı:", services);
            return;
        }

        console.log(`Toplam ${services.length} adet servis bulundu. Veritabanına yükleniyor...`);

        db.serialize(() => {
            // Önce eski servisleri siliyoruz ki kafa karışmasın
            db.run("DELETE FROM services");

            const stmt = db.prepare("INSERT INTO services (category, name, price, min_order, max_order, api_service_id) VALUES (?, ?, ?, ?, ?, ?)");
            
            let count = 0;
            for (const s of services) {
                stmt.run(s.category, s.name, parseFloat(s.rate) || 0, parseInt(s.min) || 0, parseInt(s.max) || 0, parseInt(s.service) || 0);
                count++;
            }
            stmt.finalize();
            
            console.log(`✅ ${count} adet servis başarıyla panele yüklendi!`);
        });
    } catch (error) {
        console.error("Hata oluştu:", error);
    }
}

syncServices();
