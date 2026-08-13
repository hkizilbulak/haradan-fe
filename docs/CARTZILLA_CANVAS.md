# 🎨 CARTZILLA — HOME ELECTRONICS TEMPLATE
## Tasarım Teknik Haritası (Canvas Dokümantasyonu)
> Kaynak: https://cartzilla-html.createx.studio/home-electronics.html  
> Amaç: Bu template'i birebir React Native / Expo ile yeniden üretmek için izlenmesi gereken tasarım kuralları, sayfa yapısı ve bileşen mimarisi.

---

## 📐 1. TASARIM SİSTEMİ (Design Tokens)

### 🎨 Renk Paleti

```
PRIMARY
  --primary:          #fe6a00   (Turuncu — CTA, butonlar, badge)
  --primary-dark:     #e05e00   (Hover durumu)
  --primary-light:    #fff3eb   (Arka plan vurgusu)

NÖTR / GRİ
  --dark:             #1f2128   (Başlıklar, ana metin)
  --secondary:        #6c757d   (Açıklama metni)
  --border:           #e3e6ef   (Kartlar, ayırıcılar)
  --bg-light:         #f3f5f9   (Sayfa arka planı, kartlar)
  --white:            #ffffff

DURUM RENKLERİ
  --success:          #22c55e   (Stok mevcut, onay)
  --danger:           #ef4444   (İndirim badge, hata)
  --warning:          #f59e0b   (Yıldız rating)
  --info:             #3b82f6   (Bilgi mesajı)
```

### 📝 Tipografi

```
Font Family:
  Başlıklar:  "Inter", sans-serif  (700, 600)
  Gövde:      "Inter", sans-serif  (400, 500)

Font Scale:
  h1: 2.5rem   / 700
  h2: 2rem     / 700
  h3: 1.5rem   / 600
  h4: 1.25rem  / 600
  h5: 1rem     / 600
  body-lg: 1rem / 400
  body-sm: .875rem / 400
  caption: .75rem  / 400
```

### 📏 Spacing (Boşluk Sistemi)

```
Base unit: 4px
  xs:   4px
  sm:   8px
  md:   16px
  lg:   24px
  xl:   32px
  2xl:  48px
  3xl:  64px
  4xl:  96px
```

### 🔲 Border Radius

```
  pill:    50px   (Butonlar, badge)
  card:    12px   (Ürün kartları)
  modal:   16px   (Modal, drawer)
  input:   8px    (Form alanları)
  circle:  50%    (Avatar, ikon)
```

### 🌑 Gölge (Shadow)

```
  card-shadow:   0 2px 12px rgba(0,0,0,0.08)
  hover-shadow:  0 6px 24px rgba(0,0,0,0.12)
  modal-shadow:  0 16px 48px rgba(0,0,0,0.18)
```

---

## 🗺️ 2. SAYFA HARİTASI (Sitemap)

