import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { removeWishlistAction } from "@/app/account/actions";
import {
  logoutCustomerAction,
  updateCustomerProfileAction,
} from "@/app/auth/actions";
import { ReorderButton } from "@/components/account/reorder-button";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { getCustomerAccount } from "@/lib/account/service";
import { getCustomerSession } from "@/lib/auth/customer-auth";
import { formatProductPrice } from "@/lib/catalog";
import {
  orderPaymentStatusLabel,
  orderStatusLabel,
} from "@/lib/commerce/status";

export const metadata: Metadata = {
  title: "حسابي",
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; success?: string; error?: string }>;
}) {
  const session = await getCustomerSession();
  if (!session) redirect("/auth/login?error=session");
  const params = await searchParams;
  const account = await getCustomerAccount(session.userId, Number(params.page));
  if (!account) redirect("/auth/login?error=session");

  return (
    <section className="bg-brand-surface py-10 sm:py-14">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-brand-cyan text-sm font-bold">حساب العميل</p>
            <h1 className="text-brand-ink mt-2 text-3xl font-bold">
              أهلاً {account.name}
            </h1>
          </div>
          <form action={logoutCustomerAction}>
            <Button type="submit" variant="outline">
              تسجيل الخروج
            </Button>
          </form>
        </div>
        {params.success === "profile" && (
          <Alert title="تم الحفظ" className="mt-6">
            تم تحديث بيانات الحساب.
          </Alert>
        )}
        {params.error && (
          <Alert className="mt-6">تعذر حفظ البيانات. تحقق من الحقول.</Alert>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <section className="border-brand-border rounded-3xl border bg-white p-6">
            <h2 className="text-brand-ink text-xl font-bold">بيانات العميل</h2>
            <form
              action={updateCustomerProfileAction}
              className="mt-5 grid gap-4"
            >
              <ProfileField name="name" label="الاسم" value={account.name} />
              <ProfileField
                name="companyName"
                label="المنشأة"
                value={account.companyName ?? ""}
                required={false}
              />
              <ProfileField name="phone" label="الهاتف" value={account.phone} />
              <ProfileField name="city" label="المدينة" value={account.city} />
              <ProfileField
                name="address"
                label="العنوان"
                value={account.address ?? ""}
                required={false}
              />
              <div>
                <p className="text-sm font-semibold">البريد الإلكتروني</p>
                <p className="font-latin mt-1 text-sm text-slate-500" dir="ltr">
                  {account.email}
                </p>
              </div>
              <Button type="submit">حفظ البيانات</Button>
            </form>
          </section>

          <section className="border-brand-border rounded-3xl border bg-white p-6">
            <h2 className="text-brand-ink text-xl font-bold">طلباتي</h2>
            {account.orders.length ? (
              <div className="mt-5 space-y-4">
                {account.orders.map((order) => (
                  <article
                    key={order.id}
                    className="border-brand-border rounded-2xl border p-4"
                  >
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <p className="font-latin text-brand-cyan text-sm font-bold">
                          {order.number}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {new Intl.DateTimeFormat("ar-SA").format(
                            order.createdAt,
                          )}
                        </p>
                      </div>
                      <div className="text-sm">
                        <p>{orderStatusLabel(order.status)}</p>
                        <p className="mt-1 text-slate-500">
                          {orderPaymentStatusLabel(order.paymentStatus)}
                        </p>
                        {order.deliveryEstimate && (
                          <p className="mt-1 text-slate-500">
                            التوصيل: {order.deliveryEstimate}
                          </p>
                        )}
                        {order.trackingNumber && (
                          <p
                            className="font-latin mt-1 text-slate-500"
                            dir="ltr"
                          >
                            {order.trackingNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <ButtonLink
                        href={`/track/${order.trackingToken}`}
                        size="sm"
                        variant="outline"
                      >
                        تتبع الطلب
                      </ButtonLink>
                      <ReorderButton items={order.items} />
                    </div>
                  </article>
                ))}
                <div className="flex justify-between gap-3">
                  {account.page > 1 ? (
                    <ButtonLink
                      href={`/account?page=${account.page - 1}`}
                      size="sm"
                      variant="outline"
                    >
                      السابق
                    </ButtonLink>
                  ) : (
                    <span />
                  )}
                  {account.hasNext ? (
                    <ButtonLink
                      href={`/account?page=${account.page + 1}`}
                      size="sm"
                      variant="outline"
                    >
                      التالي
                    </ButtonLink>
                  ) : (
                    <span />
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState
                  title="لا توجد طلبات"
                  description="ستظهر طلباتك هنا بعد إتمام أول طلب."
                />
              </div>
            )}
          </section>
        </div>

        <section className="border-brand-border mt-6 rounded-3xl border bg-white p-6">
          <h2 className="text-brand-ink text-xl font-bold">المفضلة</h2>
          {account.wishlist.length ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {account.wishlist.map((item) => (
                <article
                  key={item.id}
                  className="border-brand-border overflow-hidden rounded-2xl border"
                >
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <Image
                      src={item.product.image}
                      alt={item.product.nameAr}
                      fill
                      sizes="(max-width:640px) 100vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-brand-ink font-bold">
                      {item.product.nameAr}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatProductPrice(
                        item.product.price?.toNumber() ?? null,
                      )}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <ButtonLink
                        href={`/products/${item.product.slug}`}
                        size="sm"
                        variant="outline"
                      >
                        عرض
                      </ButtonLink>
                      <form action={removeWishlistAction.bind(null, item.id)}>
                        <Button type="submit" size="sm" variant="ghost">
                          إزالة
                        </Button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="المفضلة فارغة"
                description="احفظ المنتجات التي تريد الرجوع إليها سريعاً."
              />
            </div>
          )}
        </section>
      </Container>
    </section>
  );
}

function ProfileField({
  name,
  label,
  value,
  required = true,
}: {
  name: string;
  label: string;
  value: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input
        name={name}
        defaultValue={value}
        required={required}
        className="border-brand-border min-h-12 w-full rounded-xl border px-4"
      />
    </label>
  );
}
