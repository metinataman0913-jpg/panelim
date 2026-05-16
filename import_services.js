const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.resolve(__dirname, 'database.sqlite'));

const services = [
  // Reddit
  ['Reddit', 'Reddit Görüntülenmesi | Max 500M | 30 Gün Telafi | ULTRA HIZLI', 14.06, 2917, 99, 500000000],
  ['Reddit', 'Reddit Paylaşımı | Max 500M | 30 Gün Telafi | ULTRA HIZLI', 14.06, 2918, 99, 500000000],
  ['Reddit', 'Reddit Link Paylaşımı | Max 500M | ULTRA HIZLI', 14.52, 2919, 99, 500000000],
  ['Reddit', 'Reddit Görüntüleme + Paylaşım | Max 500M | ULTRA HIZLI', 26.31, 2920, 99, 500000000],
  ['Reddit', 'Reddit Kanal Abonesi | Max 2M | ULTRA HIZLI', 54.42, 2921, 9, 2000000],
  // Telegram
  ['Telegram', 'Telegram Gönderi İzlenme | Max Sınırsız | Son 1 Gönderi', 0.09, 10348, 10, 2147483647],
  ['Telegram', 'Telegram Gönderi İzlenme | Max Sınırsız | Son 5 Gönderi', 0.41, 10349, 10, 2147483647],
  ['Telegram', 'Telegram Gönderi İzlenme | Max Sınırsız | Son 10 Gönderi', 0.81, 10350, 10, 2147483647],
  ['Telegram', 'Telegram Gönderi İzlenme | Max Sınırsız | Son 20 Gönderi', 1.61, 10352, 10, 2147483647],
  ['Telegram', 'Telegram Gönderi İzlenme | Max Sınırsız | Son 50 Gönderi', 4.03, 10354, 10, 2147483647],
  ['Telegram', 'Telegram Gönderi İzlenme | Max Sınırsız | Son 100 Gönderi', 8.05, 10355, 10, 2147483647],
  ['Telegram', 'Telegram Üyeleri | Max 1M | Ömür Boyu Telafi | Gerçek', 30.07, 3552, 10, 1000000],
  ['Telegram', 'Telegram Üyeleri | Max 10M | Yüksek Kalite | Non Drop', 41.86, 6460, 10, 10000000],
  ['Telegram', 'Telegram Üyeleri | Max 1M | İptal Aktif | Telafi Yok', 0.71, 10239, 1, 1000000],
  ['Telegram', 'Telegram Üyeleri | Max 1M | 7 Gün Garantili', 0.77, 10241, 1, 1000000],
  ['Telegram', 'Telegram Üyeleri | Max 1M | 30 Gün Garantili', 0.80, 10242, 1, 1000000],
  // Instagram Takipçi
  ['Instagram', 'Instagram Takipçi | Max 100K | Gerçek | İptal Aktif | Telafi Yok', 7.67, 10401, 100, 100000],
  ['Instagram', 'Instagram Takipçi | Max 500K | Gerçek | Düşüş Yok | Ömür Boyu', 17.69, 10204, 100, 500000],
  ['Instagram', 'Instagram Takipçi | Max 5M | Ömür Boyu Garantili | 500K/Gün', 17.69, 5614, 100, 5000000],
  ['Instagram', 'Instagram Takipçi | Max 100K | Eski Hesaplar | Ömür Boyu', 17.69, 10227, 50, 100000],
  ['Instagram', 'Instagram Takipçi | Max 100K | Gerçek | Düşük Düşüş | Ömür Boyu', 18.28, 9993, 100, 100000],
  ['Instagram', 'Instagram Takipçi | Max 5M | +15 Gönderi | Ömür Boyu | 500K/Gün', 20.05, 5582, 100, 1000000],
  ['Instagram', 'Instagram Takipçi | Max 10M | Eski Hesaplar | Ömür Boyu', 20.05, 5600, 100, 10000000],
  ['Instagram', 'Instagram Takipçi | Max 5M | Eski Hesaplar | Düşük | Ömür Boyu', 22.41, 7345, 10, 5000000],
  ['Instagram', 'Instagram Takipçi | Max 5M | Gerçek | Düşüş Yok | Ömür Boyu', 23.59, 9862, 10, 5000000],
  ['Instagram', 'Instagram Takipçi | Max 10M | HQ +6 Gönderi | Ömür Boyu', 24.18, 5707, 1, 100000000],
  ['Instagram', 'Instagram Takipçi | Max 2M | HQ | Düşüş Yok | Ömür Boyu | 500K/Gün', 25.94, 5566, 50, 2000000],
  ['Instagram', 'Instagram Takipçi | Max 5M | HQ | Ömür Boyu | 500K/Gün', 91.38, 4624, 10, 5000000],
  ['Instagram', 'Instagram Takipçi | Max 1M | Düşük | Ömür Boyu | 200K/Gün', 43.04, 829, 50, 1000000],
  ['Instagram', 'Instagram Takipçi | Max 10M | 500K/Gün | Ömür Boyu', 67.80, 1000, 10, 10000000],
  ['Instagram', 'Instagram Takipçi | Max 1M | %100 Gerçek | Ömür Boyu', 104.35, 13, 10, 1000000],
  // Instagram - Türkiye
  ['Instagram', 'Instagram Takipçi | Türkiye | Max 1M | 365 Gün | 50K/Gün', 117.91, 851, 11, 1000000],
  ['Instagram', 'Instagram Takipçi | Türkiye | Max 50K | 365 Gün', 501.09, 5057, 10, 50000],
  // Instagram Beğeni
  ['Instagram', 'Instagram Beğeni | Max 500K | HQ | İptal Aktif | Ömür Boyu', 2.66, 5545, 10, 500000],
  ['Instagram', 'Instagram Beğeni | Max 500K | HQ | 30 Gün', 2.42, 5541, 10, 500000],
  ['Instagram', 'Instagram Beğeni | Max 500K | HQ | 60 Gün', 2.48, 5542, 10, 500000],
  ['Instagram', 'Instagram Beğeni | Max 1M | HQ | Telafi Yok', 2.95, 10259, 100, 1000000],
  ['Instagram', 'Instagram Beğeni | Max 1M | HQ | 30 Gün', 3.01, 10260, 100, 1000000],
  ['Instagram', 'Instagram Beğeni | Max 1M | HQ | Ömür Boyu', 3.25, 10264, 100, 1000000],
  ['Instagram', 'Instagram Beğeni | Max 5M | Gerçek | 500K/Gün | Ömür Boyu', 25.94, 5904, 50, 1000000],
  // Instagram Reels/Video
  ['Instagram', 'Instagram Video İzlenme | Sınırsız | Tüm Linkler | İptal', 0.03, 10393, 100, 217545811],
  ['Instagram', 'Instagram Video İzlenme | Sınırsız | İptal Aktif | 1M/Gün', 0.04, 10394, 10, 217545811],
  // Instagram Story
  ['Instagram', 'Instagram Hikaye İzlenme | Max 50K | Tüm Hikayeler', 0.15, 1291, 10, 50000],
  ['Instagram', 'Instagram Hikaye İzlenme | Max 100K | Tüm Hikayeler', 0.83, 1295, 100, 100000],
  ['Instagram', 'Instagram Hikaye İzlenme + Beğeni | Türkiye | Max 50K', 17.69, 1286, 10, 50000],
  // Instagram Kaydetme
  ['Instagram', 'Instagram Kaydetme | Max 50K | Günlük 20K', 0.15, 1448, 5, 50000],
  ['Instagram', 'Instagram Kaydetme | Max 1M | Anında', 2.95, 1441, 10, 1000000],
  // Instagram Yorum
  ['Instagram', 'Instagram Yorum | Özel | Max 10K | Gerçek Profiller', 17.69, 10219, 10, 10000],
  ['Instagram', 'Instagram Yorum | Random | Max 10K | Gerçek Profiller', 17.69, 10220, 10, 10000],
  // Instagram Paylaşım/Repost
  ['Instagram', 'Instagram Repost | Global | Max 10M | Gerçek Hesaplar', 16.51, 10095, 100, 10000000],
  ['Instagram', 'Instagram Paylaşım | Max Sınırsız | Süper Hızlı', 0.48, 2336, 100, 2147483647],
  // Instagram Profil Ziyareti
  ['Instagram', 'Instagram Hikaye İzlenme + Profil Ziyareti | Max 50K', 0.13, 1304, 100, 1000000],
  ['Instagram', 'Instagram Profil Ziyareti | Max 1M', 2.66, 7338, 10, 1000000],
  // Instagram Canlı Yayın
  ['Instagram', 'Instagram Canlı Yayın İzlenme | Max 10K | 15 Dakika', 29.48, 1480, 50, 10000],
  ['Instagram', 'Instagram Canlı Yayın İzlenme | Max 10K | 30 Dakika', 58.96, 1481, 50, 10000],
  ['Instagram', 'Instagram Canlı Yayın İzlenme | Max 10K | 60 Dakika', 117.91, 1482, 50, 10000],
  ['Instagram', 'Instagram Canlı Yayın İzlenme | Max 10K | 120 Dakika', 235.81, 1484, 50, 10000],
  // TikTok Takipçi
  ['Tiktok', 'TikTok Takipçi | Max 10M | Düşük | Ömür Boyu | 100K/Gün', 47.76, 3600, 10, 10000000],
  ['Tiktok', 'TikTok Takipçi | Max 5M | HQ | Ömür Boyu | 50K/Gün', 47.76, 5146, 10, 5000000],
  ['Tiktok', 'TikTok Takipçi | Max 10M | HQ Fotoğraflı | Ömür Boyu', 57.19, 5324, 10, 10000000],
  ['Tiktok', 'TikTok Takipçi | Max 1M | Gerçek | Ömür Boyu | 500K/Gün', 67.80, 5633, 10, 1000000],
  ['Tiktok', 'TikTok Takipçi | Max 10M | HQ | Ömür Boyu | 100K/Gün', 79.59, 9047, 10, 10000000],
  ['Tiktok', 'TikTok Takipçi | Max 1M | Gerçek | Ömür Boyu | 100K/Gün', 79.59, 9048, 10, 1000000],
  ['Tiktok', 'TikTok Takipçi | Max 1M | Gerçek | Ömür Boyu | Anlık', 88.43, 16, 10, 1000000],
  ['Tiktok', 'TikTok Takipçi | Max 10M | HQ | Ömür Boyu | 200K/Gün', 103.17, 6097, 10, 10000000],
  ['Tiktok', 'TikTok Takipçi | Max 1M | HQ | Ömür Boyu | 100K/Gün', 112.01, 5454, 10, 1000000],
  ['Tiktok', 'TikTok Takipçi | Max 5M | WW | HQ | Ömür Boyu', 112.01, 9052, 10, 5000000],
  ['Tiktok', 'TikTok Takipçi | Max 1M | 1 Dakika | Ömür Boyu', 117.91, 6428, 100, 1000000],
  ['Tiktok', 'TikTok Takipçi | Max 10M | WW | HQ | 500K/Gün | Ömür Boyu', 123.80, 5432, 10, 10000000],
  ['Tiktok', 'TikTok Takipçi | Max 1M | HQ+GERÇEK | 30 Gün | 200K/Gün', 110.83, 5403, 10, 5000000],
  ['Tiktok', 'TikTok Takipçi | Max 1M | Gerçek | Telafi Yok | Anlık', 64.85, 250, 10, 1000000],
  ['Tiktok', 'TikTok Takipçi | Max 1M | Gerçek | 30 Gün | Anlık', 79.59, 255, 10, 1000000],
  ['Tiktok', 'TikTok Takipçi | Max 5M | HQ | 30 Gün | 100K/Gün', 86.66, 5399, 10, 5000000],
  ['Tiktok', 'TikTok Takipçi | Brezilya | Max 1M | %0 Düşüş | 30 Gün', 135.59, 7496, 10, 1000000],
  // TikTok Beğeni
  ['Tiktok', 'TikTok Beğeni | Max 1M | Bot | Ömür Boyu | 200K/Gün', 3.25, 4327, 50, 1000000],
  ['Tiktok', 'TikTok Beğeni | Max 5M | Gerçek+Bot | Ömür Boyu | 200K/Gün', 2.95, 4363, 100, 5000000],
  ['Tiktok', 'TikTok Beğeni | Max 10M | Premium | Ömür Boyu | 10M/Gün', 4.72, 6396, 10, 10000000],
  ['Tiktok', 'TikTok Beğeni | Max 50K | HQ | Ömür Boyu | 100K/Gün', 5.31, 3866, 10, 500000],
  ['Tiktok', 'TikTok Beğeni | Max 5M | Gizli Profil | Ömür Boyu | 200K/Gün', 3.84, 6155, 10, 5000000],
  ['Tiktok', 'TikTok Beğeni | Max 2M | %100 Gerçek | Ömür Boyu | 100K/Gün', 5.02, 6197, 10, 2000000],
  ['Tiktok', 'TikTok Beğeni | Max 10M | Düşüş Yok | Ömür Boyu | 200K/Gün', 2.95, 10123, 10, 1000000],
  ['Tiktok', 'TikTok Beğeni | Max 500K | HQ | Ömür Boyu | 500K/Gün', 2.95, 10258, 50, 5000000],
  // TikTok İzlenme
  ['Tiktok', 'TikTok İzlenme | Max Sınırsız | HQ | Anlık | 5M/Gün', 1.07, 9535, 100, 2147483647],
  ['Tiktok', 'TikTok İzlenme | Max Sınırsız | HQ | Ultra Hızlı', 1.24, 9498, 100, 2147483647],
  ['Tiktok', 'TikTok İzlenme | Max Sınırsız | Ömür Boyu | 20M/Gün', 1.77, 4433, 100, 2147483647],
  ['Tiktok', 'TikTok İzlenme | Max Sınırsız | Ömür Boyu | Anlık', 1.95, 9589, 100, 2147483647],
  ['Tiktok', 'TikTok Video Kaydetme | Max Sınırsız | 30 Gün | 100M/Gün', 0.02, 10400, 10, 2147483647],
  // TikTok Yorum
  ['Tiktok', 'TikTok Özel Yorum | Max 500K | HQ | Anlık | Ultra Hızlı', 38.32, 6162, 1, 50000],
  ['Tiktok', 'TikTok Emoji Yorum | Max 100K | 30 Gün | Anlık', 47.17, 7985, 10, 100000],
  ['Tiktok', 'TikTok Özel Yorum | Max 100K | 30 Gün | Anlık', 88.43, 7991, 10, 100000],
  // TikTok Paylaşım
  ['Tiktok', 'TikTok Paylaşım | Max Sınırsız | Ömür Boyu | 500K/Gün', 2.95, 3248, 10, 2147483647],
  // TikTok Canlı Yayın
  ['Tiktok', 'TikTok Canlı Yayın Beğeni | Max Sınırsız | Düşüş Yok', 0.24, 4625, 10, 2147483647],
  ['Tiktok', 'TikTok Canlı Yayın İzlenme | Max 10K | 30 Dakika | Gerçek', 61.90, 9276, 50, 100000],
  ['Tiktok', 'TikTok Canlı Yayın İzlenme | Max 10K | 60 Dakika | Gerçek', 125.57, 9277, 50, 100000],
  ['Tiktok', 'TikTok Canlı Yayın İzlenme | Max 10K | 60 Dakika | %100 Gerçek', 342.22, 4638, 10, 10000],
  // YouTube Abone
  ['Youtube', 'YouTube Abone | Max 100K | HQ | Düşüş Yok | Ömür Boyu', 116.73, 804, 50, 100000],
  ['Youtube', 'YouTube Abone | Max 200K | HQ | Ömür Boyu | 1K/Gün', 170.96, 810, 50, 200000],
  ['Youtube', 'YouTube Abone | Max 50K | HQ | Ömür Boyu | Hız 50-150/Gün', 212.23, 805, 50, 30000],
  ['Youtube', 'YouTube Abone | Max 1M | Yüksek Kalite | Ömür Boyu', 224.02, 809, 100, 1000000],
  ['Youtube', 'YouTube Abone | Max 1M | Telafi+İptal | Ömür Boyu', 707.42, 808, 100, 1000000],
  ['Youtube', 'YouTube Abone | Max 100K | Düşük Kalite | Garantisiz', 13.56, 383, 10, 100000],
  // YouTube Beğeni
  ['Youtube', 'YouTube Beğeni | Max 50K | HQ | Garantisiz | 50K/Gün', 106.12, 314, 10, 500000],
  ['Youtube', 'YouTube Beğeni | Max 80K | HQ | 30 Gün | 50K/Gün', 117.91, 316, 10, 500000],
  ['Youtube', 'YouTube Beğeni | Max 100K | HQ | 30 Gün | 100K/Gün', 112.01, 37, 10, 100000],
  ['Youtube', 'YouTube Beğeni | Max 100K | HQ | Ömür Boyu | 50K/Gün', 135.59, 40, 10, 100000],
  ['Youtube', 'YouTube Beğeni | Max 1M | 30 Gün | 50K/Gün', 235.81, 10392, 20, 1000000],
  // YouTube İzlenme
  ['Youtube', 'YouTube İzlenme | Max 100K | Telafi Yok | 10K/Gün', 20.64, 594, 200, 5000000],
  ['Youtube', 'YouTube İzlenme | Max 500K | 30 Gün | 50K/Gün', 23.59, 597, 100, 1000000],
  ['Youtube', 'YouTube İzlenme | Max 5M | Ömür Boyu | 5K/Gün', 43.04, 600, 100, 50000000],
  ['Youtube', 'YouTube İzlenme | Düşüş Yok | Ömür Boyu | 100K/Gün', 44.60, 601, 10, 5000000],
  // YouTube Yorum
  ['Youtube', 'YouTube Özel Yorum | Max 5K | HQ | İptal Aktif | Telafi Yok', 82.54, 7125, 5, 5000],
  ['Youtube', 'YouTube Özel Yorum | Max 5K | HQ | 30 Gün', 90.20, 7126, 5, 5000],
  ['Youtube', 'YouTube Özel Yorum | Max 5K | HQ | Ömür Boyu', 100.22, 324, 5, 5000],
  // YouTube Shorts
  ['Youtube', 'YouTube Shorts İzlenme | Max 5M | Ömür Boyu | 60K/Gün', 48.35, 312, 100, 5000000],
  ['Youtube', 'YouTube Shorts Beğeni | Max 50K | HQ | Garantisiz', 117.91, 308, 100, 50000],
  ['Youtube', 'YouTube Shorts Beğeni | Max 300K | 30 Gün | 100K/Gün', 135.59, 311, 100, 300000],
  // Twitter/X
  ['Twitter', 'X / Twitter Tweet İzlenme | Max Sınırsız | %0 Düşüş | Telafi Yok', 0.12, 10395, 100, 2147483647],
  ['Twitter', 'X / Twitter Tweet İzlenme | Max Sınırsız | 30 Gün', 0.12, 10396, 100, 2147483647],
  ['Twitter', 'X / Twitter Tweet İzlenme | Max Sınırsız | Ömür Boyu', 0.13, 10398, 100, 2147483647],
  // Facebook
  ['Facebook', 'Facebook Takipçi | Sayfa/Profil | Max 300K | Ömür Boyu', 9.14, 9941, 50, 300000],
  ['Facebook', 'Facebook Takipçi | Max 1M | HQ | Ömür Boyu | 300K/Gün', 11.21, 4174, 100, 1000000],
  ['Facebook', 'Facebook Takipçi | Max 500K | HQ | Ömür Boyu | 50K/Gün', 11.21, 9892, 10, 500000],
  ['Facebook', 'Facebook Sayfa Takipçi | Max 500K | Ömür Boyu | 50K/Gün', 54.92, 1972, 10, 1000000],
  ['Facebook', 'Facebook Beğeni (👍) | Max 100K | HQ+Gerçek | Telafi Yok', 2.82, 5773, 10, 100000],
  ['Facebook', 'Facebook ❤️ | Max 100K | HQ+Gerçek | Telafi Yok', 2.82, 5774, 10, 100000],
  // Bluesky
  ['Bluesky', 'BlueSky Takipçi | Max 500K | 30 Gün Yenileme', 469.26, 7243, 10, 1000000],
  ['Bluesky', 'BlueSky Beğeni | Max 500K | 30 Gün Yenileme', 366.10, 7244, 10, 1000000],
  ['Bluesky', 'BlueSky Retweet | Max 500K | 30 Gün Yenileme', 280.03, 7245, 10, 1000000],
];

db.serialize(() => {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO services (category, name, price, api_service_id, min_order, max_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  services.forEach(s => stmt.run(s));
  stmt.finalize(() => {
    console.log(`✅ ${services.length} servis başarıyla eklendi!`);
    db.get('SELECT COUNT(*) as total FROM services', (err, row) => {
      console.log(`📊 Toplam servis sayısı: ${row.total}`);
      db.close();
    });
  });
});