```
CARTZILLA — HOME ELECTRONICS
│
├── 🏠 HOME                      (Ana Sayfa)
│   ├── Hero Banner / Slider
│   ├── Category Icons Bar
│   ├── Featured Brands
│   ├── Hot Deals (countdown)
│   ├── Popular Products Grid
│   ├── Promo Banner (2 kolon)
│   ├── New Arrivals
│   └── Blog / Haberler
│
├── 🛍️ SHOP / CATALOG            (Ürün Listesi)
│   ├── Sidebar Filter
│   │   ├── Kategori
│   │   ├── Fiyat Range Slider
│   │   ├── Marka Checkbox
│   │   ├── Rating Filtresi
│   │   └── Renk / Özellik
│   ├── Toolbar (sort, grid/list toggle, count)
│   ├── Product Grid (3/4 kolon)
│   └── Pagination
│
├── 🔍 SEARCH RESULTS            (Arama Sonuçları)
│
├── 📦 PRODUCT DETAIL            (Ürün Detay)
│   ├── Image Gallery (thumbnail + main)
│   ├── Ürün Başlığı & Rating
│   ├── Fiyat & İndirim Badge
│   ├── Renk / Varyant Seçici
│   ├── Adet + Sepete Ekle
│   ├── Wishlist & Compare
│   ├── Ürün Özellikleri Tab
│   │   ├── Açıklama
│   │   ├── Teknik Özellikler
│   │   └── Yorumlar & Rating
│   └── Related Products
│
├── 🛒 CART                      (Sepet)
│   ├── Ürün Listesi (qty edit, sil)
│   ├── Kupon Kodu
│   └── Sipariş Özeti
│
├── 💳 CHECKOUT                  (Ödeme)
│   ├── Adım 1: Teslimat Adresi
│   ├── Adım 2: Kargo Seçimi
│   ├── Adım 3: Ödeme Yöntemi
│   └── Adım 4: Onay
│
├── ✅ ORDER CONFIRMATION        (Sipariş Onayı)
│
├── 👤 ACCOUNT                   (Hesap)
│   ├── Dashboard
│   ├── Siparişlerim
│   ├── Wishlist
│   ├── Adreslerim
│   ├── Ödeme Yöntemlerim
│   └── Hesap Ayarları
│
├── 🔐 AUTH
│   ├── Giriş Yap
│   ├── Kayıt Ol
│   └── Şifremi Unuttum
│
└── 📄 STATIC PAGES
    ├── Hakkımızda
    ├── İletişim
    └── 404
```

---

## 🧩 3. BILEŞEN HARİTASI (Component Map)

### GLOBAL BILEŞENLER

```
┌─────────────────────────────────────────────────────┐
│  HEADER                                             │
│  ┌──────────┬──────────────────────┬─────────────┐  │
│  │  Logo    │  Search Bar (büyük)  │  Cart/User  │  │
│  └──────────┴──────────────────────┴─────────────┘  │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Ana Navigasyon (mega menu ile)                 │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  FOOTER                                             │
│  Logolar | Linkler | Sosyal Medya | Ödeme İkonları  │
└─────────────────────────────────────────────────────┘
```

### SAYFA BILEŞENLERI

#### A. ProductCard (Ürün Kartı)
```
┌────────────────────────┐
│  [Badge: İndirim %]    │
│  [Wishlist ♡ ikonu]    │
│  ┌──────────────────┐  │
│  │   Ürün Görseli   │  │
│  │   (aspect 1:1)   │  │
│  └──────────────────┘  │
│  Kategori adı          │
│  Ürün başlığı          │
│  ⭐ 4.5 (128 yorum)    │
│  ~~$199~~  $149        │
│  [+ Sepete Ekle]       │
└────────────────────────┘
Durum varyantları:
  - default
  - hover (shadow artar, buton görünür)
  - out-of-stock (overlay + metin)
```

#### B. HeroBanner (Slider)
```
┌────────────────────────────────────────────────┐
│  [◀]  BG Görsel / Renk                   [▶]  │
│       ┌──────────────┐                         │
│       │  Üst Etiket  │                         │
│       │  ANA BAŞLIK  │                         │
│       │  Alt başlık  │                         │
│       │  [CTA Btn]   │                         │
│       └──────────────┘                         │
│  ● ○ ○  (dots)                                 │
└────────────────────────────────────────────────┘
```

#### C. CategoryBar (Kategori Şeridi)
```
[İkon + Yazı] [İkon + Yazı] [İkon + Yazı] [İkon + Yazı]
Scroll yatay — her biri tıklanabilir pill/kart
```

#### D. CountdownTimer (Geri Sayım)
```
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│  02 │ │  14 │ │  38 │ │  55 │
│ GÜN │ │ SAA │ │ DAK │ │ SAN │
└─────┘ └─────┘ └─────┘ └─────┘
```

#### E. FilterSidebar
```
┌───────────────────┐
│ KATEGORİLER       │
│  □ Telefon (24)   │
│  □ Laptop  (18)   │
│  □ TV      (12)   │
│                   │
│ FİYAT             │
│  |━━━●━━━━━●━━━|  │
│  $0        $2000  │
│                   │
│ MARKA             │
│  □ Apple          │
│  □ Samsung        │
│                   │
│ RATING            │
│  ★★★★★ (48)       │
└───────────────────┘
```

