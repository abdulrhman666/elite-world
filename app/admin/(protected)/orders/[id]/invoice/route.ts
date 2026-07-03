import { getAdminOrder } from "@/lib/admin/commerce-admin";
import { getAdminSession } from "@/lib/admin/auth";
import { getStorageAdapter } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminSession()))
    return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const result = await getAdminOrder(id);
  if (!result.record?.invoice)
    return new Response("Not found", { status: 404 });
  try {
    const bytes = await getStorageAdapter().readFile(
      result.record.invoice.filePath,
    );
    return new Response(Uint8Array.from(bytes).buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(result.record.invoice.originalName)}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
