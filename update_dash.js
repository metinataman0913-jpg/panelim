const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'public/dashboard.html');
const servislerPath = path.join(__dirname, 'public/servisler.html');

let dashboard = fs.readFileSync(dashboardPath, 'utf8');
let servisler = fs.readFileSync(servislerPath, 'utf8');

// --- 1. Remove Modal & Floating Button ---
// HIZLI SİPARİŞ MODAL'den </div> (quick-fab'ın sonu) kadar sil.
const modalRegex = /<!-- HIZLI SİPARİŞ MODAL -->[\s\S]*?<!-- Hızlı Sipariş Yüzen Buton -->[\s\S]*?<\/div>\s*<\/nav>/;
if(modalRegex.test(dashboard)){
    dashboard = dashboard.replace(modalRegex, '</nav>');
}

// --- 2. Update Tabs ---
const tabsRegex = /(<div class="flex gap-4 mb-8 border-b border-white\/5 overflow-x-auto">\s*<button onclick="switchTab\('new-order'\)" id="tab-new-order" class="tab-btn active uppercase tracking-wider">Yeni Sipariş<\/button>)/;
dashboard = dashboard.replace(tabsRegex, `$1\n            <button onclick="switchTab('quick-order')" id="tab-quick-order" class="tab-btn uppercase tracking-wider">Hızlı Sipariş</button>`);

const tabEndRegex = /(<button onclick="switchTab\('referral'\)" id="tab-referral" class="tab-btn uppercase tracking-wider">Davet Et<\/button>)/;
dashboard = dashboard.replace(tabEndRegex, `$1\n            <button onclick="switchTab('services')" id="tab-services" class="tab-btn uppercase tracking-wider">Servisler</button>`);

// --- 3. Process Servisler HTML ---
const tbodyMatch = servisler.match(/<tbody>([\s\S]*?)<\/tbody>/);
let tbodyContent = tbodyMatch ? tbodyMatch[1] : '';

// Process classes for dark theme
tbodyContent = tbodyContent.replace(/<tr class="cat-row"><td colspan="5">/g, '<tr class="bg-indigo-600/20 font-black text-indigo-400 uppercase tracking-widest text-[10px]"><td colspan="5" class="p-4 border-b border-indigo-500/20">');
tbodyContent = tbodyContent.replace(/<tr>/g, '<tr class="border-b border-white/5 hover:bg-white/[0.02]">');
tbodyContent = tbodyContent.replace(/<td>/g, '<td class="p-4 text-slate-300">');
// Change badges
tbodyContent = tbodyContent.replace(/badge b-tg/g, 'bg-blue-500 text-white px-1.5 py-0.5 rounded text-[9px] mr-2');
tbodyContent = tbodyContent.replace(/badge b-ig/g, 'bg-pink-500 text-white px-1.5 py-0.5 rounded text-[9px] mr-2');
tbodyContent = tbodyContent.replace(/badge b-tt/g, 'bg-white text-black px-1.5 py-0.5 rounded text-[9px] mr-2');

// Apply 100% Discount
tbodyContent = tbodyContent.replace(/<td class="price">(.*?)<\/td>/g, '<td class="p-4"><span class="text-red-500/50 line-through text-[10px] mr-1">$1</span><span class="text-emerald-400 font-bold ml-1 text-sm">0.00 TL</span></td>');

