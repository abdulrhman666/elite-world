"use client";

import { useState } from "react";

const control =
  "border-brand-border focus:border-brand-cyan min-h-12 w-full rounded-xl border bg-white px-4 text-sm text-brand-ink outline-none";

type Option = { name: string; value: string };

export function BulkEditorFields({
  categories,
  brands,
}: {
  categories: Option[];
  brands: Option[];
}) {
  const [action, setAction] = useState("");
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label>
        <span className="text-brand-ink mb-2 block text-sm font-semibold">
          الإجراء
        </span>
        <select
          name="bulkAction"
          required
          className={control}
          value={action}
          onChange={(event) => setAction(event.target.value)}
        >
          <option value="">اختر الإجراء</option>
          <option value="categorySlug">تغيير التصنيف</option>
          <option value="brandName">تغيير الماركة</option>
          <option value="availability">تغيير التوفر</option>
          <option value="stockQuantity">تغيير المخزون</option>
          <option value="pricePercent">زيادة/خفض السعر بنسبة %</option>
          <option value="priceAmount">إضافة/طرح قيمة ثابتة</option>
        </select>
      </label>
      <label>
        <span className="text-brand-ink mb-2 block text-sm font-semibold">
          القيمة الجديدة
        </span>
        {action === "categorySlug" ? (
          <select name="bulkValue" required className={control}>
            <option value="">اختر التصنيف</option>
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.name}
              </option>
            ))}
          </select>
        ) : action === "brandName" ? (
          <select name="bulkValue" required className={control}>
            <option value="">اختر الماركة</option>
            {brands.map((item) => (
              <option key={item.value} value={item.value}>
                {item.name}
              </option>
            ))}
          </select>
        ) : action === "availability" ? (
          <select name="bulkValue" required className={control}>
            <option value="">اختر التوفر</option>
            <option value="IN_STOCK">متوفر</option>
            <option value="ON_REQUEST">حسب الطلب</option>
          </select>
        ) : (
          <input
            name="bulkValue"
            required
            className={control}
            inputMode="decimal"
            placeholder={
              action === "pricePercent" ? "مثال: 5 أو -5" : "أدخل القيمة"
            }
          />
        )}
      </label>
    </div>
  );
}
