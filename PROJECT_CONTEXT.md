# ELITE WORLD — وثيقة تسليم المشروع

> وثيقة مرجعية لحساب Codex أو مطور جديد سيكمل العمل من المستودع الحالي.
> آخر تدقيق فعلي للكود: 5 يوليو 2026.
> الفرع المدقق: `main`.
> خط الأساس قبل Commit التوثيق: `36f5e74c894cf5fd5e9b35d0fb56b83caa9e5e41`.
> لا يحتوي هذا الملف على كلمات مرور أو مفاتيح أو قيم Environment Variables أو بيانات عملاء.

## 1. ملخص تنفيذي

ELITE WORLD متجر وكتالوج B2B عربي لمعدات المطاعم والمخابز والكافيهات والتبريد والستانلس وتجهيز المشاريع. التطبيق مبني بـNext.js App Router وTypeScript وPrisma/PostgreSQL، ويدعم RTL والجوال ولوحة إدارة، حسابات عملاء، تحقق البريد، الكتالوج، المخزون، السلة، الطلب المباشر، عروض الأسعار، التتبع، المدفوعات اليدوية/المعيارية، إدارة المحتوى، المدونة وSEO.

المشروع منشور فعليًا ويعمل على نطاق `eliteworldsa.com` عبر Vercel. قاعدة البيانات على Neon PostgreSQL، صور الرفع على Vercel Blob، ورسائل رموز العملاء عبر Resend. أكد المالك أثناء التسليم أن تحقق البريد أصبح يعمل بعد تصحيح إعداد المرسل، كما سبق له اختبار حساب عميل وطلب مباشر وطلب عرض سعر ووصولها إلى لوحة الإدارة بنجاح.

هذه ليست نسخة جديدة من المشروع. المصدر المقصود دائمًا هو مستودع GitHub الحالي:

- المستودع: `abdulrhman666/elite-world`
- الفرع التشغيلي الحالي: `main`
- Vercel ينشر من هذا المستودع والفرع.

## 2. الحالة الحالية باختصار

### منجز ويعمل في الكود

- واجهة عربية RTL متجاوبة بهوية ELITE WORLD الحالية.
- كتالوج Prisma فقط وقت التشغيل؛ لا يوجد fallback تجريبي للمنتجات.
- منتجات، أقسام، علامات، صور متعددة، مواصفات، مخزون وSEO.
- بحث محلي عربي وفلاتر وترتيب وبطاقات منتجات موحدة.
- حسابات عملاء B2B بالبريد وكلمة المرور ورقم الهاتف والملف الشخصي.
- تحقق البريد برمز من 6 أرقام واستعادة كلمة المرور بالبريد.
- سلة دائمة في قاعدة البيانات للعميل المسجل، وسلة ذاكرة مؤقتة للزائر.
- طلب مباشر يتطلب حسابًا مسجلًا، ويتحقق من السعر والمخزون ويخصم الكمية داخل Transaction.
- طلب عرض سعر متاح للزائر أو العميل المسجل.
- أرقام طلبات وعروض ورموز تتبع عشوائية لا تكشف رقم السجل.
- صفحة تتبع آمنة تعرض البيانات العامة فقط، مع تاريخ الحالة والشحن والدفع.
- لوحة إدارة بجلستها المستقلة وصلاحيتي `SUPER_ADMIN` و`ADMIN`.
- إدارة المنتجات والأقسام والعلامات والصور والمستخدمين والمحتوى والمدونة وSEO والإعدادات.
- إدارة عروض الأسعار وتحويل العرض إلى طلب وإدارة حالات الطلب والشحن.
- رفع فاتورة خارجية PDF ومدفوعات يدوية ومرفقات.
- طبقة دفع ديناميكية Provider-agnostic مع Webhook idempotency.
- SiteSettings للهوية وبيانات الشركة والرئيسية والتواصل والفوتر والشحن.
- Metadata وCanonical وOpen Graph وSitemap وRobots وJSON-LD.
- Cache للكتالوج والإعدادات وPagination في جداول الإدارة.

### أشياء ليست ميزة مكتملة أو ليست مفعلة تلقائيًا

- لا يوجد تسجيل دخول Google أو Apple.
- لا يوجد OTP عبر SMS؛ التحقق الحالي عبر البريد فقط، ورقم الهاتف إلزامي للتواصل لكنه غير موثق آليًا.
- لا يوجد إصدار فاتورة ضريبية من الموقع ولا ربط زاتكا.
- لا يمكن افتراض وجود بوابة دفع مالية حقيقية مفعلة؛ توجد بنية ديناميكية، والتفعيل يعتمد على إعداد مزود صالح واختباره.
- `/orders` و`/payments` صفحتان إرشاديتان؛ سجل العميل الفعلي يظهر داخل `/account` والتتبع.
- `/compare` صفحة Placeholder وليست نظام مقارنة فعليًا.
- `/favorites` يحوّل إلى `/account` لأن المفضلة مدمجة في الحساب.
- مساعد SEO بالذكاء الاصطناعي اختياري بالكامل.

## 3. مبادئ مصدر الحقيقة

1. PostgreSQL عبر Prisma هو مصدر الحقيقة للكتالوج والعملاء والتجارة والمحتوى والإعدادات.
2. `data/import/elite_world_products_catalog.csv` وملفات `data/` قوالب استيراد/استعادة وليست مصدر Runtime للمتجر.
3. عند تعطل قاعدة البيانات، تعرض الصفحات حالة فارغة أو غير متاحة؛ لا تُحقن بيانات Demo مكان البيانات الحقيقية.
4. واجهة المتجر لا تقرأ Prisma مباشرة؛ تمر قراءة الكتالوج عبر `lib/catalog/service.ts` ثم `lib/catalog/prisma-repository.ts`.
5. كل منطق الدفع يمر عبر `lib/payments/payment.service.ts` ومزود موحد.
6. كل رفع صور يمر عبر Storage Adapter في `lib/storage/`.
7. إعدادات الموقع تأتي من سجل `SiteSettings` واحد، مع قيم أمان محلية عند غياب قاعدة البيانات.

## 4. التقنيات والإصدارات الأساسية

