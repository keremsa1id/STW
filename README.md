# Proje Takip

Tek dosyadan (`index.html`) oluşan, kurulum gerektirmeyen bir proje ve görev takip aracı. Tarayıcıda açılır; sunucu, derleme adımı ya da dış kütüphane yoktur.

## Ne işe yarar?

Projeleri **Başlık → Alt başlık → Görev** hiyerarşisiyle planlar ve ilerlemeyi yüzde olarak gösterir.

### Ana sayfa
- Tüm projeler kart olarak listelenir (ad, ilerleme yüzdesi, görev ve başlık sayısı).
- Üstte özet: proje sayısı, tamamlanan proje, toplam görev ilerlemesi, genel yüzde.
- Karttan projeyi açma, yeniden adlandırma, kopyalama ve silme.
- Kartları tutamaçtan (⠿) sürükleyerek yeniden sıralama.
- Yeni proje: hazır şablondan ya da boş projeden.
- JSON ile içe aktarma.

### Proje ekranı
- Başlık, alt başlık ve görev ekleme, yeniden adlandırma, silme.
- Sürükle-bırakla sıralama (aynı gruptaki öğeler arasında).
- Başlıkları aç/kapat, "Tümünü aç / kapat".
- Her seviyede ilerleme çubuğu.
- Projeyi JSON olarak dışa aktarma.

### Yeni özellikler
- **Tema düğmesi:** Otomatik (sistem) → Açık → Koyu, seçim saklanır.
- **Geri al:** Silinen görev, başlık, alt başlık, proje ve arşivleme işlemi için 8 saniye "Geri al" düğmesi (Ctrl+Z de çalışır). Silme artık onay sormaz.
- **Arşiv:** Biten projeler 📦 ile ana sayfadan gizlenir; üstteki "Arşiv" düğmesinden görülür/geri alınır. Genel istatistiklere dahil edilmez.
- **Görev ayrıntıları (✎):** not, bitiş tarihi, sorumlu, öncelik (yüksek/orta/düşük), renkli etiketler, durum. Geciken görevler kırmızı görünür.
- **Filtre:** Öncelik, etiket ve kişiye göre (liste, Kanban ve takvimde geçerli).
- **Sürükleme:** Görevler başka alt başlığa da taşınır (alt başlığın üstüne bırakınca sona eklenir). Dokunmatik ekranlarda tutamaçtan (⠿) sürüklenir.
- **Ana sayfa:** "Bu hafta ve geciken işler" listesi.
- **Görünümler:** Liste, Kanban (Backlog / Todo / In progress / Done; ◀ ▶ ile taşı, sütundan + ile yeni görev), aylık takvim ve Tablo. Görünüm simgeleri ve Filtreler (durum, öncelik, etiket, kişi) sağ üstte.

### Hazır şablonlar
Mobil Oyun, Mobil Uygulama, Web Sitesi / Web Uygulaması, Yazılım Ürünü (MVP), Kurumsal Proje Yönetimi, Pazarlama Kampanyası, Finans: Ajan Destekli Piyasa Analizi ve İşlem.

Finans şablonu 7 aşamadan oluşur: hedef ve çerçeve → ajan/skill altyapısı → veri kaynakları → piyasa analizi (ABD hisse, kripto, merdiven işlemler) → strateji ve test (geriye dönük + kâğıt üzerinde) → canlı işlem ve takip → operasyon ve iyileştirme. Yatırım tavsiyesi değildir; yalnızca bir iş planı iskeletidir.

## Kullanım

`index.html` dosyasını tarayıcıda açmak yeterlidir. GitHub Pages ile yayınlamak için: **Settings → Pages → Deploy from a branch → `main` / `(root)`**.

## Mevcut aşama: yerel veri

Veriler tarayıcının `localStorage` alanında saklanır (anahtar: `proje-takip-v2`).

- Veri **kişinin kendi tarayıcısında** kalır. Başka bir kişi ya da başka bir bilgisayar bu verileri görmez.
- Tarayıcı verisi temizlenirse projeler silinir.
- GitHub yalnızca sayfanın kodunu barındırır, veri tutmaz.
- Cihazlar arası taşıma elle yapılır: **Dışa aktar** ile JSON alınır, diğer tarafta **İçe aktar** ile yüklenir. Bu bir anlık kopyadır, canlı senkronizasyon değildir.

Bu aşamada ortak çalışma **yoktur**.

## Sonraki aşama (planlanan): ortak çalışma

Linki bilen ama şifreyi de bilen herkesin aynı projeleri görüp düzenleyebilmesi hedeflenir. Henüz yapılmadı.

Plan (Firebase):
1. Firebase projesi oluşturulur; **Firestore** ve **Authentication (e-posta/şifre)** açılır.
2. Ekip için ortak bir hesap oluşturulur. Sayfa açılınca giriş ekranı sorar.
3. Firestore kuralları yalnızca giriş yapmış kullanıcıya okuma/yazma izni verir. Şifre yalnızca sayfada kontrol edilirse güvenli olmaz, bu yüzden kural tarafında zorunlu tutulur.
4. `save()` ve veri yükleme Firestore'a bağlanır; değişiklikler herkese anlık yansır.
5. Mevcut yerel veriler için tek seferlik "buluta aktar" seçeneği eklenir.

Maliyet: Ücretsiz Spark planı küçük ekipler için yeterli olması beklenir, kredi kartı gerekmez. Kota dolarsa servis durur, ücret çıkmaz. Güncel limitler için [Firebase fiyatlandırma](https://firebase.google.com/pricing) sayfasına bakın.

Sınırlar: Ortak hesap yönteminde kimin ne değiştirdiği izlenemez; birini çıkarmak için şifre değiştirilip herkese yeniden verilir. Kişi bazlı hesap gerekirse ayrıca eklenir.

## Teknik notlar

- Yapı: `index.html` içinde CSS ve JavaScript bir arada.
- Veri modeli: `{ cur, theme, projects: [{ id, name, archived, phases: [{ id, name, open, subs: [{ id, name, open, tasks: [{ id, t, done, note, due, who, pri, tags, st }] }] }] }] }`
- İçe aktarma, eski biçimleri (`asamalar`, `altbasliklar`, `gorevler`) de okuyacak şekilde normalleştirilir.
- Sürükle-bırak: fare için HTML5 Drag and Drop, dokunmatik/kalem için pointer olayları.
- Ad sorma işlemleri `prompt()` yerine sayfa içi pencere kullanır (bazı önizleme ortamları `prompt()` çağrısını engeller).
