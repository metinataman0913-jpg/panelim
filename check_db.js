const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log("Tablolar:", tables);
    
    tables.forEach(table => {
        db.all(`SELECT * FROM ${table.name}`, (err, rows) => {
            console.log(`\n--- ${table.name} İçeriği ---`);
            console.log(rows);
            if (table.name === tables[tables.length-1].name) {
                // Last table, wait a bit then close
                setTimeout(() => db.close(), 500);
            }
        });
    });
});
