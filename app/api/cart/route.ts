import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth/customer-auth";
import {
  getUserCart,
  mutateUserCart,
  type CartMutation,
} from "@/lib/cart/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json(
    { items: [], authenticated: false },
    { status: 401 },
  );
}

function validSlug(value: unknown) {
  const slug = String(value ?? "").trim();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null;
}

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return unauthorized();
  try {
    return NextResponse.json({
      items: await getUserCart(session.userId),
      authenticated: true,
    });
  } catch {
    return NextResponse.json({ message: "CART_UNAVAILABLE" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await getCustomerSession();
  if (!session) return unauthorized();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "");
    let mutation: CartMutation;

    if (action === "clear") {
      mutation = { action: "clear" };
    } else {
      const slug = validSlug(body.slug);
      if (!slug) {
        return NextResponse.json({ message: "INVALID_CART" }, { status: 400 });
      }
      if (action === "remove") {
        mutation = { action: "remove", slug };
      } else if (action === "add" || action === "set") {
        const quantity = Number(body.quantity);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
          return NextResponse.json(
            { message: "INVALID_QUANTITY" },
            { status: 400 },
          );
        }
        mutation = { action, slug, quantity };
      } else {
        return NextResponse.json(
          { message: "INVALID_ACTION" },
          { status: 400 },
        );
      }
    }

    return NextResponse.json({
      items: await mutateUserCart(session.userId, mutation),
      authenticated: true,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CART_UNAVAILABLE";
    const status =
      code === "OUT_OF_STOCK" ? 409 : code === "PRODUCT_NOT_FOUND" ? 404 : 503;
    return NextResponse.json({ message: code }, { status });
  }
}