| المجال | التقنية الحالية |
| --- | --- |
| Framework | Next.js `16.2.9`، App Router، Server Components وServer Actions |
| UI | React `19.2.7`، Tailwind CSS `4.3.1`، Lucide React |
| اللغة | TypeScript `5.9.3` |
| قاعدة البيانات | PostgreSQL على Neon |
| ORM | Prisma `7.8.0` مع `@prisma/adapter-pg` و`pg` |
| الصور | `next/image`، `sharp`، Vercel Blob، WebP |
| البريد | Resend عبر REST `fetch` من السيرفر، دون SDK |
| الاختبارات | Vitest `4.1.9` |
| الجودة | ESLint 9، Prettier 3 |
| الخطوط | IBM Plex Sans Arabic وManrope محليًا من الحزم |

التشغيل والبناء يستخدمان Webpack صراحة في `package.json`:

- `next dev --webpack`
- `next build --webpack`

لا تغيّر ذلك إلى Turbopack دون اختبار منفصل، لأن القرار الحالي جزء من تثبيت التشغيل السابق.

## 5. صورة Architecture

المسار العام للقراءة:

`App Route / Server Component → Service → Prisma Repository/Prisma Client → Neon PostgreSQL`

المسار العام للكتابة:

`Form/API → Server Action/Route → التحقق من الجلسة والمدخلات → Service → Prisma Transaction → revalidatePath/updateTag`

المسار العام للصور:

`Admin Form → Storage Adapter → WebP بواسطة sharp → Vercel Blob أو Local Adapter → ProductImage/Category.image في Prisma`

المسار العام للدفع:

`Admin/API/Order → PaymentService → Provider Factory → HTTP Provider → مزود خارجي ديناميكي`

## 6. بنية المجلدات

| المسار | وظيفته |
| --- | --- |
| `app/` | صفحات App Router، API Routes، Server Actions، Metadata، Sitemap وRobots |
| `components/` | مكونات الواجهة والإدارة والسلة والكتالوج والتجارة وSEO |
| `lib/` | طبقات الخدمات والمستودعات والمصادقة والدفع والتخزين والأمان |
| `prisma/schema.prisma` | نموذج قاعدة البيانات الحالي |
| `prisma/migrations/` | جميع Migrations المتراكمة؛ لا تحذف أو تعيد كتابتها |
| `prisma/seed.ts` | استعادة/تعبئة غير تدميرية عبر `restoreExistingProjectData`؛ لا تشغله على الإنتاج بلا موافقة |
| `data/` | CSV وقوالب استعادة ومحتوى افتراضي مساعد؛ ليس مصدر Runtime للكتالوج |
| `config/site.ts` | هوية وقيم أمان وروابط تنقل وافتراضات الموقع |
| `public/` | الشعار والصور المحلية والأصول الحالية |
| `scripts/` | أدوات استيراد CSV |
| `tests/project.test.ts` | اختبارات الوحدات والتكامل الخفيف الأساسية |
| `types/` | أنواع الكتالوج والمحتوى والإعدادات وSEO |
| `reports/` | تقارير الاستيراد والتدقيق السابقة |

## 7. أهم الملفات ووظيفتها

### التشغيل والهيكل

- `app/layout.tsx`: Layout العام، RTL، Metadata الأساسية، SiteShell وCartProvider.
- `components/layout/site-shell.tsx`: يجمع الهيدر والفوتر والتنقل وواتساب.
- `components/layout/header.tsx`: هيدر سطح المكتب والجوال والقائمة.
- `app/globals.css`: نظام CSS العام والهوية والمساعدة على التجاوب.
- `next.config.ts`: Strict mode، Image formats/remote Blob host، وحد Server Actions.
- `proxy.ts`: يحمي `/account/:path*` بجلسة العميل. حماية الإدارة تتم داخل Layout الإدارة.

### الكتالوج والمتجر

- `lib/catalog/service.ts`: واجهة قراءة الكتالوج، Prisma-only، cache لمدة 300 ثانية مع tag `catalog`.
- `lib/catalog/prisma-repository.ts`: استعلامات Prisma المختارة وتحويل السجلات إلى أنواع العرض.
- `lib/catalog.ts`: البحث المحلي، التطبيع العربي، الفلاتر والأسعار.
- `app/shop/page.tsx`: صفحة المتجر.
- `app/search/page.tsx`: البحث، وهو `noindex`.
- `app/products/[slug]/page.tsx`: تفاصيل المنتج والصور والمواصفات والمشابهات وCTA.
- `app/categories/page.tsx` و`app/categories/[slug]/page.tsx`: الأقسام والمنتجات التابعة.
- `components/ui/product-card.tsx`: بطاقة المنتج الموحدة.
- `components/catalog/catalog-explorer.tsx`: البحث والفلاتر والترتيب والـQuery Parameters.
- `components/home/categories-section.tsx` و`products-section.tsx`: أقسام ومنتجات الرئيسية من نفس البيانات.

### الإدارة

- `app/admin/(protected)/layout.tsx`: يمنع الدخول دون جلسة إدارة.
- `components/admin/admin-shell.tsx`: Sidebar، التنقل، إخفاء صفحات الحساسية عن `ADMIN`.
- `lib/admin/auth.ts`: حساب البيئة `SUPER_ADMIN` وحسابات Prisma ذات الأدوار، وجلسة 8 ساعات.
- `app/admin/actions.ts`: CRUD الكتالوج والصور والإعدادات والمحتوى وSEO مع إعادة التحقق.
- `app/admin/commerce-actions.ts`: حالات العروض والطلبات والشحن والفواتير والمدفوعات.
- `app/admin/user-actions.ts`: إدارة المستخدمين والأدوار، محمية بـ`SUPER_ADMIN`.
- `app/admin/payment-settings-actions.ts`: إدارة مزودي الدفع، محمية بـ`SUPER_ADMIN`.
- `lib/admin/catalog-admin.ts`: استعلامات نماذج وقوائم الإدارة.
- `lib/admin/pagination.ts`: Pagination موحد؛ الحجم الإداري الحالي 30 سجلًا.

### العملاء والمصادقة

