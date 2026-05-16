const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

// ÖRNEK EŞLEŞTİRME (Kendi API panelindeki ID'lere göre bunları düzenleyebilirsin)
const mappings = [
    { name: 'Takipçi (Garantili)', apiId: 100 }, 
    { name: 'Takipçi (Global)', apiId: 101 },
    { name: 'Video İzlenme', apiId: 200 },
    { name: 'Beğeni (Türk)', apiId: 300 },
    { name: 'Kanal Üyesi', apiId: 400 }
];

db.serialize(() => {
    mappings.forEach(m => {
        db.run("UPDATE services SET api_service_id = ? WHERE name LIKE ?", [m.apiId, `%${m.name}%`], (err) => {
            if (!err) console.log(`${m.name} için API ID ${m.apiId} olarak güncellendi.`);
        });
    });
});

console.log("Servisler API ile eşleştiriliyor...");
setTimeout(() => db.close(), 2000);
