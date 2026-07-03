import { UserPlus } from "lucide-react";
import Link from "next/link";
import {
  createAdminUserAction,
  deleteAdminUserAction,
  updateAdminUserRoleAction,
} from "@/app/admin/user-actions";
import { AdminMessage } from "@/components/admin/admin-message";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { DeleteUserButton } from "@/components/admin/delete-user-button";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { getAdminCustomers } from "@/lib/account/service";
import { getAdminSession } from "@/lib/admin/auth";

const inputClass =
  "border-brand-border min-h-11 w-full rounded-xl border bg-white px-3 text-sm";

const roleLabel = (role: "SUPER_ADMIN" | "ADMIN" | null) =>
  role === "SUPER_ADMIN" ? "مدير النظام" : role === "ADMIN" ? "مدير" : "عميل";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const [result, session] = await Promise.all([
    getAdminCustomers(params.page),
    getAdminSession(),
  ]);
  const canManageRoles = session?.role === "SUPER_ADMIN";

  return (
    <div>
      <p className="text-brand-cyan text-sm font-bold">المستخدمون</p>
      <h1 className="text-brand-ink mt-2 text-3xl font-bold">
        الحسابات والصلاحيات
      </h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        العميل لا يدخل لوحة الإدارة. المدير يدير المنتجات والطلبات، ومدير النظام
        وحده يدير الصلاحيات والإعدادات الحساسة.
      </p>

      <div className="mt-6 space-y-3">
        {result.readOnly && (
          <AdminMessage tone="error">
            اربط قاعدة البيانات وطبّق Migration حسابات المستخدمين.
          </AdminMessage>
        )}
        {params.success && (
          <AdminMessage tone="success">تم حفظ التغيير بنجاح.</AdminMessage>
        )}
        {params.error && (
          <AdminMessage tone="error">
            {params.error === "exists"
              ? "البريد مستخدم مسبقاً."
              : params.error === "self"
                ? "لا يمكنك خفض صلاحيتك أو حذف حسابك الإداري الحالي."
                : params.error === "confirm"
                  ? "يجب تأكيد الحذف."
                  : "تعذر حفظ بيانات المستخدم."}
          </AdminMessage>
        )}
      </div>

      {canManageRoles && !result.readOnly && (
        <details className="border-brand-border mt-7 rounded-3xl border bg-white p-5">
          <summary className="text-brand-ink flex cursor-pointer items-center gap-2 font-bold">
            <UserPlus className="text-brand-cyan size-5" aria-hidden />
            إضافة مستخدم
          </summary>
          <form
            action={createAdminUserAction}
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <input
              className={inputClass}
              name="name"
              placeholder="الاسم"
              required
            />
            <input
              className={inputClass}
              name="email"
              type="email"
              placeholder="البريد"
              dir="ltr"
              required
            />
            <input
              className={inputClass}
              name="password"
              type="password"
              minLength={10}
              placeholder="كلمة المرور — 10 أحرف على الأقل"
              required
            />
            <input
              className={inputClass}
              name="phone"
              placeholder="الهاتف"
              required
            />
            <input
              className={inputClass}
              name="city"
              placeholder="المدينة"
              required
            />
            <input
              className={inputClass}
              name="companyName"
              placeholder="المنشأة — اختياري"
            />
            <input
              className={inputClass}
              name="address"
              placeholder="العنوان — اختياري"
            />
            <select className={inputClass} name="role" defaultValue="CUSTOMER">
              <option value="CUSTOMER">عميل</option>
              <option value="ADMIN">مدير</option>
              <option value="SUPER_ADMIN">مدير النظام</option>
            </select>
            <Button type="submit" className="md:col-span-2 md:w-fit">
              إضافة المستخدم
            </Button>
          </form>
        </details>
      )}

      {result.records.length ? (
        <div className="border-brand-border mt-7 overflow-x-auto rounded-3xl border bg-white">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="bg-brand-petroleum text-white">
              <tr>
                <th className="px-5 py-4 text-start">المستخدم</th>
                <th className="px-5 py-4 text-start">المنشأة</th>
                <th className="px-5 py-4 text-start">المدينة</th>
                <th className="px-5 py-4 text-start">الطلبات</th>
                <th className="px-5 py-4 text-start">الصلاحية</th>
                <th className="px-5 py-4 text-start">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {result.records.map((user) => (
                <tr key={user.id} className="border-brand-border border-t">
                  <td className="px-5 py-4">
                    <strong className="block">{user.name}</strong>
                    <span
                      className="font-latin mt-1 block text-xs text-slate-500"
                      dir="ltr"
                    >
                      {user.email}
                    </span>
                  </td>
                  <td className="px-5 py-4">{user.companyName ?? "—"}</td>
                  <td className="px-5 py-4">{user.city}</td>
                  <td className="px-5 py-4">{user._count.orders}</td>
                  <td className="px-5 py-4">
                    {canManageRoles ? (
                      <form
                        action={updateAdminUserRoleAction.bind(null, user.id)}
                        className="flex items-center gap-2"
                      >
                        <select
                          className={inputClass}
                          name="role"
                          defaultValue={user.role ?? "CUSTOMER"}
                        >
                          <option value="CUSTOMER">عميل</option>
                          <option value="ADMIN">مدير</option>
                          <option value="SUPER_ADMIN">مدير النظام</option>
                        </select>
                        <Button type="submit" size="sm" variant="outline">
                          حفظ
                        </Button>
                      </form>
                    ) : (
                      roleLabel(user.role)
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {canManageRoles && (
                        <>
                          <Link
                            className="text-brand-petroleum font-bold underline-offset-4 hover:underline"
                            href={`/admin/customers/${user.id}`}
                          >
                            تعديل
                          </Link>
                          <DeleteUserButton
                            userName={user.name}
                            action={deleteAdminUserAction.bind(null, user.id)}
                          />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="لا توجد حسابات"
            description="ستظهر الحسابات الجديدة هنا بعد التسجيل."
          />
        </div>
      )}
      <AdminPagination
        basePath="/admin/customers"
        query=""
        page={result.page}
        hasNext={result.hasNext}
      />
    </div>
  );
}