- `app/auth/actions.ts`: التسجيل، الدخول، التحقق، إعادة إرسال الرمز، الاستعادة، تغيير كلمة المرور والملف الشخصي.
- `lib/auth/customer-auth.ts`: Cookie جلسة العميل `httpOnly` لمدة 30 يومًا.
- `lib/admin/session-token.ts` و`lib/auth/session-token.ts`: توقيع والتحقق من Tokens.
- `lib/auth/password.ts`: تخزين كلمات المرور بـ`scrypt` وSalt عشوائي ومقارنة timing-safe.
- `lib/auth/email-codes.ts`: إصدار/التحقق من رموز البريد وحدود المعدل والمحاولات.
- `lib/email/service.ts`: إرسال الرمز عبر Resend.
- `app/account/page.tsx`: الملف الشخصي، تغيير كلمة المرور، الطلبات، إعادة الطلب والمفضلة.
- `lib/account/service.ts`: قراءة بيانات الحساب بملكية المستخدم وPagination.

### السلة والتجارة

- `components/cart/cart-provider.tsx`: حالة السلة في الواجهة ومزامنة سلة العميل المسجل.
- `app/api/cart/route.ts`: قراءة وتعديل سلة Prisma للمستخدم الحالي فقط.
- `lib/cart/service.ts`: التحقق من المنتج والمخزون وحفظ `Cart`.
- `app/checkout/actions.ts`: اختيار Order أو Quote والتحقق من الحساب والمدخلات.
- `app/quote/actions.ts`: إرسال عرض السعر.
- `lib/commerce/public-service.ts`: إنشاء العروض والطلبات والتتبع وخصم المخزون.
- `lib/commerce/domain.ts`: أرقام المراجع وTokens وتطبيع العناصر ومنع التحويل المكرر.
- `lib/commerce/shipping.ts`: اختيار مدة التوصيل بحسب المدينة وإعدادات الموقع.
- `lib/admin/commerce-admin.ts`: قوائم الإدارة، تحويل العرض، الحالات، الفواتير والمدفوعات.

### الدفع

- `lib/payments/payment.service.ts`: المصدر الوحيد لمنطق Payment وحالة Order ومبالغ الدفع والWebhook.
- `lib/payments/providers/IPaymentProvider.ts`: العقد الموحد للمزود.
- `lib/payments/providers/provider.factory.ts`: يقرأ المزود الفعال من Prisma.
- `lib/payments/providers/http.provider.ts`: Adapter HTTP عام بمخرجات typed وtimeout.
- `lib/payments/settings.ts`: مزودات الدفع الديناميكية وتشفير مفاتيحها وإدارة المزود الفعال.
- `app/api/payments/create/route.ts` و`verify/route.ts`: محميان بـ`SUPER_ADMIN` وفحص Origin والحجم.
- `app/api/payments/webhook/route.ts`: Webhook عام يمرر التحقق للمزود ويعتمد event ID لمنع التكرار.

### الصور والملفات

- `lib/storage/storage-adapter.ts`: الواجهة والتحقق من JPG/PNG/WebP وPDF وحدود الحجم.
- `lib/storage/index.ts`: يختار Vercel Blob عند وجود إعداد Blob وإلا Local.
- `lib/storage/local-storage-adapter.ts`: WebP محلي وصور/فواتير/مرفقات محلية.
- `lib/storage/vercel-blob-storage-adapter.ts`: صور عامة على Blob؛ يحافظ على الواجهة نفسها.
- `components/admin/product-image-uploader.tsx`: رفع متعدد ومعاينة.
- `components/admin/product-media-manager.tsx`: Alt، الرئيسية، الترتيب والحذف.
- `lib/admin/media-admin.ts`: مكتبة الوسائط والبحث والارتباطات.

### الإعدادات والمحتوى وSEO

- `lib/site-settings.ts`: قراءة سجل الإعدادات الوحيد مع cache وfallback آمن.
- `lib/site-settings-defaults.ts`: الافتراضات، وليس بديلًا لبيانات الكتالوج.
- `app/[slug]/page.tsx`: صفحات المحتوى المدارة و`contact` والصفحات البسيطة.
- `lib/content-pages.ts`: قراءة `ContentPage` من Prisma فقط.
- `data/content-pages.ts`: قوالب استعادة/تهيئة للمحرر، لا تُعرض مباشرة وقت التشغيل.
- `lib/blog/service.ts`: مقالات منشورة وإدارة مع Pagination.
- `lib/seo/metadata.ts`: Metadata وCanonical وOpen Graph والقيم التلقائية.
- `app/sitemap.ts`: Sitemap ديناميكي للصفحات والأقسام والمنتجات والمقالات.
- `app/robots.ts`: حجب الإدارة والحساب والمصادقة والسلة وCheckout والبحث والتتبع.
- `components/seo/json-ld.tsx`: إخراج JSON-LD آمن من كسر وسم Script.
- `lib/ai/seo-assistant.ts`: اقتراحات اختيارية فقط، لا تحفظ تلقائيًا.

## 8. خريطة المسارات الحالية

### عامة وتجارية

| المسار | الحالة والوظيفة |
| --- | --- |
| `/` | رئيسية Search-first مع أقسام ومنتجات من Prisma وإعدادات SiteSettings |
| `/shop` | متجر فعلي ببحث وفلاتر وترتيب |
| `/search` | نتائج بحث محلية؛ `noindex` |
| `/categories` | شبكة الأقسام |
| `/categories/[slug]` | تفاصيل القسم ومنتجاته |
| `/products/[slug]` | صفحة المنتج الكاملة وJSON-LD |
| `/cart` | السلة والتحقق من المخزون |
| `/checkout` | طلب مباشر أو عرض سعر |
| `/checkout/success` | نتيجة الطلب ورمز المتابعة |
| `/quote` و`/quote/success` | طلب عرض سعر مستقل |
| `/track` و`/track/[token]` | متابعة آمنة، `noindex` |
| `/account` | حساب العميل وطلباته ومفضلته وتغيير كلمة المرور |
| `/favorites` | تحويل إلى `/account` |
| `/orders` و`/payments` | صفحات إرشادية للمسار والتتبع |
| `/blog` و`/blog/[slug]` | المدونة والمقال المنشور |
| `/about`, `/brands`, `/projects`, `/project-solutions`, `/stainless`, `/maintenance` | `ContentPage` من Prisma |
| `/contact` | بيانات `SiteSettings` |
| `/compare` | Placeholder فقط، غير مكتمل كنظام مقارنة |

### مصادقة العميل

