const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, 'public/dashboard.html');
const adminPath = path.join(__dirname, 'public/admin.html');

let dash = fs.readFileSync(dashPath, 'utf8');
let admin = fs.readFileSync(adminPath, 'utf8');

// --- 1. Change Panel Name ---
dash = dash.replace(/ARI KBAŞ <span class="text-indigo-500">PANEL<\/span>/g, 'Ömer Sosyal Medya <span class="text-indigo-500">VIP Panel</span>');
admin = admin.replace(/ARIKBAŞ <span class="text-indigo-500">ADMIN<\/span>/g, 'Ömer Sosyal Medya <span class="text-indigo-500">VIP ADMIN</span>');


// --- 2. Tab Order: Kategoriler (Servisler) -> Davet Et ---
// Swap the two buttons
const refBtnRegex = /<button onclick="switchTab\('referral'\)" id="tab-referral" class="tab-btn uppercase tracking-wider">Davet Et<\/button>\s*<button onclick="switchTab\('services'\)" id="tab-services" class="tab-btn uppercase tracking-wider">Servisler<\/button>/;
dash = dash.replace(refBtnRegex, `<button onclick="switchTab('services')" id="tab-services" class="tab-btn uppercase tracking-wider">Servisler</button>\n            <button onclick="switchTab('referral')" id="tab-referral" class="tab-btn uppercase tracking-wider">Davet Et</button>`);


// --- 3. Hızlı Sipariş Search Field & Logic ---
const quickOrderHeaderRegex = /<div class="grid grid-cols-1 md:grid-cols-2 gap-6">/;
dash = dash.replace(quickOrderHeaderRegex, `
                    <div class="mb-6">
                        <label class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Ne Arıyorsunuz?</label>
                        <input type="text" id="quick-search" onkeyup="filterQuickServices()" class="w-full custom-input text-sm focus:border-indigo-500 outline-none transition-all" placeholder="Servis Ara (Örn: İzlenme, Takipçi)">
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">`);

dash = dash.replace(/function filterQuickServices\(\) {[\s\S]*?updateQuickPrice\(\);\s*}/, `function filterQuickServices() {
            const cat = document.getElementById('quick-category').value;
            const searchInput = document.getElementById('quick-search');
            const search = searchInput ? searchInput.value.toLowerCase() : '';
            const quickSelect = document.getElementById('quick-service');
            
            const filtered = allServices.filter(s => {
                const safeCat = s.category ? s.category.replace(/"/g, '&quot;') : '';
                const matchCat = safeCat === cat;
                const matchSearch = s.name && s.name.toLowerCase().includes(search);
                return matchCat && (!search || matchSearch);
            });
            
            quickSelect.innerHTML = filtered.map(s => {
                const safeName = s.name ? s.name.replace(/"/g, '&quot;') : '';
                return \`<option value="\${s.id}" data-price="\${s.price}">\${safeName}</option>\`;
            }).join('');
            
            updateQuickPrice();
        }`);


// --- 4. User Ticket Chat Modal & Logic ---
const userTicketModalHtml = `
    <!-- User Ticket Modal -->
    <div id="ticket-modal-user" class="fixed inset-0 bg-black/90 backdrop-blur-md hidden z-[6000] flex justify-center items-center p-4">
        <div class="glass-card p-8 w-full max-w-lg">
            <div class="flex justify-between items-center mb-6">
                <h3 id="modal-ticket-subject-user" class="font-bold text-sm text-white">Destek Talebi</h3>
                <button onclick="document.getElementById('ticket-modal-user').classList.add('hidden')" class="text-slate-500 hover:text-white"><i class="fas fa-times"></i></button>
            </div>
            <div id="ticket-chat-user" class="space-y-3 max-h-60 overflow-y-auto mb-6 p-4 bg-black/40 rounded-xl text-[11px]"></div>
            <div class="flex gap-2">
                <input type="text" id="ticket-reply-msg-user" class="custom-input flex-grow text-xs" placeholder="Mesajınız...">
                <button id="btn-send-reply-user" class="primary-btn text-xs !py-2 !px-4">GÖNDER</button>
            </div>
        </div>
    </div>
`;

// Insert the modal before scripts
dash = dash.replace(/(<script>)/, `${userTicketModalHtml}\n    $1`);

// Update loadTickets
dash = dash.replace(/function loadTickets\(\) {[\s\S]*?list\.innerHTML \+= `[\s\S]*?<\/div>\s*`;\s*}\);\s*}\s*}/, `async function loadTickets() {
            const res = await fetch('/api/tickets');
            if (res.ok) {
                const tickets = await res.json();
                const list = document.getElementById('ticketsList');
                list.innerHTML = tickets.length === 0 ? '<p class="text-xs text-slate-500">Açılmış destek talebi bulunmuyor.</p>' : '';
                tickets.forEach(t => {
                    list.innerHTML += \`
                        <div class="bg-black/20 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                            <div>
                                <h4 class="font-bold text-xs text-white">\${t.subject}</h4>
                                <p class="text-[10px] text-slate-500">\${new Date(t.createdAt).toLocaleString()}</p>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="text-[9px] font-bold px-3 py-1 rounded bg-indigo-600/20 text-indigo-400 uppercase">\${t.status}</span>
                                <button onclick="openTicketUser(\${t.id}, '\${t.subject.replace(/'/g, "\\'")}')" class="bg-white/10 hover:bg-white/20 text-white font-bold py-1 px-3 rounded text-[10px] transition-all"><i class="fas fa-reply mr-1"></i> Cevaplar</button>
                            </div>
                        </div>
                    \`;
                });
            }
        }`);

// Add openTicketUser
const openTicketUserScript = `
        async function openTicketUser(id, subject) {
            document.getElementById('modal-ticket-subject-user').innerText = subject;
            const res = await fetch(\`/api/tickets/\${id}\`);
            if (res.ok) {
                const msgs = await res.json();
                const chat = document.getElementById('ticket-chat-user');
                chat.innerHTML = '';
                msgs.forEach(m => chat.innerHTML += \`<div class="mb-2 \${m.isAdmin ? 'text-left' : 'text-right'}"><span class="inline-block p-2 rounded-lg \${m.isAdmin ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-white'}">\${m.message}</span></div>\`);
                document.getElementById('ticket-modal-user').classList.remove('hidden');
                
                document.getElementById('btn-send-reply-user').onclick = async () => {
                    const message = document.getElementById('ticket-reply-msg-user').value;
                    if(!message) return;
                    const rRes = await fetch(\`/api/tickets/\${id}/reply\`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
                    if(rRes.ok) { document.getElementById('ticket-reply-msg-user').value = ''; openTicketUser(id, subject); }
                }
            }
        }
`;
dash = dash.replace(/(async function createTicket\(\) \{)/, `${openTicketUserScript}\n        $1`);

fs.writeFileSync(dashPath, dash);
fs.writeFileSync(adminPath, admin);

console.log("Successfully applied updates!");
