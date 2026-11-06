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

### Hazır şablonlar
Mobil Oyun, Mobil Uygulama, Web Sitesi / Web Uygulaması, Yazılım Ürünü (MVP), Kurumsal Proje Yönetimi, Pazarlama Kampanyası.

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
- Veri modeli: `{ cur, projects: [{ id, name, phases: [{ id, name, open, subs: [{ id, name, open, tasks: [{ id, t, done }] }] }] }] }`
- İçe aktarma, eski biçimleri (`asamalar`, `altbasliklar`, `gorevler`) de okuyacak şekilde normalleştirilir.
- Sürükle-bırak HTML5 Drag and Drop kullanır; dokunmatik ekranlarda çalışmayabilir.
- Ad sorma işlemleri `prompt()` yerine sayfa içi pencere kullanır (bazı önizleme ortamları `prompt()` çağrısını engeller).
