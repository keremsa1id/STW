# Proje Takip

Tarayıcıda çalışan, derleme adımı gerektirmeyen bir proje ve görev takip aracı. Statik dosyalardan oluşur (`index.html`, `css/`, `js/`, `firebase.js`) ve PWA olarak kurulabilir. Giriş, bulut eşitleme, roller ve denetim kaydı için **Firebase** (Authentication + Firestore) kullanır. Uygulama arayüzü İngilizcedir.

Çalışma öğeleri **Epic → Story → Görev** hiyerarşisiyle planlanır. Jira mantığında durumlar, sprint, Board, Timeline ve raporlar vardır. Erişim **yalnızca davetle** verilir.

## Genel bakış

![Proje Takip genel mimari](docs/genel-bakis-diyagram.png)

## İçindekiler
- [Mimari](#mimari)
- [Hızlı kurulum](#hızlı-kurulum)
- [Özellikler](#özellikler)
- [Hesap, roller ve yetkiler](#hesap-roller-ve-yetkiler)
- [Denetim kaydı (Audit log)](#denetim-kaydı-audit-log)
- [Veri ve saklama](#veri-ve-saklama)
- [Güvenlik notları](#güvenlik-notları)
- [Hazır şablonlar](#hazır-şablonlar)
- [Teknik notlar](#teknik-notlar)
- [Diyagram dosyaları](#diyagram-dosyaları)
- [Bilinen sınırlar](#bilinen-sınırlar)

## Mimari

Uygulama tarayıcıda çalışan statik bir sayfadır, sunucu kodu yoktur. Üç parçadan oluşur:

- **Tarayıcı:** `js/` altındaki betikler tek bir durum nesnesini (`db`) günceller ve her değişiklikte sayfayı yeniden çizer. Cihazda `localStorage` bir kopya tutar.
- **Firebase Authentication:** e-posta ve şifreyle giriş, e-posta doğrulama, şifre sıfırlama.
- **Cloud Firestore:** projeler, kullanıcılar, izin listesi, davetler, rol yetkileri ve denetim kaydı. Her okuma ve yazmayı `firestore.rules` içindeki güvenlik kuralları sunucuda denetler.

![Sistem mimarisi](docs/mimari-diyagram.png)

## Hızlı kurulum

1. **Yayın:** Dosyalar statik olduğu için herhangi bir statik barındırma yeterlidir. GitHub Pages için: **Settings → Pages → Deploy from a branch → `main` / `(root)`**. Ücretsiz hesapta Pages için depo herkese açık olmalıdır. Adres: `https://KULLANICIADI.github.io/DEPOADI/`.
2. **Firebase projesi:** Firebase konsolunda proje açın. `firebase.js` içindeki `initializeApp({...})` değerlerini kendi projenizinkilerle değiştirin.
3. **Authentication:** Sign-in method → **Email/Password** açın. **Settings → Authorized domains** listesine yayın alan adınızı ekleyin (ör. `kullaniciadi.github.io`).
4. **Firestore:** Veritabanını oluşturun. `firestore.rules` dosyasının içeriğini **Firestore → Rules** bölümüne yapıştırıp **Publish** edin. Yayınlanmazsa veya test modu kalırsa giriş ekranı veriyi korumaz.
5. **İlk admin:** Kimse kendini uygulamadan admin yapamaz, ilk admin konsoldan atanır:
   1. Uygulamayı açın, **I was invited: create my account** ile hesabınızı oluşturun.
   2. Firebase konsolunda **Authentication → Users** listesinden hesabınızın **User UID** değerini kopyalayın.
   3. **Firestore → Data** bölümünde `users` koleksiyonunda, belge kimliği bu UID olan bir belge oluşturun: `email` (adresiniz) ve `role` = `admin`.
   4. Uygulamada sayfayı yenileyin ya da çıkış yapıp yeniden girin.
6. **API anahtarı kısıtlaması (önerilir):** Google Cloud Console → APIs & Services → Credentials → Browser key → *Websites* kısıtlaması olarak yayın adresinizi (`https://KULLANICIADI.github.io/*`) ekleyin.

Sonraki kullanıcılar uygulamanın içinden davet edilir (bkz. [Giriş](#giriş-yalnızca-davetle)).

Maliyet: Ücretsiz Spark planı küçük ekipler için yeterli olması beklenir, kredi kartı gerekmez. Kota dolarsa servis durur, ücret çıkmaz. Güncel limitler için [Firebase fiyatlandırma](https://firebase.google.com/pricing) sayfasına bakın.

## Özellikler

### Gezinme
Sol kenar çubuğu: **+ Create project**, **Search** (Ctrl+K), **Dashboard**, **For you**, **Archive** (arşivde proje varsa), **Members & Roles**, proje listesi (buluttaki projelerde ☁ işareti ve ilerleme yüzdesi), bildirimleri açma, **Import**, hesap düğmesi ve tema düğmesi.

- **Dashboard:** özet sayılar, "Due this week & overdue" listesi, proje kartları (yeniden adlandır, kopyala, arşivle, sil, sürükleyerek sırala) ve tüm projelerin **Insights** bölümü: duruma, önceliğe ve kişiye göre dağılım, son 8 haftada tamamlanan iş, geciken işler.
- **For you:** Adınızı girin. Assignee alanı bu adla eşleşen açık işler tüm projelerden toplanır: Overdue, Today, Next 7 days, Later, No due date.
- **Search:** Ctrl+K ile tüm projelerde görev arar (anahtar, başlık, açıklama, kişi, etiket, epic ve story adı).
- **Tema:** Otomatik (sistem) → Açık → Koyu, seçim saklanır.
- **Acil işler:** Bitmemiş, tarihi bugün ya da geçmiş olan ve önceliği High olan (ya da `#urgent` / `#critical` / `#acil` / `#kritik` etiketli) işler sayfanın üstünde kırmızı kutuda görünür. Bildirim izni verilirse sayfa açıkken saat başı sistem bildirimi de gelir.

### Proje ekranı
Üst çubuk: proje adı ve ilerleme, görünüm seçici, **Filters**, **Members** ve **Export**. Sekmeler: **Work items**, **Roadmap**, **Backlog**, **Sprints**, **Reports**.

**Work items** beş görünüm sunar:

| Görünüm | Ne yapar |
|---|---|
| **List** | Solda epic listesi, sağda açık epic'lerin story ve görevleri. Epic, story ve görev eklenir, yeniden adlandırılır, silinir. Görev kutucuğu işi Done yapar, kaldırılınca önceki durumuna döner. |
| **Board** | Durum sütunları. Kart sürüklenerek ya da ◀ ▶ ile taşınır. **Columns** ile sütun seçilir (içinde iş olan sütun her zaman görünür). Her sütun son taşınana ya da proje sırasına göre sıralanır ve daraltılabilir. "Move all To Do → Backlog" toplu geri alır. |
| **Calendar** | Aylık takvim, işler bitiş tarihine göre. Tarihsiz açık işler altta listelenir. |
| **Table** | Tablo. Birden fazla iş seçilip durum, öncelik, sprint ve kişi topluca değiştirilir ya da silinir. |
| **Timeline** | Gantt: başlangıç ve bitiş tarihine göre çubuklar, Days / Weeks / Months yakınlaştırma, bugün çizgisi. |

Diğer sekmeler:
- **Roadmap:** Epic'ler zaman ekseninde, dolu kısım tamamlanma oranını gösterir.
- **Backlog:** Backlog durumundaki işler öncelik sırasıyla (▲ ▼). İş sprint'e atanır ya da "To Do →" ile başlatılır.
- **Sprints:** Sprint oluştur (varsayılan 14 gün), başlat, tamamla, düzenle, sil. Tamamlanınca bitmemiş işler Backlog'a döner. Yanmamış iş (burndown) grafiği çıkar.
- **Reports:** Projenin Insights bölümü ve etkin sprint'in burndown grafiği. Haftalık tamamlanma grafiği, işlerin tamamlandığı an kaydedildiği için zamanla dolar.

Ortak davranışlar:
- **Filtreler:** durum, öncelik, etiket, kişi. Filtre isimle kaydedilir. "Assigned to me" kısayolu vardır.
- **Sürükle-bırak:** Epic, story, görev ve proje kartları tutamaçtan (⠿) sıralanır. Görev başka story'ye de taşınır. Dokunmatik ekranlarda da tutamaç kullanılır.
- **Geri al:** Silme, arşivleme, sprint tamamlama ve toplu işlemlerden sonra 8 saniye "Undo" düğmesi çıkar (Ctrl+Z de çalışır). Silme onay sormaz.
- **Arşiv:** Arşivlenen proje Dashboard'dan ve genel istatistiklerden çıkar, Archive bölümünden geri alınır.
- **Renkler:** Epic (🎨) ve görev (Colour alanı) renkleri değiştirilebilir. Durum ve öncelik renkleri sabittir.

### Görev sayfası
Görevin ✎ düğmesi ya da başlığı tam sayfa açar:
- Başlık, açıklama, alt görevler (checklist), bağlı görevler (blocks / is blocked by / relates to), bağlantılar (yalnızca `http(s)`), yorumlar ve etkinlik geçmişi.
- Yan panel: durum, öncelik (High / Medium / Low), atanan kişi, başlangıç ve bitiş tarihi, etiketler, renk, sprint.
- Süre takibi: tahmini ve harcanan saat, hızlı ekleme düğmeleri (+15m, +30m, +1h, +4h).

Geciken görevler kırmızı görünür. Görev anahtarı proje adının ilk üç harfi ve sabit bir numaradır (`MOB-12`). Görev silinse de diğerlerinin numarası değişmez.

### Durumlar ve renkleri (Jira mantığı)
Renk, durumun bağlı olduğu **kategoriden** gelir.
- **Gri (To Do kategorisi):** Backlog, Defined, Selected for Development, To Do
- **Mavi (In Progress kategorisi):** In Progress, In Review, Blocked, Ready for QA
- **Yeşil (Done kategorisi):** Done, Cancelled (iptal edilen iş haftalık tamamlanma grafiğine girmez)

Yeni görevler Backlog'da başlar. Board varsayılan olarak Backlog, To Do, In Progress, In Review, Blocked ve Done sütunlarını gösterir.

## Hesap, roller ve yetkiler

### Giriş (yalnızca davetle)
- Giriş yapılmadan hiçbir şey görünmez. İçeri yalnızca **Admin / Executive**'ler ve **izin listesindeki, e-postasını doğrulamış** kişiler girer.
- **Davet:** Projede **Members** → e-posta ve proje rolü yazıp **Send invite**. Kişi aynı e-postayla hesap açar, e-postasını doğrular, proje listesinde görünür. Bekleyen davetler Members penceresinde görünür ve iptal edilebilir. Uygulama davet e-postası göndermez, kişiye siz haber verirsiniz.
- **İzin listesi:** Admin, Members & Roles → Users sekmesindeki **Allowed email addresses** bölümünden adres ekleyip çıkarır. Proje daveti de adresi otomatik ekler.
- Doğrulama e-postası hesap penceresinden ya da giriş kapısından tekrar gönderilebilir. Şifre, giriş penceresindeki **Forgot password?** ile sıfırlanır.
- Yeni kullanıcılar her zaman **Member** olarak oluşur. Şirket rolünü yalnızca Admin değiştirir.

Davetten projenin listede görünmesine kadar akış:

![Davet ve giriş akışı](docs/davet-akisi-diyagram.png)

### İki katmanlı rol modeli
- **Organization rolü** (kişi başına tek): kimin neyi gördüğünü ve yönetim ekranlarını belirler.
  - **Admin:** tüm projeleri görür ve tam yetkilidir (proje rolü yok sayılır). Kullanıcıları, rolleri, izin listesini ve Audit log'u yönetir.
  - **Executive:** tüm projeleri görür. Projede rolü yoksa salt okunur.
  - **Member** (varsayılan): yalnızca eklendiği projeleri görür. Yetkisi projedeki rolünden gelir.
- **Project rolü** (proje başına): o projede ne yapılabileceğini belirler.

| Yetki | Project Manager | Team Lead | Contributor | Viewer |
|---|:-:|:-:|:-:|:-:|
| Projeyi görmek | ✔ | ✔ | ✔ | ✔ |
| Görev oluşturmak | ✔ | ✔ | ✔ | ✘ |
| Kendisine atanmış görevi düzenlemek / durumunu değiştirmek | ✔ | ✔ | ✔ | ✘ |
| Herhangi bir görevi düzenlemek | ✔ | ✔ | ✘ | ✘ |
| Görev silmek | ✔ | ✔ | ✘ | ✘ |
| Epic, story, sprint düzenlemek | ✔ | ✔ | ✘ | ✘ |
| Projeyi yeniden adlandırmak / arşivlemek / silmek | ✔ | ✘ | ✘ | ✘ |
| Üye eklemek, çıkarmak, rol vermek, davet | ✔ | ✘ | ✘ | ✘ |

Tablo varsayılan yetkileri gösterir. Admin bunları Permissions sekmesinden değiştirebilir.

**Kombinasyonlar:**

| Şirket rolü \ Projedeki rol | Rolü yok | Viewer | Contributor | Team Lead | Project Manager |
|---|---|---|---|---|---|
| **Admin** | Tam yetki | Tam yetki | Tam yetki | Tam yetki | Tam yetki |
| **Executive** | Sadece okur | Sadece okur | Okur + görev oluşturur, kendi görevini düzenler | Tüm görev, epic, story, sprint | Projede tam yetki |
| **Member** | Projeyi göremez | Sadece okur | Görev oluşturur, kendi görevini düzenler | Tüm görev, epic, story, sprint | Projede tam yetki |

Notlar:
- Projeyi oluşturan ya da buluta yükleyen kişi o projenin sahibi (Owner) ve Project Manager'ı olur. Sahibin rolü değiştirilemez.
- "Kendi görevi", Assignee alanı kişinin adı (**For you** bölümünde girilen), e-postası ya da e-postasının @ öncesiyle eşleşen görevdir.
- Permissions sekmesindeki *View all projects, Create projects, Import projects, Export projects, Manage users and roles* kutucukları bilgi amaçlıdır, uygulamada ayrıca denetlenmez.

Aynı bilgilerin şemalı hâli:

![Roller ve yetkiler](docs/roller-diyagram.png)

### Members & Roles ekranı
- **Permissions:** Bir rol seçilip yetkileri işaretlenir. Admin rolü kilitlidir. Yetkiler herkes için ortaktır (Firestore `config/roles`). Admin olmayanlar yetkileri yalnızca görür.
- **Users:** Admin, tüm kullanıcıları tek tabloda görür ve yeni şirket rolü seçer. Kendi rolünü değiştiremez. Proje rollerinde bu sekme, o rolde kimin hangi projede olduğunu gösterir.
- **Audit log:** Yalnızca Admin görür, bkz. [Denetim kaydı](#denetim-kaydı-audit-log).
- **+ New role** (özel roller) henüz yoktur, "Coming soon" bildirimi çıkar.

### Save düğmeleri
Rol ve yetki değişiklikleri **Save'e basılana kadar uygulanmaz**:
- Members & Roles → Permissions ve Users: üstte "N unsaved role change" şeridi, **Save** ve **Discard**.
- Proje → Members penceresi: üye rolü değişiklikleri ve çıkarmalar Save ile uygulanır (× satırı soluklaştırır, ↶ geri alır). Davet gönderme ve iptal anında olur.
- Kayıt başarısız olursa hangi işlemin neden reddedildiği gösterilir.

### Yetki uygulaması
- **Sunucu (Firestore kuralları):** kim okur, yazar, siler, üye ekler.
- **Uygulama:** ince yetkiler (görev oluştur / sil / düzenle, epic ve sprint düzenle, projeyi yeniden adlandır / arşivle). Yetkisiz değişiklik geri alınır ve uyarı çıkar.
- Salt okunur rollerde (Viewer, rolsüz Executive) alanlar pasif gelir, sürükleme kapanır, üstte "View only" uyarısı çıkar. Yalnızca bazı yetkisi eksik rollerde o işin düğmeleri gizlenir.

## Denetim kaydı (Audit log)

**Members & Roles → Audit log** (yalnızca Admin, son 300 kayıt, en yeni üstte). Kaydedilenler:
- Şirket rolü değişimi, rol yetkilerinin kaydı, izin listesine ekleme / çıkarma
- Davet gönderme, iptal, kabul. Proje rolü değişimi, üyeyi çıkarma
- Bulutta proje oluşturma ve silme
- Epic, story ve görev ekleme / silme / yeniden adlandırma / taşıma. Durum, atanan kişi, öncelik, tarih, sprint ve renk değişiklikleri. Proje adı ve arşiv

Çalışma biçimi: proje buluta kaydedilince son eşitlenen hâl ile yeni hâl karşılaştırılır ve farklar `audit` koleksiyonuna yazılır (bir kaydetmede en çok 25 kayıt, fazlası tek satırda özetlenir). Kurallar kayıt eklenmesine yalnızca kişinin kendi adına ve sunucu zamanıyla izin verir. **Kayıt düzenlenemez ve silinemez**, yalnızca Admin okur.

Bir değişikliğin cihazdan buluta ve Audit log'a gidişi (yetki kontrolü dahil):

![Kayıt, eşitleme ve denetim akışı](docs/kayit-denetim-diyagram.png)

Sınır: Kayıt tarayıcıdan yazıldığı için bir işlemin kayıt atılmadan yapılması kuralla engellenemez. Tam güvence için sunucu tarafı (Cloud Functions, ücretli Blaze planı) gerekir. Giriş / çıkış olayları kaydedilmez. Görev sayfasındaki *etkinlik geçmişi* proje belgesinin içindedir, kimin yaptığını tutmaz ve denetim kaydı yerine geçmez.

## Veri ve saklama
- **Bulut:** Projeler Firestore'da saklanır ve cihazlar arasında eşitlenir (`projects/{id}`: proje başına tek belge, `json` alanı en çok 900 KB). Değişiklikler yaklaşık 1,5 sn sonra buluta gider. Başka cihazdaki değişiklik anında gelir.
- **Cihaz:** `localStorage` (anahtar `proje-takip-v2`) cihaz kopyasını tutar. Çıkışta bulut projeleri cihazdan kaldırılır. Cihazda kalan projeler yalnızca sahibine (sahipsiz eski projeler yalnızca Admin'e) görünür.
- **Yükleme:** Giriş yapılmışken oluşturulan projeler buluta kendiliğinden kaydedilir. Girişten önce cihazda bulunan projeler otomatik yüklenmez, hesap penceresindeki **Upload** ile buluta taşınır, önce cihazda yedek alınır (`proje-takip-yedek-…` anahtarı).
- **Silme:** Buluttaki proje, silindikten yaklaşık 9 saniye sonra Firestore'dan da silinir (Undo süresi dolunca).
- **Yedek / aktarım:** Projedeki **Export** JSON'u kopyalanacak bir pencerede gösterir. Kenar çubuğundaki **Import**, yapıştırılan JSON'dan proje ekler. Eski biçimler (`asamalar`, `altbasliklar`, `gorevler`) okunur.
- Kullanıcılar `users`, izin listesi `allowlist`, davetler `invites`, rol yetkileri `config/roles`, denetim kaydı `audit` koleksiyonlarındadır.

Proje yapısı ve Firestore belgeleri:

![Veri modeli](docs/veri-modeli-diyagram.png)

## Güvenlik notları
- Firebase yapılandırması (`firebase.js` içindeki apiKey dahil) herkese açık bilgidir. Erişimi **Authentication ve Firestore kuralları** korur. En kritik adım, `firestore.rules` dosyasının konsolda **yayınlanmış** olmasıdır. Rules Playground'da girişsiz bir okuma "Denied" vermelidir.
- API anahtarını yayın alan adına kısıtlamak ek bir katmandır (bkz. [kurulum](#hızlı-kurulum) 6. adım).
- Kodda `innerHTML` yalnızca sabit ikonlar ve sayısal grafik için kullanılır. Kullanıcı metinleri `textContent` ile yazılır. Bağlantılar yalnızca `http(s)` kabul eder.
- Herkese açık kayıt kapatılabilir (Authentication → Settings → User actions). Ancak davet akışı kişinin kendi hesabını açmasına dayanır, kapatırsanız davetlilerin hesaplarını konsoldan elle açmanız gerekir. Kurallar davetsiz kişiye zaten veri vermez.

## Hazır şablonlar
**+ Create project** şu şablonları sunar: Mobile Game, Mobile App, Website / Web Application, Software Product (MVP), Corporate Project Management, Marketing Campaign, Finance: Agent-Assisted Market Analysis & Trading. **Blank project** boş başlar.

Finans şablonu 7 aşamadan oluşur: hedef ve çerçeve → ajan / skill altyapısı → veri kaynakları → piyasa analizi → strateji ve test → canlı işlem ve takip → operasyon ve iyileştirme. Yatırım tavsiyesi değildir, yalnızca bir iş planı iskeletidir.

## Teknik notlar

### Dosya yapısı

| Dosya / klasör | İçerik |
|---|---|
| `index.html` | Sayfa iskeleti. Stilleri ve betikleri sırayla yükler. |
| `firebase.js` | Firebase SDK'sı, yapılandırma, Auth ve Firestore çağrıları (`window.FB`), denetim kaydı yazımı. |
| `firestore.rules` | Firestore güvenlik kuralları. Konsola yapıştırılıp yayınlanır. |
| `sw.js`, `manifest.webmanifest` | Service worker (dosya önbelleği, bildirimler) ve PWA tanımı. |
| `js/data.js` | Veri modeli, `localStorage`, durumlar, eski biçimlerin normalleştirilmesi. |
| `js/cloud.js` | Oturum, giriş kapısı, eşitleme, yetki denetimi, denetim farkı (`auditDiff`). |
| `js/account.js`, `js/roles.js` | Giriş ve hesap pencereleri, Members penceresi, Members & Roles ekranı, Audit log. |
| `js/shell.js`, `js/render.js`, `js/main.js` | Kenar çubuğu, üst çubuk, ana çizim döngüsü, kilitli ekranlar, pencereler, içe / dışa aktarma. |
| `js/list.js`, `js/board.js`, `js/calendar.js`, `js/timeline.js` | List, Board ve Table, Calendar, Timeline ve Roadmap görünümleri, sürükle-bırak. |
| `js/task.js`, `js/sprints.js`, `js/reports.js` | Görev sayfası, Backlog ve Sprints, Insights ve Reports. |
| `js/home.js`, `js/me.js`, `js/search.js`, `js/notifications.js` | Dashboard, For you, arama, acil iş bildirimleri. |
| `js/templates.js`, `js/ui.js` | Hazır şablonlar, DOM yardımcıları ve Undo. |
| `css/` | Konuya göre bölünmüş stiller (`base`, `layout`, `list`, `board`, `tasks`, `roles`, `responsive` vb.). |
| `docs/`, `proje-diyagrami.drawio` | Diyagram görselleri ve kaynakları. |

### Notlar
- **Bağımlılık:** Yalnızca Firebase JavaScript SDK'sı (`gstatic.com` üzerinden, sabit sürüm 10.14.1). Başka kütüphane ve derleme adımı yoktur.
- **Sürüm etiketleri:** `index.html` dosyaları `?v=N` ile yükler, `sw.js` aynı listeyi önbelleğe alır. Bir dosya değişince `index.html` içindeki numarası, `sw.js` içindeki `FILES` listesi ve `CACHE` adı birlikte güncellenmelidir. Aksi hâlde tarayıcı eski dosyayı gösterebilir.
- **Veri modeli (özet):** `{ cur, theme, me, roles, savedFilters, cols, colSort, projects: [{ id, name, archived, seq, phases: [{ id, name, color, open, subs: [{ id, name, open, tasks: [Task] }] }], sprints: [{ id, name, goal, start, end, state }] }] }`
  - `Task`: `id, t, done, st, pri, who, due, start, note, tags, color, sprint, est, spent, num, rank, subs, comments, log, links, urls, doneAt, stAt`
  - Durum (`st`): `backlog, defined, selected, todo, doing, review, blocked, qa, cancelled` (`done` ayrı alan). Öncelik: `high | mid | low`. Sprint durumu: `planned | active | closed`.
  - Buluta giden `json` alanında `open`, `cloudId`, `owner` ve `localOnly` yer almaz.
- **Sürükle-bırak:** fare için HTML5 Drag and Drop, dokunmatik / kalem için pointer olayları.
- **Ad sorma:** `prompt()` yerine sayfa içi pencere kullanılır (bazı önizleme ortamları `prompt()` çağrısını engeller).
- **Tema:** CSS değişkenleri, `prefers-color-scheme` ve elle seçim.

## Diyagram dosyaları

Yukarıdaki şemaların kaynağı [diagrams.net](https://app.diagrams.net) (draw.io) dosyalarıdır. Açmak için **Open Existing Diagram** deyin ya da dosyayı sayfaya sürükleyin. Görsel almak için **File → Export as → PNG** (zoom 200%).

| Şema | Görsel | Kaynak |
|---|---|---|
| Genel bakış | `docs/genel-bakis-diyagram.png` | [`proje-diyagrami.drawio`](proje-diyagrami.drawio), "Genel Bakış" sayfası |
| Sistem mimarisi | `docs/mimari-diyagram.png` | [`proje-diyagrami.drawio`](proje-diyagrami.drawio), "1 - Sistem Mimarisi" sayfası |
| Veri modeli | `docs/veri-modeli-diyagram.png` | `docs/veri-modeli-diyagram.drawio` |
| Roller ve yetkiler | `docs/roller-diyagram.png` | `docs/roller-diyagram.drawio` |
| Davet ve giriş akışı | `docs/davet-akisi-diyagram.png` | `docs/davet-akisi-diyagram.drawio` |
| Kayıt ve denetim akışı | `docs/kayit-denetim-diyagram.png` | `docs/kayit-denetim-diyagram.drawio` |

`proje-diyagrami.drawio` altı sayfanın hepsini birlikte içerir. Kod veya Firestore kuralları değiştiğinde şemaların ve görsellerin de güncellenmesi gerekir.

## Bilinen sınırlar
- İnce yetkiler (görev, epic düzenleme) uygulamada denetlenir. Sunucu yalnızca kaba ayrımı (okuma / yazma / silme / üyelik) zorlar. Çok güvenilmeyen kullanıcılar için yetersizdir.
- Bir proje tek Firestore belgesidir (en çok ~900 KB). İki kişi aynı anda düzenlerse son kaydeden diğerinin değişikliğinin üzerine yazar.
- Denetim kaydı kuralla zorlanmaz (bkz. [Denetim kaydı](#denetim-kaydı-audit-log)).
- Davet e-postası, e-posta / Slack bildirimi, SSO, 2FA, API ve webhook yoktur. Sistem bildirimi yalnızca sayfa açıkken çalışır.
- Geri al yalnızca tarayıcıda 8 saniye geçerlidir. Bulut yedeği otomatik değildir.
- Özel roller (**+ New role**) henüz yoktur.
- Dokunmatik sürükleme gerçek cihazda test edilmedi.