- `/auth/register`
- `/auth/verify`
- `/auth/login`
- `/auth/forgot-password`
- `/auth/reset-password`

### الإدارة

- `/admin/login`
- `/admin`
- `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit`
- `/admin/categories`, `/admin/brands`, `/admin/media`
- `/admin/customers`, `/admin/customers/[id]`
- `/admin/pages`, `/admin/pages/[slug]`
- `/admin/settings`, `/admin/settings/payments`
- `/admin/seo`
- `/admin/blog`, `/admin/blog/new`, `/admin/blog/[id]/edit`
- `/admin/quotes`, `/admin/quotes/[id]`
- `/admin/orders`, `/admin/orders/[id]`
- مسارات تنزيل الفاتورة ومرفق الدفع تحت الطلب ومحمية بجلسة الإدارة.

### API

- `GET/POST /api/cart`
- `POST /api/payments/create`
- `POST /api/payments/verify`
- `POST /api/payments/webhook`

## 9. نظام العملاء والتحقق بالبريد

### التسجيل

- الحقول: الاسم، المنشأة اختياري، البريد، الهاتف، المدينة، العنوان اختياري، وكلمة مرور لا تقل عن 10 أحرف.
- الهاتف إلزامي للتواصل لكنه لا يستقبل OTP.
- يُنشأ أو يُحدّث حساب غير موثق، ثم يرسل رمز بريد من 6 أرقام.
- لا يبدأ Session العميل قبل نجاح التحقق.

### الرمز

- الغرض إما `VERIFY_ACCOUNT` أو `RESET_PASSWORD`.
- صالح 10 دقائق.
- انتظار 60 ثانية قبل إعادة الإرسال.
- حد أقصى 5 رموز في الساعة لنفس المستخدم والغرض.
- حد أقصى 5 محاولات للرمز.
- لا يخزن الرمز نفسه؛ يخزن HMAC مشتقًا باستخدام `AUTH_SECRET`.
- الرمز يستهلك مرة واحدة داخل Transaction.

### الحالة التشغيلية عند التسليم

- أكد المالك في 5 يوليو 2026 أن إعداد البريد صُحح وأن التحقق يعمل فعليًا.
- اسم متغير المرسل الذي يقرأه الكود هو `EMAIL_FROM` بالضبط. الاسم `EMAIL_FORM` خطأ ولن يقرأه التطبيق.
- لا تسجل قيمة المرسل أو مفتاح Resend في Git أو ملفات التوثيق.

### الجلسات وكلمات المرور

- العميل: Cookie `httpOnly`, `sameSite=lax`, آمنة في Production، مدة 30 يومًا.
- الإدارة: Cookie مستقلة، `httpOnly`, `sameSite=strict`, مدة 8 ساعات.
- كلمات المرور: `scrypt` مع Salt عشوائي؛ لا تخزن كنص.
- تغيير كلمة المرور داخل الحساب يتطلب الكلمة الحالية.
- الاستعادة خارج الحساب تستخدم رمز البريد.

## 10. الإدارة والصلاحيات

### `SUPER_ADMIN`

- كل صلاحيات الإدارة.
- إدارة المستخدمين والأدوار.
- إعدادات الموقع الحساسة.
- إعدادات مزودي الدفع والمفاتيح المشفرة.
- API إنشاء/تحقق الدفع.

### `ADMIN`

- إدارة الكتالوج والطلبات والعروض والمحتوى والمدونة وSEO حسب Server Actions الحالية.
- لا يرى روابط إعدادات الموقع/الدفع الحساسة في Sidebar.
- لا يستطيع تجاوز المنع من API لأن التحقق يتم على السيرفر، وليس في الواجهة فقط.

يمكن الدخول كـ`SUPER_ADMIN` بحساب Environment مضبوط، أو بحساب `User` في Prisma له `role`. حساب البيئة لا يخزن كلمة مروره في قاعدة البيانات.

## 11. الكتالوج والبحث والمخزون

- `Product.slug` و`Product.sku` فريدان.
- القوائم تجلب حقولًا مختارة فقط؛ التفاصيل تجلب الصور والمواصفات والمحتوى الكامل.
- حالة العرض مشتقة عمليًا من `stockQuantity`: أكبر من صفر = متوفر، صفر = حسب الطلب.
- البحث يدعم العربية والإنجليزية وSKU والموديل والعلامة والقسم، مع معالجة بسيطة للألف والمسافات.
- ترتيب الأكثر مبيعًا يعتمد على عدد `OrderItem`، وليس حقلًا يدويًا.
- المنتج بلا سعر يعرض «اطلب عرض سعر» ولا يُسمح بطلب مباشر له.
- الطلب المباشر يخصم المخزون بشرط `stockQuantity >= quantity` داخل Transaction، ثم يحول الحالة إلى `ON_REQUEST` عند الصفر.
- صور المنتج الرئيسية والإضافية في `ProductImage`، مع Alt عربي وترتيب وعلامة رئيسية.
- صورة القسم في `Category.image`. المستودع قد يستخدم أول صورة منتج للقسم بدل رسوم Blueprint القديمة عند العرض.

ملاحظة الأرقام: اختبارات مصدر CSV الحالي تتوقع 214 منتجًا و9 أقسام و32 علامة. قاعدة الإنتاج قابلة للتعديل من الإدارة وقد تحتوي عددًا مختلفًا؛ لا تستخدم أرقام CSV كحقيقة لحظية للإنتاج.

## 12. السلة وCheckout والعروض والطلبات

### السلة

- المستخدم المسجل: جدول `Cart` في Prisma ومزامنة عبر `/api/cart`.
- الزائر: حالة React مؤقتة في الذاكرة؛ لا يوجد اعتماد على `localStorage` في الكود الحالي.
- كل تعديل يتحقق من المنتج والمخزون على السيرفر للمستخدم المسجل.

### الطلب المباشر

- يتطلب جلسة عميل.
- يتطلب سعرًا لكل المنتجات ومخزونًا كافيًا.
- يحفظ Snapshot للاسم وSKU والموديل والسعر والكمية في `OrderItem`.
- ينشئ Quote داخليًا للربط ثم Order وسجل حالة أولي.
- يمسح سلة المستخدم بعد نجاح Transaction.
- يحاول تهيئة Payment إن وجد مزود فعال؛ فشل تهيئة المزود لا يلغي إنشاء الطلب.

