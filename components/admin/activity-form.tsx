import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EQUIPMENT_GROUPS } from "@/lib/admin/activities-admin";

type ProductOption = { id: string; nameAr: string; sku: string; category: { name: string } };
type ActivityValue = {
  slug: string;
  name: string;
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  introduction: string;
  image: string;
  primaryCtaText: string;
  published: boolean;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  seoImageAlt: string | null;
  productLinks: Array<{ productId: string; equipmentGroup: string; essential: boolean }>;
};

const control = "border-brand-border focus:border-brand-cyan min-h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none";

export function ActivityForm({
  action,
  products,
  activity,
}: {
  action: (formData: FormData) => Promise<void>;
  products: ProductOption[];
  activity?: ActivityValue;
}) {
  const selected = new Map(activity?.productLinks.map((link) => [link.productId, link]) ?? []);
  const categories = products.reduce((groups, product) => {
    const items = groups.get(product.category.name) ?? [];
    items.push(product);
    groups.set(product.category.name, items);
    return groups;
  }, new Map<string, ProductOption[]>());

  return (
    <form action={action} className="space-y-7">
      <fieldset className="border-brand-border grid gap-4 rounded-2xl border p-5 sm:grid-cols-2">
        <legend className="text-brand-ink px-2 font-bold">المحتوى الأساسي</legend>
        <Field label="اسم النشاط" name="name" defaultValue={activity?.name} />
        <Field label="Slug" name="slug" defaultValue={activity?.slug} dir="ltr" />
        <Field label="النص التعريفي القصير" name="eyebrow" defaultValue={activity?.eyebrow ?? "جهّز مشروعك مع عالم النخبة"} />
        <Field label="عنوان الصفحة H1" name="heroTitle" defaultValue={activity?.heroTitle} />
        <label className="sm:col-span-2">
          <span className="text-brand-ink mb-2 block text-sm font-semibold">وصف المقدمة</span>
          <textarea name="heroDescription" required rows={3} defaultValue={activity?.heroDescription} className={`${control} py-3`} />
        </label>
        <label className="sm:col-span-2">
          <span className="text-brand-ink mb-2 block text-sm font-semibold">المحتوى البيعي</span>
          <textarea name="introduction" required rows={5} defaultValue={activity?.introduction} className={`${control} py-3`} />
        </label>
        <Field label="مسار الصورة" name="image" defaultValue={activity?.image ?? "/images/hero-industrial-kitchen.png"} dir="ltr" />
        <Field label="نص زر عرض السعر" name="primaryCtaText" defaultValue={activity?.primaryCtaText ?? "اطلب عرض تجهيز كامل"} />
        <Field label="ترتيب الظهور" name="sortOrder" type="number" defaultValue={activity?.sortOrder ?? 0} />
        <label className="flex items-center gap-3 self-end pb-3 text-sm font-semibold text-brand-ink">
          <input name="published" type="checkbox" defaultChecked={activity?.published ?? false} className="accent-brand-cyan size-5" />
          منشور في الموقع
        </label>
      </fieldset>

      <fieldset className="border-brand-border rounded-2xl border p-5">
        <legend className="text-brand-ink px-2 font-bold">ربط المنتجات</legend>
        <p className="mb-5 text-sm leading-6 text-slate-600">حدد المنتجات، ثم اختر مجموعة التشغيل وما إذا كانت أساسية أو مكملة. يمكن ربط المنتج بأكثر من نشاط.</p>
        <div className="space-y-5">
          {[...categories].map(([category, items]) => (
            <details key={category} className="border-brand-border rounded-xl border" open={items.some((item) => selected.has(item.id))}>
              <summary className="text-brand-ink cursor-pointer p-4 font-bold">{category} <span className="text-xs font-normal text-slate-500">({items.length})</span></summary>
              <div className="border-brand-border grid gap-3 border-t p-4">
                {items.map((product) => {
                  const link = selected.get(product.id);
                  return (
                    <div key={product.id} className="grid items-center gap-3 rounded-xl bg-brand-surface p-3 lg:grid-cols-[1fr_11rem_8rem]">
                      <label className="flex items-center gap-3 text-sm font-semibold text-brand-ink">
                        <input name="productIds" value={product.id} type="checkbox" defaultChecked={Boolean(link)} className="accent-brand-cyan size-5" />
                        <span>{product.nameAr} <small className="font-latin block text-slate-500">{product.sku}</small></span>
                      </label>
                      <select name={`group_${product.id}`} defaultValue={link?.equipmentGroup ?? EQUIPMENT_GROUPS[0]} className={control} aria-label={`مجموعة ${product.nameAr}`}>
                        {EQUIPMENT_GROUPS.map((group) => <option key={group}>{group}</option>)}
                      </select>
                      <label className="flex items-center gap-2 text-sm font-semibold text-brand-ink">
                        <input name={`essential_${product.id}`} type="checkbox" defaultChecked={link?.essential ?? true} className="accent-brand-cyan size-5" />
                        معدات أساسية
                      </label>
                    </div>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      </fieldset>

      <fieldset className="border-brand-border grid gap-4 rounded-2xl border p-5 sm:grid-cols-2">
        <legend className="text-brand-ink px-2 font-bold">SEO</legend>
        <Field label="Meta Title" name="seoTitle" defaultValue={activity?.seoTitle ?? ""} />
        <Field label="Canonical URL" name="canonicalUrl" defaultValue={activity?.canonicalUrl ?? ""} dir="ltr" required={false} />
        <label className="sm:col-span-2"><span className="text-brand-ink mb-2 block text-sm font-semibold">Meta Description</span><textarea name="seoDescription" rows={3} defaultValue={activity?.seoDescription ?? ""} className={`${control} py-3`} /></label>
        <Field label="OG Title" name="ogTitle" defaultValue={activity?.ogTitle ?? ""} required={false} />
        <Field label="OG Image" name="ogImage" defaultValue={activity?.ogImage ?? ""} dir="ltr" required={false} />
        <Field label="OG Description" name="ogDescription" defaultValue={activity?.ogDescription ?? ""} required={false} />
        <Field label="وصف صورة المشاركة" name="seoImageAlt" defaultValue={activity?.seoImageAlt ?? ""} required={false} />
      </fieldset>

      <Button type="submit" icon={<Save className="size-4" aria-hidden />}>حفظ النشاط</Button>
    </form>
  );
}

function Field({ label, name, defaultValue, dir, type = "text", required = true }: { label: string; name: string; defaultValue?: string | number; dir?: "ltr"; type?: string; required?: boolean }) {
  return <label><span className="text-brand-ink mb-2 block text-sm font-semibold">{label}</span><input name={name} type={type} required={required} defaultValue={defaultValue} dir={dir} className={control} /></label>;
}
