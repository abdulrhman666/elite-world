"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import {
  createPaymentProvider,
  setPaymentProviderActive,
  updatePaymentProvider,
} from "@/lib/payments/settings";

async function requireSuperAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login?error=session");
  if (session.role !== "SUPER_ADMIN") redirect("/admin?error=forbidden");
}

function value(formData: FormData, name: string, maximum: number) {
  const result = String(formData.get(name) ?? "").trim();
  if (result.length > maximum) throw new Error("INVALID_VALUE");
  return result;
}

function secret(formData: FormData, name: string) {
  return value(formData, name, 2000) || null;
}

function errorCode(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "INVALID_PROVIDER_NAME") return "name";
    if (error.message === "INVALID_PROVIDER_ENDPOINT") return "endpoint";
    if (error.message === "PROVIDER_NOT_FOUND") return "missing";
    if (error.message === "READ_ONLY") return "readonly";
    if ("code" in error && error.code === "P2002") return "duplicate";
  }
  return "save";
}

export async function createPaymentProviderAction(formData: FormData) {
  await requireSuperAdmin();
  try {
    await createPaymentProvider({
      name: value(formData, "name", 50),
      endpoint: value(formData, "endpoint", 500),
      apiKey: secret(formData, "apiKey"),
      secretKey: secret(formData, "secretKey"),
      isActive: formData.get("isActive") === "on",
      clearKeys: false,
    });
  } catch (error) {
    redirect(`/admin/settings/payments?error=${errorCode(error)}`);
  }
  revalidatePath("/admin/settings/payments");
  redirect("/admin/settings/payments?success=created");
}

export async function updatePaymentProviderAction(
  id: string,
  formData: FormData,
) {
  await requireSuperAdmin();
  try {
    await updatePaymentProvider(id, {
      endpoint: value(formData, "endpoint", 500),
      apiKey: secret(formData, "apiKey"),
      secretKey: secret(formData, "secretKey"),
      clearKeys: formData.get("clearKeys") === "on",
    });
  } catch (error) {
    redirect(`/admin/settings/payments?error=${errorCode(error)}`);
  }
  revalidatePath("/admin/settings/payments");
  redirect("/admin/settings/payments?success=updated");
}

export async function setPaymentProviderActiveAction(
  id: string,
  active: boolean,
) {
  await requireSuperAdmin();
  try {
    await setPaymentProviderActive(id, active);
  } catch (error) {
    redirect(`/admin/settings/payments?error=${errorCode(error)}`);
  }
  revalidatePath("/admin/settings/payments");
  redirect(
    `/admin/settings/payments?success=${active ? "activated" : "stopped"}`,
  );
}