### عرض السعر

- لا يتطلب حسابًا.
- يحفظ بيانات العميل الأساسية وعناصر Snapshot.
- يمكن للإدارة تغيير حالته وتحويله مرة واحدة فقط إلى Order.

### التتبع

- Token عشوائي آمن، وليس رقم قاعدة البيانات.
- يعرض رقم الطلب/العرض والحالة والمنتجات والكميات وملاحظات العميل.
- للطلب يعرض حالة الدفع والمدفوع والمتبقي ومدة التوصيل وشركة الشحن ورقم التتبع والتاريخ.
- لا يعرض الملاحظات الداخلية أو البريد أو الهاتف أو معرفات قاعدة البيانات.
- Token غير صالح ينتج 404.

## 13. الدفع

النظام لا يحتوي Stripe SDK أو Moyasar SDK. التصميم ديناميكي:

- `PaymentProvider` في Prisma يحتوي الاسم، endpoint، مفاتيح مشفرة وحالة التفعيل.
- يسمح بمزود فعال واحد في كل مرة.
- المفاتيح تشفر بـAES-256-GCM باستخدام مفتاح مشتق من `AUTH_SECRET`.
- تغيير `AUTH_SECRET` بعد حفظ مفاتيح المزود يمنع فكها، إضافة إلى إبطال الجلسات.
- Endpoint يجب أن يكون HTTPS عامًا؛ يتم رفض localhost والشبكات الخاصة والـcredentials داخل URL.
- `PaymentService` يزامن Payment مع Order:
  - `PENDING` → `PENDING_PAYMENT`
  - `PAID` → `CONFIRMED`
  - `FAILED`/`CANCELLED` → `CANCELLED`
- Webhook يمنع تكرار الحدث باستخدام `(provider, webhookEventId)`.
- توجد مدفوعات يدوية من الإدارة مع تحديث المدفوع/المتبقي.

لا تعتبر الدفع الحقيقي مفعّلًا بمجرد وجود الكود. قبل الإنتاج المالي يلزم Sandbox مستقل، تحقق توقيع Webhook لدى المزود، اختبار Idempotency، وسياسة Refund واضحة.

## 14. قاعدة البيانات والعلاقات

المصدر: `prisma/schema.prisma`. الجداول الأساسية:

| النموذج | الغرض والعلاقات المهمة |
| --- | --- |
| `Category` | قسم فريد بالـslug؛ له منتجات وSEO وصورة وترتيب وأقسام فرعية JSON |
| `Brand` | علامة فريدة بالاسم؛ لها منتجات |
| `Product` | المنتج والمخزون والسعر والمحتوى وSEO؛ يتبع Category وBrand |
| `ProductImage` | صور المنتج؛ حذف المنتج يحذف سجلاتها Cascade |
| `ProductSpecification` | مواصفات مرتبة وفريدة لكل Product/label |
| `SiteSettings` | سجل إعدادات واحد بالمعرف 1 |
| `PageSeo` | SEO للصفحات العامة؛ `path` مفتاح أساسي |
| `SlugRedirect` | تحويل دائم من Slug قديم إلى جديد |
| `ContentPage` | صفحات المحتوى المدارة وأقسامها JSON |
| `User` | حساب العميل/المدير؛ mapped فعليًا إلى جدول PostgreSQL باسم `Customer` للحفاظ على البيانات القديمة |
| `EmailCode` | رموز تحقق/استعادة hashed مع انتهاء ومحاولات واستهلاك |
| `WishlistItem` | مفضلة فريدة لكل User/Product |
| `Cart` | عنصر سلة فريد لكل User/Product |
| `PaymentSettings` | سجل إعداد دفع قديم/توافقي موجود في الـSchema |
| `PaymentProvider` | المزود الديناميكي الفعال ومفاتيحه المشفرة |
| `BlogPost` | المقالات والنشر وSEO |
| `Quote` | عرض السعر والعميل وToken وحالة وعناصر وربط Order اختياري |
| `QuoteItem` | Snapshot منتج العرض مع relation اختيارية للمنتج |
| `Order` | الطلب والعميل والشحن والدفع وToken؛ له عناصر وتاريخ وInvoice وPayment |
| `OrderItem` | Snapshot منتج الطلب، مع relation اختيارية للمنتج |
| `OrderStatusHistory` | Timeline حالات الطلب |
| `Payment` | One-to-one مع Order لأن `orderId` فريد |
| `Invoice` | One-to-one مع Order؛ ملف PDF خارجي فقط |

Enums المهمة:

