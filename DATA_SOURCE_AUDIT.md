# ELITE WORLD Data Source Audit

آخر تحديث: 1 يوليو 2026

## قاعدة التشغيل

- بيانات الكتالوج في الواجهة ولوحة الإدارة تأتي من PostgreSQL عبر Prisma فقط.
- صفحات المحتوى المدارة (`ContentPage`) تأتي من Prisma فقط.
- ملفات CSV وملفات `data/` الخاصة بالكتالوج قوالب استيراد وSeed فقط، ولا تعمل كـ runtime fallback.
- عند غياب قاعدة البيانات تعرض الصفحات حالة فارغة واضحة، ولا تستبدل البيانات بمحتوى تجريبي.

## خريطة الصفحات

| الصفحة أو المجموعة                                                      | مصدر البيانات وقت التشغيل                                                      |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `/shop`, `/search`                                                      | Prisma: `Product`, `Category` عبر `lib/catalog/service.ts`                     |
| `/products/[slug]`                                                      | Prisma: `Product`, `ProductImage`, `ProductSpecification`, `Brand`, `Category` |
| `/categories`, `/categories/[slug]`                                     | Prisma: `Category` والعلاقة مع `Product`                                       |
| `/brands`                                                               | Prisma CMS: `ContentPage` + Prisma: `Brand` مباشرة                             |
| `/projects`                                                             | Prisma CMS: `ContentPage`                                                      |
| `/about`, `/project-solutions`, `/stainless`, `/maintenance`            | Prisma CMS: `ContentPage`؛ وصفحة الستانلس تضيف منتجات Prisma                   |
| `/cart`                                                                 | حالة محلية للعميل؛ تفاصيل المنتجات من Prisma فقط                               |
| `/checkout`, `/quote`                                                   | منتجات Prisma، والحفظ في `Order`/`Quote` عبر Prisma                            |
| `/track/[token]`                                                        | Prisma: الطلب وعناصره والفاتورة والدفع                                         |
| `/admin/products`, `/admin/categories`, `/admin/brands`, `/admin/media` | Prisma فقط؛ قراءة فقط وحالة فارغة عند غياب الاتصال                             |
| `/admin/pages`                                                          | Prisma CMS؛ القوالب المحلية تستخدم داخل محرر الإدارة للتهيئة فقط               |
| `/admin/quotes`, `/admin/orders`, `/admin/settings`, `/admin/seo`       | Prisma؛ إعدادات الشركة لها قيم أمان من `siteConfig` عند غياب الخدمة            |
| `/`                                                                     | Prisma: `SiteSettings` و`Category` و`Product`                                  |
| `/contact` والهيدر والفوتر                                              | `SiteSettings` من Prisma مع إعداد أمان من `config/site.ts`                     |
| `/account`, `/favorites`, `/compare`, `/orders`, `/payments`            | صفحات معلومات ثابتة لا تعرض سجلات كتالوج أو CMS                                |

## الملفات الثابتة المتبقية واستخدامها

- `data/import/elite_world_products_catalog.csv`: إدخال للاستيراد وSeed فقط.
- `data/categories.ts`: توصيف يساعد محول CSV فقط.
- `data/content-pages.ts`: قائمة مسارات CMS وقوالب تهيئة المحرر/استعادة الافتراضي؛ لا تُعرض مباشرة في الصفحات العامة.
- `data/home.ts`: قالب المقالات المستخدم أثناء الاستعادة غير التدميرية فقط، ولا يُقرأ وقت تشغيل الصفحة الرئيسية.
- `data/pages.ts`: صفحات المعلومات غير التابعة للكتالوج أو CMS فقط.

## نتيجة التدقيق للمسارات المطلوبة

`/shop` و`/products/[slug]` و`/brands` و`/categories` و`/categories/[slug]` و`/projects` لا تستخدم أي fallback ثابت وقت التشغيل. المصدر الوحيد لمحتواها التجاري هو Prisma، وCMS نفسه محفوظ في نموذج `ContentPage` داخل Prisma.