#### F. SearchBar
```
┌────────────────────────────────────────┐
│ [Kategori ▼] | 🔍 Ürün ara...   [Ara] │
└────────────────────────────────────────┘
```

#### G. MiniCart (Drawer)
```
[X] Sepetim (3 ürün)
─────────────────────
[Görsel] Ürün adı
         $149 x 2
─────────────────────
Toplam: $298
[Sepete Git]  [Ödemeye Git]
```

---

## 📱 4. RESPONSIVE BREAKPOINT KURALLARI

```
Mobile:   < 576px   → Tek kolon, hamburger menu
Tablet:   576–991px → 2 kolon, sidebar drawer
Desktop:  992–1199px → 3 kolon, sidebar visible
Wide:     ≥ 1200px  → 4 kolon, full layout

Grid sistemi:
  Container max-width: 1320px
  Gutter: 24px (desktop), 16px (mobile)
  Kolon sayısı: 12
```

---

## 🗂️ 5. EKRAN / SAYFA CANVAS ŞABLONLARI

### 🏠 HOME PAGE — Canvas Layout

```
┌─────────────────────────────────────────────────────────┐
│                       HEADER                            │
│  [Logo]    [══════ Search ══════]    [♡][🛒3][👤]       │
│  [Menü] [Telefon] [Laptop] [TV] [Beyaz Eşya] [Kampanya] │
├─────────────────────────────────────────────────────────┤
│              HERO SLIDER (tam genişlik)                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Büyük promo görseli + metin + CTA               │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  KATEGORİ İKON ŞERIT                                    │
│  [📱Telefon] [💻Laptop] [📺TV] [🔌Aksesuar] [🎧Ses]    │
├─────────────────────────────────────────────────────────┤
│  HOT DEALS — Sıcak Fırsatlar         [⏱ 02:14:38:55]   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│  │Kart 1│ │Kart 2│ │Kart 3│ │Kart 4│ │Kart 5│ │Kart 6││
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘│
├─────────────────────────────────────────────────────────┤
│  PROMO BANNER (2 Kolon)                                 │
│  ┌───────────────────────┐ ┌───────────────────────┐   │
│  │  Banner 1 (Laptop)    │ │  Banner 2 (Telefon)   │   │
│  └───────────────────────┘ └───────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  POPÜLER ÜRÜNLER                        [Tümünü Gör →]  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
│  │Kart 1│ │Kart 2│ │Kart 3│ │Kart 4│                   │
│  └──────┘ └──────┘ └──────┘ └──────┘                   │
├─────────────────────────────────────────────────────────┤
│  MARKALAR (Logo Şeridi — scroll)                        │
│  [Apple] [Samsung] [Sony] [LG] [Xiaomi] [Huawei]        │
├─────────────────────────────────────────────────────────┤
│                       FOOTER                            │
└─────────────────────────────────────────────────────────┘
```

### 🛍️ CATALOG PAGE — Canvas Layout

```
┌──────────────────────────────────────────────────────┐
│                      HEADER                          │
├──────────────────────────────────────────────────────┤
│  Breadcrumb: Ana Sayfa > Kategori                    │
├────────────┬─────────────────────────────────────────┤
│            │  Toolbar: [Sırala ▼] [12 ürün] [≡][⊞]  │
│  FİLTRE    ├─────────────────────────────────────────┤
│  SIDEBAR   │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  (260px)   │  │Kart 1│ │Kart 2│ │Kart 3│ │Kart 4│  │
│            │  └──────┘ └──────┘ └──────┘ └──────┘  │
│  Kategoriler│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│  Fiyat     │  │Kart 5│ │Kart 6│ │Kart 7│ │Kart 8│  │
│  Marka     │  └──────┘ └──────┘ └──────┘ └──────┘  │
│  Renk      ├─────────────────────────────────────────┤
│  Rating    │  [< 1  2  3  4  5 >]  Pagination       │
└────────────┴─────────────────────────────────────────┘
```