// --- 4. Prepare Sections HTML ---
const newSections = `
        <!-- HIZLI SİPARİŞ -->
        <section id="section-quick-order" class="hidden">
            <div class="glass-card p-8 max-w-3xl mx-auto border-t-4 border-indigo-500">
                <div class="mb-8 border-b border-white/5 pb-4">
                    <h3 class="text-2xl font-black text-white tracking-tighter italic">HIZLI <span class="text-indigo-500 uppercase">Sipariş</span></h3>
                    <p class="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Minimum 100 Adet</p>
                </div>

                <div class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Kategori</label>
                            <select id="quick-category" onchange="filterQuickServices()" class="w-full custom-input text-sm focus:border-indigo-500 outline-none transition-all cursor-pointer">
                                <!-- Kategoriler JS ile dolacak -->
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Paket</label>
                            <select id="quick-service" onchange="updateQuickPrice()" class="w-full custom-input text-sm focus:border-indigo-500 outline-none transition-all cursor-pointer">
                                <!-- Servisler JS ile dolacak -->
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Miktar</label>
                            <input type="number" id="quick-amount" oninput="updateQuickPrice()" value="100" min="100" class="w-full custom-input text-sm focus:border-indigo-500 outline-none transition-all" placeholder="Min 100">
                        </div>
                        <div class="flex flex-col justify-end">
                            <div class="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-center">
                                <span class="text-[10px] text-slate-500 font-bold block uppercase">Toplam</span>
                                <span id="quick-total" class="text-lg font-black text-white">0.00 TL</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Link / Kullanıcı Adı</label>
                        <input type="text" id="quick-link" class="w-full custom-input text-sm focus:border-indigo-500 outline-none transition-all" placeholder="Örn: metin0913">
                    </div>

                    <div class="pt-4">
                        <button onclick="submitQuickOrder()" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2">
                            <i class="fas fa-bolt"></i>
                            SİPARİŞİ ONAYLA
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- SERVİSLER -->
        <section id="section-services" class="hidden">
            <div class="glass-card overflow-hidden">
                <div class="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h3 class="text-lg font-black text-white uppercase"><i class="fas fa-tags text-emerald-500 mr-2"></i> İndirimli Servisler <span class="bg-emerald-500 text-white text-[10px] px-2 py-1 rounded ml-2 shadow-[0_0_10px_rgba(16,185,129,0.5)]">%100 İndirim</span></h3>
                    <input type="text" id="serviceSearch" onkeyup="searchServicesDashboard()" placeholder="Servis Ara..." class="custom-input max-w-xs text-sm">
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse" id="servicesTableDashboard">
                        <thead>
                            <tr class="bg-white/[0.03] text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <th class="p-4">ID</th>
                                <th class="p-4">Servis Açıklaması</th>
                                <th class="p-4">1000/Fiyat (İndirimli)</th>
                                <th class="p-4">Min/Max</th>
                                <th class="p-4">Ort. Süre</th>
                            </tr>
                        </thead>
                        <tbody class="text-xs">
                            ${tbodyContent}
                        </tbody>
                    </table>
                </div>
            </div>
            <script>
            function searchServicesDashboard() {
                let val = document.getElementById('serviceSearch').value.toUpperCase();
                let rows = document.querySelector("#servicesTableDashboard tbody").rows;
                for (let i = 0; i < rows.length; i++) {
                    if (!rows[i].classList.contains('bg-indigo-600/20')) {
                        let text = rows[i].innerText.toUpperCase();
                        rows[i].style.display = text.indexOf(val) > -1 ? "" : "none";
                    }
                }
            }
            </script>
        </section>
        </section>
`;

dashboard = dashboard.replace(/<\/section>\s*<\/section>\s*<\/main>/, newSections + '\n    </main>');

// Fix extra section tag bug if exists
dashboard = dashboard.replace(/<\/section>\s*<\/section>\s*<\/section>/g, '</section>\n</section>');

// --- 5. Update switchTab and openQuickOrder in JS ---
dashboard = dashboard.replace(/if \(id === 'tickets'\) loadTickets\(\);/, `if (id === 'tickets') loadTickets();\n            if (id === 'quick-order') openQuickOrder();`);

dashboard = dashboard.replace(/document\.getElementById\('quick-order-modal'\)\.classList\.remove\('hidden'\);/, '');
dashboard = dashboard.replace(/function closeQuickOrder\(\) {[\s\S]*?}/, ''); // Remove closeQuickOrder

fs.writeFileSync(dashboardPath, dashboard);
console.log("Successfully updated dashboard.html");