- `ProductAvailability`: `IN_STOCK`, `ON_REQUEST`
- `QuoteStatus`: `NEW`, `RESPONDED`, `CANCELLED`
- `OrderStatus`: `NEW`, `PENDING_PAYMENT`, `CONFIRMED`, `IN_PROGRESS`, `READY_TO_SHIP`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`
- `PaymentStatus`: `PENDING`, `PAID`, `FAILED`, `CANCELLED`
- `OrderPaymentStatus`: `UNPAID`, `PARTIALLY_PAID`, `PAID`
- `AdminRole`: `SUPER_ADMIN`, `ADMIN`
- `EmailCodePurpose`: `VERIFY_ACCOUNT`, `RESET_PASSWORD`

### Migrations

المجلد يحوي سلسلة Migrations من إنشاء الكتالوج حتى تحقق البريد. آخر Migration عند التدقيق:

- `prisma/migrations/20260705020000_add_email_verification/migration.sql`

لا تحذف أو تدمج Migrations السابقة. للإنتاج استخدم `prisma migrate deploy` بعد مراجعة SQL، وليس `migrate dev` على قاعدة الإنتاج.

## 15. Environment Variables المطلوبة — أسماء فقط

> القيم موجودة خارج Git في Vercel/بيئات المطور. لا تنقلها إلى هذا الملف.

| الاسم | الحالة | الاستخدام |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | مطلوب في الإنتاج | Canonical وSitemap وروابط الموقع المطلقة |
| `DATABASE_URL` | مطلوب | اتصال Runtime بـNeon PostgreSQL، ويفضل Pooler للتطبيق |
| `DIRECT_URL` | موصى به للـMigration | اتصال مباشر لـPrisma Migrations |
| `AUTH_SECRET` | مطلوب، 32 حرفًا على الأقل | توقيع الجلسات وHMAC رموز البريد وتشفير مفاتيح الدفع |
| `ADMIN_EMAIL` | مشروط | حساب `SUPER_ADMIN` البيئي |
| `ADMIN_PASSWORD` | مشروط، 12 حرفًا على الأقل | حساب `SUPER_ADMIN` البيئي |
| `RESEND_API_KEY` | مطلوب لتسجيل/استعادة العملاء | مصادقة Resend |
| `EMAIL_FROM` | مطلوب للبريد | عنوان المرسل الموثق؛ الاسم الصحيح ليس `EMAIL_FORM` |
| `BLOB_STORE_ID` | يضاف عادة عند ربط Blob | يجعل التطبيق يختار Vercel Blob للصور |
| `BLOB_READ_WRITE_TOKEN` | مشروط حسب إعداد Blob/SDK | مصادقة Blob عند عدم الاعتماد على الربط المُدار |
| `OPENAI_API_KEY` | اختياري | مساعد اقتراح SEO فقط |
| `OPENAI_MODEL` | اختياري | اسم نموذج SEO؛ له افتراض داخل الكود |
| `NODE_ENV` | تديره المنصة | Cookies الآمنة وسلوك Production |

ملاحظة: Vercel قد يضيف متغيرات Blob أخرى تديرها المنصة. لا تعتمد على اسم لا يقرأه الكود، ولا تنسخ قيم أي متغير إلى Git.

## 16. الخدمات الخارجية وكيف ترتبط

### GitHub

- مصدر الكود الحالي: `abdulrhman666/elite-world`.
- `main` هو مصدر نشر Production الحالي.
- لا تنشئ مستودعًا بديلًا أو ترفع نسخة ZIP كبديل للمصدر.

### Vercel

- يبني Next.js وينشر تلقائيًا من GitHub.
- النطاق الحالي مربوط بالمشروع.
- Environment Variables محفوظة في إعداد المشروع.
- يجب إعادة Deploy بعد تغيير Environment Variables.
- الصور البعيدة المسموحة في Next Image تشمل `*.public.blob.vercel-storage.com`.

### Neon

- PostgreSQL الإنتاجي.
- التطبيق يستخدم `@prisma/adapter-pg` مع Pool أقصى 5 Connections في كل Runtime instance.
- `DATABASE_URL` للتطبيق و`DIRECT_URL` للعمليات المباشرة/الـMigration عند توفره.
- لا تعمل `db push` أو `migrate dev` عشوائيًا على Production.

### Resend

- إرسال رموز تحقق الحساب واستعادة كلمة المرور.
- الاتصال Server-side عبر `fetch` إلى Resend API.
- المالك أكد أن النطاق البريدي موثق وأن التدفق يعمل عند التسليم.
- افحص Resend Logs وVercel Runtime Logs عند فشل إرسال جديد، دون طباعة محتوى حساس.

### Vercel Blob

- صور المنتجات والأقسام المرفوعة تحفظ عامة كـWebP.
- الصور تحول بحد أقصى 2400×2400 دون تكبير، جودة WebP 86.
- الأنواع المقبولة JPG/PNG/WebP وحجم الصورة الأقصى 8 MB وفق الاختبارات الحالية.

## 17. نقطة تخزين مهمة

`VercelBlobStorageAdapter` يخزن الصور في Blob، لكنه يفوض حاليًا `saveDocument` و`savePaymentAttachment` إلى `LocalStorageAdapter`. هذا يعني أن فواتير PDF ومرفقات الدفع تُحفظ تحت `.storage/` على قرص Runtime المحلي.

على Vercel القرص غير دائم، لذلك هذه مخاطرة حقيقية قبل الاعتماد التجاري على الفواتير أو إثباتات الدفع. المطلوب مستقبلًا هو توسيع Adapter نفسه ليخزن المستندات في Blob/Storage دائم، من دون تغيير واجهة لوحة الإدارة أو مسارات قاعدة البيانات. لا تنفذ ذلك ضمن مهمة أخرى دون اختبار تنزيل الملفات والصلاحيات والحذف.

## 18. SEO

- كل منتج وقسم يدعم Title، Description، Canonical، Index، OG وAlt.
- `PageSeo` يدير الصفحات العامة.
- القيم الفارغة تستبدل تلقائيًا بقيم من الاسم والوصف والمسار.
- الإدارة والبحث والفلاتر والحساب والسلة والتتبع Noindex حسب المسار.
- Sitemap ديناميكي من Prisma ويشمل الصفحات والفئات والمنتجات والمقالات المنشورة.
- JSON-LD مستخدم للمنظمة والموقع والمنتج وBreadcrumb حسب الصفحات.
- تغيير Slug يمكن أن ينشئ Permanent Redirect في `SlugRedirect`.
- AI اختياري، اقتراح للمراجعة فقط، ولا يحفظ تلقائيًا.

## 19. الأداء والاستقرار

- Prisma Client Singleton في `lib/prisma.ts`؛ لا تنشئ Client آخر داخل Runtime.
- Script الـSeed فقط ينشئ Client مستقلًا ثم يغلقه.
- استعلامات القوائم تستخدم `select` بدل relations كاملة.
- React `cache` يمنع التكرار داخل الطلب، و`unstable_cache` يخزن الكتالوج والإعدادات 300 ثانية.
- Actions الناجحة تستخدم `updateTag` و`revalidatePath` لتحديث الصفحات.
- صفحات الإدارة تستخدم Pagination بدل تحميل كل البيانات.
- الصور تستخدم `next/image` والتحويل إلى WebP.
- Error boundary عام وحالات Loading/Empty موجودة.

## 20. الأمان الحالي

- Cookies `httpOnly` وموقعة، وSecure في Production.
- مقارنة كلمات مرور وجلسات Timing-safe.
- كلمات مرور العملاء hashed بـ`scrypt`.
- مفاتيح مزود الدفع مشفرة بـAES-256-GCM.
- Server Actions الإدارية تستدعي التحقق من الجلسة؛ الإجراءات الحساسة تتطلب `SUPER_ADMIN`.
- API الدفع الإداري يتحقق من الجلسة والدور وOrigin وحجم الطلب.
- إدخال Provider endpoint يمنع شبكات خاصة وCredentials وHTTP غير المشفر.
- Tracking token لا يكشف المعرف ولا يعرض الملاحظات الداخلية.
- PDF يتحقق من MIME/الامتداد والتوقيع `%PDF` والحجم.
- الصور تتحقق من النوع والحجم والمحتوى عبر sharp.

لا تعتبر هذه مراجعة اختراق. قبل إطلاق مالي واسع يلزم مراجعة أمن مستقلة، Rate limiting موزع للـAuth/API، وسياسة مراقبة وتنبيه.

## 21. سجل Git والسياق التاريخي

سجل المستودع المتاح مختصر لأن المشروع رُفع كاملًا بعد تطوير مراحل سابقة. لا يخزن كل النقاشات، لكنه يثبت القرارات التالية:

| Commit | القرار الظاهر |
| --- | --- |
| `e37050d` | رفع المشروع الكامل الحالي بعد محاولات إعداد أولية للمستودع |
| `e9228ff` | إصلاح قائمة الجوال وإضافة تغيير كلمة مرور العميل |
| `540ae55` | نقل صور المنتجات المرفوعة إلى Vercel Blob |
| `563d5c0` | إعادة تصميم بطاقات الأقسام بصور منتجات |
| `c9558fd` | تبسيط صور الأقسام وإضافة أرقام صفحات الإدارة |
| `36f5e74` | تحقق البريد وواجهة متجر أكثر دمجًا |

الـCommits الأقدم في 3 يوليو هي محاولات إعداد/حذف/رفع للمستودع وليست مراحل تطبيق موثوقة. لا تستنتج Architecture منها؛ الكود الحالي و`PROJECT_PROGRESS.md` هما المرجع.

## 22. الفحوص والتقارير الموجودة

- `DATA_SOURCE_AUDIT.md`: خريطة مصادر البيانات، مع ملاحظة أن بعض تفاصيل الصفحات قديمة ويجب ترجيح الكود الحالي.
- `PERFORMANCE_AUDIT.md`: تحسينات الاستعلامات والـcache والـPagination.
- `PRELAUNCH_QA_AUDIT.md`: رحلة كاملة اختُبرت وقتها، 14/14 اختبارًا وBuild ناجح.
- `PRELAUNCH_CHECKLIST.md`: متطلبات أعمال وتشغيل قبل الإطلاق.
- `reports/catalog-import-report.md`: تقرير استيراد CSV.

بعض الوثائق الأقدم تذكر سلة محلية أو أعدادًا تاريخية. عند التعارض، رجّح `prisma/schema.prisma` والكود الحالي وهذه الوثيقة بتاريخها الأحدث.

## 23. المخاطر والملاحظات الحالية

### أولوية عالية

1. **دوام ملفات الفواتير ومرفقات الدفع:** محفوظة محليًا حتى مع Blob، وقد تضيع على Vercel كما شرح القسم 17.
2. **الدفع الحقيقي غير مثبت:** البنية موجودة، لكن لا يوجد في المستودع دليل كافٍ على اعتماد مزود مالي حقيقي واختبار توقيعه وRefund end-to-end.
3. **النسخ الاحتياطي:** يجب التحقق تشغيليًا من Neon Backup/Restore ومن إجراء استعادة مجرب؛ الكود لا يثبت نجاح سياسة النسخ الاحتياطي الخارجية.

### أولوية متوسطة

4. الحسابات تعتمد البريد وكلمة المرور فقط؛ Google/Apple وSMS غير موجودة.
5. Rate limiting لرموز البريد يعتمد عدّ سجلات PostgreSQL وهو جيد كبداية، لكن تسجيل الدخول نفسه لا يملك Rate limiting موزعًا ظاهرًا.
6. `EMAIL_FROM` اسم حساس للأخطاء الإملائية؛ التدفق يعمل حاليًا، لكن يجب إبقاء Checklist نشر واضحة.
7. ملفات `data/` والـSeed قوية للاستعادة، ولذلك تشغيلها في Production دون مراجعة قد يغيّر بيانات تشغيلية رغم أن المنطق مصمم ليكون غير تدميري.
8. `robots.ts` يبني host من `NEXT_PUBLIC_SITE_URL` عبر `siteConfig`، لذلك قيمة Production الصحيحة ضرورية.

### غير مؤكدة وتحتاج تحققًا خارجيًا

- خطة Neon وحدودها وسياسة النسخ الاحتياطي لا يمكن تأكيدها من المستودع.
- حالة مزود دفع نشط ومفاتيحه لا يمكن ولا يجب قراءتها من Git.
- مراقبة Vercel/Resend والتنبيهات التشغيلية خارج الكود وتحتاج فحص لوحات الخدمات.

## 24. TODO مرتب حسب الأولوية

### P0 — قبل الاعتماد التجاري الكامل

- نقل PDF ومرفقات الدفع إلى Storage دائم من خلال Storage Adapter الحالي.
- تنفيذ تجربة Production موثقة: تسجيل جديد → رمز بريد → دخول → سلة → طلب → إدارة → شحن → تتبع.
- اختبار Forgot Password بالكامل من بريد حقيقي.
- مراجعة Neon Backup/Restore وتجربة استعادة غير مدمرة.
- مراجعة بيانات الشركة والسياسات والأسعار والمخزون والشحن والضمان والخصوصية والشروط.
- إبقاء أي دفع مالي حقيقي غير مفعل حتى اكتمال Sandbox/Webhook/Idempotency/Refund/security review.

### P1 — تشغيل وأمان

- إضافة Rate limiting موزع لمحاولات الدخول والواجهات العامة الحساسة إذا زاد الاستخدام.
- إعداد مراقبة Runtime وDatabase وEmail مع تنبيهات لا تسجل أسرارًا.
- اختبار الصلاحيتين بحسابين منفصلين والتأكد أن `ADMIN` لا يصل لإعدادات الدفع/النظام.
- اختبار حذف/استبدال صور Blob، والصورة المرتبطة بمنتج، واسترجاع الأخطاء.
- تحديث `.env.example` مستقبلًا إذا تغيرت آلية Blob الفعلية، دون وضع قيم.

### P2 — تحسينات مؤجلة وليست مانعًا حاليًا

- Google/Apple OAuth إذا طلبه المالك رسميًا.
- SMS OTP إذا أصبحت الحاجة التجارية تستحق تكلفته وتعقيده.
- نظام مقارنة فعلي بدل Placeholder.
- مراجعة الوثائق القديمة وإزالة العبارات المتقادمة فقط في مهمة توثيق مستقلة.

## 25. تشغيل المشروع محليًا

المتطلبات: Node.js حديث متوافق مع Next 16، npm، واتصال PostgreSQL تجريبي مناسب.

```bash
npm install
npm run prisma:generate
npm run dev
```

استخدم `.env.local` محليًا اعتمادًا على أسماء `.env.example`. لا تطلب القيم من Git ولا تضعها في الرسائل أو Commit.

### قاعدة بيانات جديدة/فرع تجريبي

```bash
npx prisma migrate deploy
```

لا تستخدم `prisma db push` على Production كبديل عشوائي للـMigrations، ولا تستخدم `prisma migrate dev` على قاعدة الإنتاج.

### Seed

```bash
npm run prisma:seed
```

الأمر موجود، لكن **لا تشغله على قاعدة الإنتاج دون طلب صريح ومراجعة `restore-existing-data.ts`**. ملفات CSV والاستعادة ليست خطوة تشغيل يومية.

## 26. أوامر الجودة

شغّلها مرة واحدة في نهاية مهمة كود، لا بعد كل تعديل صغير:

```bash
npm run typecheck
npm run lint
npm test
npm run format:check
npm run build
```

لمهمة Markdown فقط يكفي عادة:

```bash
git diff --check
git status --short
```

مع فحص محتوى الوثيقة بحثًا عن Secrets والتأكد أن الـdiff لا يتضمن كودًا.

## 27. خطة تحقق حسب نوع التعديل

### كتالوج

- المتجر والبحث والفلاتر والترتيب.
- القسم والمنتج وSlug غير صحيح.
- صورة Placeholder والصورة الرئيسية والإضافية.
- السعر الفعلي و«اطلب عرض سعر» والمخزون صفر.

### Auth

- تسجيل جديد وإرسال الرمز والتحقق وإعادة الإرسال وحد المعدل.
- دخول حساب موثق ورفض غير الموثق.
- استعادة كلمة المرور وتغييرها من الحساب.
- جلسة منتهية وخروج.

### تجارة

- كمية أكبر من المخزون تُرفض.
- الطلب المباشر يتطلب حسابًا وسعرًا.
- العرض يعمل دون حساب.
- التحويل من Quote إلى Order مرة واحدة.
- الحالة والشحن والتتبع لا يكشفان بيانات داخلية.

### إدارة

- غير المسجل يُعاد للدخول.
- `ADMIN` لا يرى ولا ينفذ عمليات `SUPER_ADMIN`.
- Pagination والبحث بعد CRUD.
- revalidation يظهر التغيير في المتجر دون Build يدوي.

### ملفات

- صورة مدعومة وصورة تالفة وحجم زائد.
- ترتيب/Alt/رئيسية/حذف.
- PDF صالح وغير صالح وحجم زائد.
- تنزيل الملف بعد نشر Vercel، لا محليًا فقط.

## 28. قواعد ملزمة لأي Codex جديد

1. اقرأ `AGENTS.md` ثم هذا الملف قبل لمس الكود.
2. اعمل من نفس المستودع والفرع؛ لا تنشئ مشروعًا جديدًا ولا تنسخ Architecture.
3. افحص فقط الملفات المرتبطة بالمهمة أولًا.
4. لا تحذف أو تعيد تسمية منتج أو صورة أو Migration أو ملف بيانات دون طلب صريح.
5. لا تشغّل Seed أو Migration مدمرة على Production.
6. لا تستبدل Prisma ببيانات ثابتة ولا تضف fallback تجريبي.
7. أعد استخدام Services وComponents وAdapters الحالية؛ لا تنشئ نظام Auth/Payment/Storage ثانيًا.
8. لا تطبع Environment Variables ولا تسجل Request bodies الحساسة.
9. لا تغير `AUTH_SECRET` أو إعدادات Vercel/Neon/Resend/DNS تلقائيًا.
10. حافظ على الشعار والألوان وRTL والتجاوب ونظام التصميم.
11. عند غياب خدمة خارجية، اعرض حالة آمنة ورسالة واضحة بدل كسر الموقع.
12. راجع `git status` قبل وبعد، واحفظ تغييرات المستخدم غير المرتبطة.
13. نفذ فحصًا مناسبًا للخطر، واذكر ما لم تستطع اختباره بوضوح.
14. لا تدّع أن دفعًا أو بريدًا أو Backup يعمل دون اختبار أو تأكيد موثوق.
15. ارفع التغيير إلى نفس GitHub فقط بعد التأكد أن الـdiff محصور بالمهمة ولا يحوي Secrets.

## 29. تعريف الإنجاز للمهمة القادمة

لا تعتبر أي مهمة مكتملة إلا عندما:

- تحقق الهدف المطلوب فقط.
- لم تتضرر رحلة المتجر أو الإدارة.
- لم تتغير قاعدة البيانات أو الخدمات خارج النطاق.
- اجتازت الفحوص المناسبة.
- لم يظهر Secret أو ملف `.env` في Git.
- أصبح Git clean بعد Commit/Push أو وُضح سبب عدم الرفع.
- سُلّم تقرير مختصر بالملفات والفحوص والخطوة اليدوية إن وجدت.

## 30. مرجع سريع عند الشك

- الحقيقة البنيوية: `prisma/schema.prisma`
- الكتالوج: `lib/catalog/service.ts`
- Prisma singleton: `lib/prisma.ts`
- Auth العميل: `app/auth/actions.ts`
- Auth الإدارة: `lib/admin/auth.ts`
- التجارة: `lib/commerce/public-service.ts`
- الدفع: `lib/payments/payment.service.ts`
- التخزين: `lib/storage/index.ts`
- إعدادات الموقع: `lib/site-settings.ts`
- قواعد المشروع: `AGENTS.md`
- التقدم التاريخي: `PROJECT_PROGRESS.md`

إذا تعارضت محادثة قديمة أو وثيقة قديمة مع هذه الملفات، افحص الكود الحالي وGit أولًا، ولا تفترض.