### 📦 PRODUCT DETAIL — Canvas Layout

```
┌──────────────────────────────────────────────────────┐
│                      HEADER                          │
├──────────────────────────────────────────────────────┤
│  Breadcrumb                                          │
├────────────────────────┬─────────────────────────────┤
│  GALERİ                │  ÜRÜN BİLGİLERİ             │
│  ┌──────────────────┐  │  Marka adı (küçük)          │
│  │                  │  │  # ÜRÜN BAŞLIĞI             │
│  │   Ana Görsel     │  │  ⭐⭐⭐⭐½  (128 yorum)      │
│  │                  │  │  SKU: #123456               │
│  └──────────────────┘  │  ─────────────────          │
│  [T1][T2][T3][T4]      │  ~~$299~~  $199  %33 İndirim│
│  (thumbnail'lar)        │  ─────────────────          │
│                        │  Renk: ● ● ●                │
│                        │  Depolama: [64] [128] [256] │
│                        │  ─────────────────          │
│                        │  Adet: [−][2][+]            │
│                        │  [+Sepete Ekle]  [♡ İstek]  │
│                        │  ─────────────────          │
│                        │  🚚 Ücretsiz Kargo          │
│                        │  🔄 30 Gün İade             │
└────────────────────────┴─────────────────────────────┤
│  [Açıklama] [Özellikler] [Yorumlar (24)]             │
│  Tab içerik alanı                                    │
├──────────────────────────────────────────────────────┤
│  İLGİLİ ÜRÜNLER                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                │
└──────────────────────────────────────────────────────┘
```

### 🛒 CART PAGE — Canvas Layout

```
┌──────────────────────────────────────────────────────┐
│                      HEADER                          │
├────────────────────────────────┬─────────────────────┤
│  SEPET ÜRÜNLERİ                │  SİPARİŞ ÖZETİ      │
│  ┌────────────────────────┐    │  ─────────────────  │
│  │[Görsel] Ürün Adı       │    │  Ara Toplam: $398   │
│  │ Renk: Siyah | Dep:128  │    │  Kargo:     Ücretsiz│
│  │ [−][2][+]    $198  [🗑]│    │  İndirim:   -$40    │
│  └────────────────────────┘    │  ─────────────────  │
│  ┌────────────────────────┐    │  TOPLAM:    $358    │
│  │[Görsel] Ürün Adı 2     │    │  ─────────────────  │
│  │ ...                    │    │  [Ödemeye Geç →]    │
│  └────────────────────────┘    │                     │
│                                │  Kupon Kodu:        │
│  [Alışverişe Devam]            │  [______][Uygula]   │
└────────────────────────────────┴─────────────────────┘
```

---

## ⚡ 6. İNTERAKSİYON & ANİMASYON KURALLARI

```
HOVER ETKİLERİ
  ProductCard hover:
    - box-shadow artar (0 6px 24px rgba(0,0,0,0.12))
    - "Sepete Ekle" butonu aşağıdan slide-up ile görünür
    - transform: translateY(-4px) — kart hafif yükselir
    - transition: all 0.25s ease

  Button hover:
    - background darkar (%10)
    - transform: translateY(-1px)

TOAST / NOTIFICATION
  Konum: sağ üst (top-right)
  Süre: 3 saniye
  Animasyon: slide-in-right → fade-out
  Türler: success (yeşil), error (kırmızı), info (mavi)

SKELETON LOADING
  Ürün kartları yüklenirken shimmer animasyonu
  Renk: #e0e0e0 → #f0f0f0 → #e0e0e0 (loop)
  Süre: 1.5s

MODAL / DRAWER
  Backdrop: rgba(0,0,0,0.5) — fade-in 0.2s
  Modal: scale(0.9)→scale(1) + fade-in 0.25s
  Drawer: translateX(100%)→translateX(0) 0.3s ease

CAROUSEL / SLIDER
  Swipe gestürü destekli
  Auto-play: 4 saniye
  Transition: slide (0.4s ease)
  Dots navigation

ACCORDION (Filtre, FAQ)
  max-height: 0→auto
  transition: max-height 0.3s ease
```

