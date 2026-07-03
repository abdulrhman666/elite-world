"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

export type CartItem = {
  slug: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  hydrated: boolean;
  authenticated: boolean;
  addItem: (slug: string, quantity?: number, maxQuantity?: number) => void;
  setQuantity: (slug: string, quantity: number, maxQuantity?: number) => void;
  removeItem: (slug: string) => void;
  clearCart: () => void;
};

type CartMutation =
  | { action: "add" | "set"; slug: string; quantity: number }
  | { action: "remove"; slug: string }
  | { action: "clear" };

const CartContext = createContext<CartContextValue | null>(null);

function sanitizeItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const quantities = new Map<string, number>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const slug = String(record.slug ?? "").trim();
    const quantity = Number(record.quantity);
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      continue;
    }
    quantities.set(slug, Math.min(999, quantity));
  }
  return [...quantities].map(([slug, quantity]) => ({ slug, quantity }));
}

export function CartProvider({
  children,
  initialItems = [],
  authenticated = false,
}: {
  children: ReactNode;
  initialItems?: CartItem[];
  authenticated?: boolean;
}) {
  const [items, setItems] = useState<CartItem[]>(() =>
    sanitizeItems(initialItems),
  );
  const pathname = usePathname();
  const adminPath = pathname.startsWith("/admin");
  const [hydrated, setHydrated] = useState(
    () => !authenticated || adminPath || initialItems.length > 0,
  );
  const mutationQueue = useRef<Promise<void>>(Promise.resolve());

  const refreshStoredCart = useCallback(async () => {
    if (!authenticated) return;
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { items?: unknown };
      setItems(sanitizeItems(data.items));
    } catch {
      // Keep the current UI state if Neon is temporarily unavailable.
    }
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated || adminPath) {
      setHydrated(true);
      return;
    }
    let cancelled = false;
    setHydrated(false);
    void refreshStoredCart().finally(() => {
      if (!cancelled) setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [adminPath, authenticated, refreshStoredCart]);

  const syncMutation = useCallback(
    (mutation: CartMutation) => {
      if (!authenticated) return Promise.resolve();
      mutationQueue.current = mutationQueue.current.then(async () => {
        try {
          const response = await fetch("/api/cart", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(mutation),
          });
          if (!response.ok) {
            await refreshStoredCart();
            return;
          }
          const data = (await response.json()) as { items?: unknown };
          setItems(sanitizeItems(data.items));
        } catch {
          await refreshStoredCart();
        }
      });
      return mutationQueue.current;
    },
    [authenticated, refreshStoredCart],
  );

  const addItem = useCallback(
    (slug: string, quantity = 1, maxQuantity = 999) => {
      const safeMaximum = Math.max(0, Math.min(999, maxQuantity));
      if (safeMaximum === 0) return;
      const safeQuantity = Math.max(1, Math.min(safeMaximum, quantity));
      setItems((current) => {
        const existing = current.find((item) => item.slug === slug);
        if (!existing) return [...current, { slug, quantity: safeQuantity }];
        return current.map((item) =>
          item.slug === slug
            ? {
                ...item,
                quantity: Math.min(safeMaximum, item.quantity + safeQuantity),
              }
            : item,
        );
      });
      void syncMutation({ action: "add", slug, quantity: safeQuantity });
    },
    [syncMutation],
  );

  const setQuantity = useCallback(
    (slug: string, quantity: number, maxQuantity = 999) => {
      const safeMaximum = Math.max(0, Math.min(999, maxQuantity));
      if (safeMaximum === 0) return;
      const safeQuantity = Math.max(1, Math.min(safeMaximum, quantity));
      setItems((current) =>
        current.map((item) =>
          item.slug === slug ? { ...item, quantity: safeQuantity } : item,
        ),
      );
      void syncMutation({ action: "set", slug, quantity: safeQuantity });
    },
    [syncMutation],
  );

  const removeItem = useCallback(
    (slug: string) => {
      setItems((current) => current.filter((item) => item.slug !== slug));
      void syncMutation({ action: "remove", slug });
    },
    [syncMutation],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    void syncMutation({ action: "clear" });
  }, [syncMutation]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      hydrated,
      authenticated,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [
      addItem,
      authenticated,
      clearCart,
      hydrated,
      items,
      removeItem,
      setQuantity,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
