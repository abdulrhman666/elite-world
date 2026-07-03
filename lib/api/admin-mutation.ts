import "server-only";
import { getAdminSession } from "@/lib/admin/auth";

export type AdminMutationIssue = {
  status: 401 | 403 | 413;
  error:
    | "ADMIN_AUTH_REQUIRED"
    | "ADMIN_FORBIDDEN"
    | "INVALID_ORIGIN"
    | "REQUEST_TOO_LARGE";
};

export async function getAdminMutationIssue(
  request: Request,
  options: { superAdminOnly?: boolean } = {},
): Promise<AdminMutationIssue | null> {
  const session = await getAdminSession();
  if (!session) {
    return { status: 401, error: "ADMIN_AUTH_REQUIRED" };
  }
  if (options.superAdminOnly && session.role !== "SUPER_ADMIN") {
    return { status: 403, error: "ADMIN_FORBIDDEN" };
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return { status: 403, error: "INVALID_ORIGIN" };
  }
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 32_768) {
    return { status: 413, error: "REQUEST_TOO_LARGE" };
  }
  return null;
}