---

## 🔧 7. REACT NATIVE / EXPO UYGULAMA MİMARİSİ

### Klasör Yapısı (Önerilen)

```
haradan-fe/
├── app/                          # Expo Router sayfaları
│   ├── (tabs)/
│   │   ├── index.tsx             # 🏠 Home
│   │   ├── catalog.tsx           # 🛍️ Kategori/Liste
│   │   ├── cart.tsx              # 🛒 Sepet
│   │   ├── favorites.tsx         # ♡ Favoriler
│   │   └── profile.tsx           # 👤 Profil
│   ├── product/
│   │   └── [id].tsx              # 📦 Ürün Detay
│   ├── auth/
│   │   ├── login.tsx             # 🔐 Giriş
│   │   └── register.tsx          # 📝 Kayıt
│   ├── checkout/
│   │   ├── index.tsx             # 💳 Ödeme
│   │   └── success.tsx           # ✅ Onay
│   └── _layout.tsx
│
├── components/
│   ├── ui/                       # Temel UI bileşenleri
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── SkeletonLoader.tsx
│   ├── product/
│   │   ├── ProductCard.tsx       # Ürün kartı
│   │   ├── ProductGrid.tsx       # Grid layout
│   │   ├── ProductGallery.tsx    # Detay galeri
│   │   └── RatingStars.tsx       # Yıldız rating
│   ├── home/
│   │   ├── HeroBanner.tsx        # Ana slider
│   │   ├── CategoryBar.tsx       # Kategori şeridi
│   │   ├── HotDeals.tsx          # Sıcak fırsatlar
│   │   └── CountdownTimer.tsx    # Geri sayım
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   └── MiniCart.tsx
│   ├── filter/
│   │   ├── FilterDrawer.tsx
│   │   ├── PriceRangeSlider.tsx
│   │   └── FilterCheckbox.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── SearchBar.tsx
│       ├── Footer.tsx
│       └── Breadcrumb.tsx
│
├── constants/
│   ├── Colors.ts                 # Renk sistemi (yukarıdaki tokenlar)
│   ├── Typography.ts             # Font scale
│   ├── Spacing.ts                # Boşluk sistemi
│   └── Breakpoints.ts            # Responsive kurallar
│
├── hooks/
│   ├── useCart.ts                # Sepet state yönetimi
│   ├── useWishlist.ts            # Favoriler
│   ├── useProducts.ts            # Ürün veri yönetimi
│   ├── useFilter.ts              # Filtre state
│   └── useSearch.ts              # Arama
│
├── store/                        # Zustand / Redux store
│   ├── cartStore.ts
│   ├── userStore.ts
│   └── filterStore.ts
│
├── services/                     # API servisleri
│   ├── api.ts                    # Axios instance
│   ├── productService.ts
│   ├── cartService.ts
│   └── authService.ts
│
└── docs/
    └── CARTZILLA_CANVAS.md       # Bu dosya
```

---

## 📋 8. UYGULAMA GELİŞTİRME SIRASI (Sprint Planı)

### Sprint 1 — Temel Altyapı
```
✅ 1. Design Token'ları tanımla (Colors, Typography, Spacing)
✅ 2. Temel UI bileşenleri oluştur (Button, Badge, Input, Card)
✅ 3. Header & SearchBar bileşeni
✅ 4. Navigation yapısını kur (Expo Router tabs)
```

### Sprint 2 — Home Page
```
✅ 5. HeroBanner / Carousel slider
✅ 6. CategoryBar (yatay scroll)
✅ 7. ProductCard bileşeni (tüm varyantlarıyla)
✅ 8. CountdownTimer
✅ 9. Home sayfasını birleştir
```

