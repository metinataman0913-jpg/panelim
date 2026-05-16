const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'public/dashboard.html');
const adminPath = path.join(__dirname, 'public/admin.html');

let dash = fs.readFileSync(dashboardPath, 'utf8');
let admin = fs.readFileSync(adminPath, 'utf8');

// --- 1. Reorder Tabs in Dashboard ---
dash = dash.replace(
    /(<div class="flex gap-4 mb-8 border-b border-white\/5 overflow-x-auto">\s*)(<button onclick="switchTab\('new-order'\)" id="tab-new-order" class="tab-btn active uppercase tracking-wider">Yeni Sipariş<\/button>\s*)<button onclick="switchTab\('quick-order'\)" id="tab-quick-order" class="tab-btn uppercase tracking-wider">Hızlı Sipariş<\/button>/,
    `$1<button onclick="switchTab('quick-order')" id="tab-quick-order" class="tab-btn uppercase tracking-wider">Hızlı Sipariş</button>\n            $2`
);

// --- 2. Add Order Success Alert HTML ---
const alertHtml = `
        <!-- Sipariş Başarı Bildirimi -->
        <div id="order-success-alert" class="hidden mb-8 glass-card border-l-4 border-emerald-500 bg-emerald-500/10 p-6 flex items-center justify-between animate-[slideIn_0.3s_ease-out]">
            <div class="flex items-center gap-4">
                <div class="bg-emerald-500/20 p-3 rounded-full">
                    <i class="fas fa-check-circle text-2xl text-emerald-400"></i>
                </div>
                <div>
                    <h3 class="text-emerald-400 font-black text-lg tracking-tight">Siparişiniz Alındı!</h3>
                    <p class="text-xs font-bold text-slate-400 mt-1">İşleminiz sıraya alındı, onaylanması bekleniyor.</p>
                </div>
            </div>
            <div class="flex gap-8 text-right hidden sm:flex">
                <div>
                    <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sipariş Tutarı</p>
                    <p id="alert-price" class="text-sm font-black text-white">0.00 TL</p>
                </div>
                <div>
                    <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Kalan Bakiye</p>
                    <p id="alert-balance" class="text-sm font-black text-emerald-400">0.00 TL</p>
                </div>
                <div>
                    <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Saat</p>
                    <p id="alert-time" class="text-sm font-black text-slate-300">00:00</p>
                </div>
            </div>
        </div>
`;
dash = dash.replace(/(<main class="max-w-6xl mx-auto p-6">\s*)/, `$1${alertHtml}`);

// --- 3. Modify satinAl and submitQuickOrder to trigger the alert ---
dash = dash.replace(
    /if \(res\.ok\) \{ showToast\('Sipariş başarıyla oluşturuldu!', 'success'\); loadAllData\(\); \}/,
    `if (res.ok) { showToast('Sipariş başarıyla oluşturuldu!', 'success'); showOrderAlert(price); }`
);

dash = dash.replace(
    /if \(res\.ok\) \{\s*showToast\(data\.message, "success"\);\s*closeQuickOrder\(\);\s*loadAllData\(\);\s*\}/,
    `if (res.ok) {\n                    showToast(data.message, "success");\n                    showOrderAlert(totalPrice);\n                }`
);

// Add showOrderAlert function
const scriptToAdd = `
        async function showOrderAlert(priceSpent) {
            await loadAllData(); // Update balances first
            const currentBalance = document.getElementById('stat-balance').innerText;
            const now = new Date();
            const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            
            document.getElementById('alert-time').innerText = timeStr;
            document.getElementById('alert-price').innerText = parseFloat(priceSpent).toFixed(2) + ' TL';
            document.getElementById('alert-balance').innerText = currentBalance;
            
            const alertDiv = document.getElementById('order-success-alert');
            alertDiv.classList.remove('hidden');
            setTimeout(() => { alertDiv.classList.add('hidden'); }, 8000);
        }
`;
dash = dash.replace(/(window\.onload = loadAllData;)/, `${scriptToAdd}\n        $1`);

fs.writeFileSync(dashboardPath, dash);


// --- 4. Admin HTML Modifications ---
admin = admin.replace(
    /<tr><th class="p-4">Kategori<\/th><th class="p-4">Ad<\/th><th class="p-4">Fiyat \(1000\)<\/th><th class="p-4">API ID<\/th><th class="p-4">İşlem<\/th><\/tr>/,
    `<tr><th class="p-4">ID</th><th class="p-4">Kategori</th><th class="p-4">Ad</th><th class="p-4">Fiyat (1000)</th><th class="p-4">API ID</th><th class="p-4">İşlem</th></tr>`
);

admin = admin.replace(
    /tbody\.innerHTML \+= `\s*<tr class="hover:bg-white\/\[0\.01\]">\s*<td class="p-4 font-bold text-white">\$\{s\.category\}<\/td>/,
    `tbody.innerHTML += \`\n                        <tr class="hover:bg-white/[0.01]">\n                            <td class="p-4 text-slate-500 font-mono text-[10px]">#\${s.id}</td>\n                            <td class="p-4 font-bold text-white">\${s.category}</td>`
);

fs.writeFileSync(adminPath, admin);

console.log("Successfully updated dashboard.html and admin.html");
