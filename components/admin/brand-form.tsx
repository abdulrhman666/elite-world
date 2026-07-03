import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminBrandRecord } from "@/lib/admin/catalog-admin";

const controlClass =
  "border-brand-border focus:border-brand-cyan focus:ring-brand-cyan/15 min-h-12 w-full rounded-xl border bg-white px-4 text-sm text-brand-ink outline-none transition focus:ring-3";

export function AdminBrandForm({
  action,
  brand,
}: {
  action: (formData: FormData) => Promise<void>;
  brand?: AdminBrandRecord;
}) {
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className="text-brand-ink mb-2 block text-sm font-semibold">
          الاسم
        </span>
        <input
          name="name"
          required
          defaultValue={brand?.name}
          className={controlClass}
        />
      </label>
      <label className="block">
        <span className="text-brand-ink mb-2 block text-sm font-semibold">
          بلد المنشأ{" "}
          <span className="font-normal text-slate-400">(اختياري)</span>
        </span>
        <input
          name="origin"
          defaultValue={brand?.origin ?? ""}
          className={controlClass}
        />
      </label>
      <label className="block sm:col-span-2">
        <span className="text-brand-ink mb-2 block text-sm font-semibold">
          وصف مختصر{" "}
          <span className="font-normal text-slate-400">(اختياري)</span>
        </span>
        <textarea
          name="description"
          rows={3}
          defaultValue={brand?.description ?? ""}
          className={`${controlClass} py-3`}
        />
      </label>
      <div className="sm:col-span-2">
        <Button
          type="submit"
          size="sm"
          icon={<Save className="size-4" aria-hidden />}
        >
          {brand ? "حفظ العلامة" : "إضافة العلامة"}
        </Button>
      </div>
    </form>
  );
}
