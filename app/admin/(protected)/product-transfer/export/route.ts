import { ProductAvailability } from "@prisma/client";
import { getAdminSession } from "@/lib/admin/auth";
import { exportProductsXlsx } from "@/lib/product-transfer/export";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!(await getAdminSession()))
    return new Response("Unauthorized", { status: 401 });
  const formData = await request.formData();
  const availabilityValue = String(formData.get("availability") ?? "");
  const availability = Object.values(ProductAvailability).includes(
    availabilityValue as ProductAvailability,
  )
    ? (availabilityValue as ProductAvailability)
    : undefined;
  const buffer = await exportProductsXlsx({
    categoryId: String(formData.get("categoryId") ?? "") || undefined,
    brandId: String(formData.get("brandId") ?? "") || undefined,
    availability,
    productIds: formData.getAll("productIds").map(String).filter(Boolean),
    templateOnly: formData.get("templateOnly") === "true",
  });
  const suffix =
    formData.get("templateOnly") === "true"
      ? "master-template"
      : new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="elite-world-products-${suffix}.xlsx"`,
      "cache-control": "private, no-store",
    },
  });
}