### Sprint 3 — Catalog & Filter
```
✅ 10. ProductGrid (3/4 kolon)
✅ 11. FilterDrawer (sidebar/bottom sheet)
✅ 12. PriceRangeSlider
✅ 13. Sort & Toolbar
✅ 14. Pagination
```

### Sprint 4 — Product Detail
```
✅ 15. ImageGallery (thumbnail + main)
✅ 16. Varyant seçici (renk, depolama)
✅ 17. Quantity selector
✅ 18. Tab bileşeni (açıklama/özellik/yorum)
✅ 19. Rating & Reviews
```

### Sprint 5 — Cart & Checkout
```
✅ 20. CartItem bileşeni
✅ 21. CartSummary
✅ 22. Kupon kodu
✅ 23. Checkout adımları (stepper)
✅ 24. Ödeme formu
```

### Sprint 6 — Auth & Hesap
```
✅ 25. Login / Register ekranları
✅ 26. Dashboard
✅ 27. Siparişlerim
✅ 28. Adreslerim
```

---

## 🎯 9. KRITIK TASARIM KURALLARI

```
1. RENK TUTARLIĞI
   → Primary turuncu (#fe6a00) SADECE CTA butonu, badge, aktif state için.
   → Başka renkte CTA butonu kullanma.

2. BEYAZ ALAN (Whitespace)
   → Kartlar arası minimum 16px gap.
   → Section başlıkları ile içerik arası minimum 24px.

3. GÖRSEL ORANLAR
   → Ürün görselleri: 1:1 (kare) aspect ratio — zorunlu.
   → Hero banner: 16:6 oran (desktop), 4:3 (mobile).
   → Category ikon: 64x64px, circle içinde.

4. TİPOGRAFİ HİYERARŞİSİ
   → Bir sayfada MAX 3 farklı font boyutu kullan.
   → Fiyat her zaman bold + primary renk.
   → Strik fiyat (eski fiyat): line-through + secondary renk.

5. BUTON KURALLARI
   → Primary buton: turuncu bg, beyaz text, pill (50px radius).
   → Secondary buton: outline, border #e3e6ef.
   → Icon buton: circle, 40x40px minimum touch target.
   → Disabled state: %50 opacity.

6. BADGE KURALLARI
   → İndirim: kırmızı (#ef4444) — sol üst köşe.
   → Yeni: mavi (#3b82f6) — sağ üst köşe.
   → Stok Yok: gri overlay, %70 opacity.

7. ANIMATION PERFORMANCE
   → Sadece transform ve opacity animate et (GPU hızlandırma).
   → layout-affecting props (width, height, margin) animate etme.

8. ACCESSIBILITY
   → Dokunulabilir alanlar minimum 44x44px.
   → Renk kontrastı minimum 4.5:1 (WCAG AA).
   → Loading state'lerde skeleton göster, spinner değil.
```

---

## 🔗 10. REFERANS KAYNAKLAR

```
Template Kaynağı:
  https://cartzilla-html.createx.studio/home-electronics.html

İkon Kütüphanesi:
  @expo/vector-icons (Ionicons, MaterialIcons)
  https://icons.expo.fyi

Görsel Placeholder:
  https://picsum.photos / https://placehold.co

Renk Araçları:
  https://coolors.co
  https://colorhunt.co

Tipografi:
  Google Fonts — Inter
  https://fonts.google.com/specimen/Inter

Animasyon:
  react-native-reanimated
  react-native-gesture-handler

State Yönetimi:
  Zustand (önerilen)
  https://docs.pmnd.rs/zustand

UI Kütüphanesi (opsiyonel):
  NativeBase / Tamagui / Gluestack UI
```

---

> 📌 **Not:** Bu dosya, projenin tasarım referans noktasıdır.  
> Herhangi bir bileşen geliştirilmeden önce bu canvas'a bakılmalı,  
> renk, spacing ve kurallardan sapılmamalıdır.  
> Son güncelleme: Ağustos 2026
