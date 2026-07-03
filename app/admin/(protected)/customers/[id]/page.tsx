import { notFound, redirect } from "next/navigation";
import { updateAdminUserAction } from "@/app/admin/user-actions";
import { AdminMessage } from "@/components/admin/admin-message";
import { Button, ButtonLink } from "@/components/ui/button";
import { getAdminUser } from "@/lib/account/service";
import { getAdminSession } from "@/lib/admin/auth";

const inputClass =
  "border-brand-border min-h-12 w-full rounded-xl border bg-white px-4 text-sm";

export default async function EditAdminUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await getAdminSession();
  if (session?.role !== "SUPER_ADMIN") redirect("/admin?error=forbidden");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await getAdminUser(id);
  if (!user) notFound();

  return (
    <div className="max-w-3xl">
      <p className="text-brand-cyan text-sm font-bold">المستخدمون</p>
      <h1 className="text-brand-ink mt-2 text-3xl font-bold">تعديل المستخدم</h1>
      <div className="mt-5 space-y-3">
        {query.success && (
          <AdminMessage tone="success">تم حفظ بيانات المستخدم.</AdminMessage>
        )}
        {query.error && (
          <AdminMessage tone="error">
            تعذر حفظ البيانات أو الصلاحية.
          </AdminMessage>
        )}
      </div>
      <form
        action={updateAdminUserAction.bind(null, user.id)}
        className="border-brand-border mt-6 grid gap-5 rounded-3xl border bg-white p-6 md:grid-cols-2"
      >
        <Field label="الاسم">
          <input
            className={inputClass}
            name="name"
            defaultValue={user.name}
            required
          />
        </Field>
        <Field label="البريد">
          <input
            className={inputClass}
            name="email"
            type="email"
            dir="ltr"
            defaultValue={user.email}
            required
          />
        </Field>
        <Field label="الهاتف">
          <input
            className={inputClass}
            name="phone"
            defaultValue={user.phone}
            required
          />
        </Field>
        <Field label="المدينة">
          <input
            className={inputClass}
            name="city"
            defaultValue={user.city}
            required
          />
        </Field>
        <Field label="المنشأة">
          <input
            className={inputClass}
            name="companyName"
            defaultValue={user.companyName ?? ""}
          />
        </Field>
        <Field label="العنوان">
          <input
            className={inputClass}
            name="address"
            defaultValue={user.address ?? ""}
          />
        </Field>
        <Field label="الصلاحية">
          <select
            className={inputClass}
            name="role"
            defaultValue={user.role ?? "CUSTOMER"}
          >
            <option value="CUSTOMER">عميل</option>
            <option value="ADMIN">مدير</option>
            <option value="SUPER_ADMIN">مدير النظام</option>
          </select>
        </Field>
        <Field label="كلمة مرور جديدة — اختياري">
          <input
            className={inputClass}
            name="password"
            type="password"
            minLength={10}
          />
        </Field>
        <p className="text-sm text-slate-500 md:col-span-2">
          الطلبات: {user._count.orders} · عروض الأسعار: {user._count.quotes} ·
          عناصر السلة: {user._count.cart}
        </p>
        <div className="flex gap-3 md:col-span-2">
          <Button type="submit">حفظ التغييرات</Button>
          <ButtonLink href="/admin/customers" variant="outline">
            العودة
          </ButtonLink>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-brand-ink mb-2 block text-sm font-semibold">
        {label}
      </span>
      {children}
    </label>
  );
}
