"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import type {
  AddCartItemRequest,
  CartItemDto,
  CartSummary,
  UpdateCartItemRequest,
} from "@/lib/types";

// Matches the cart-service tax calculation seen in the OpenAPI examples:
// 8% of the line-item subtotal.
const TAX_RATE = 0.08;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function summarize(id: number, items: CartItemDto[]): CartSummary {
  const subtotal = round2(
    items.reduce((sum, item) => sum + item.totalPrice, 0)
  );
  const tax = round2(subtotal * TAX_RATE);
  return { id, items, subtotal, tax, total: round2(subtotal + tax) };
}

export interface AddToCartInput {
  productId: number;
  name: string;
  unitPrice: number;
  quantity?: number;
}

export interface UseCartValue {
  cart: CartSummary | null;
  loading: boolean;
  itemCount: number;
  addItem: (input: AddToCartInput) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clear: () => Promise<void>;
}

export function useCart(): UseCartValue {
  const { user } = useAuth();
  const [cart, setCart] = React.useState<CartSummary | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      setCart(null);
      return;
    }
    let active = true;
    setLoading(true);
    api
      .get<CartSummary>("/cart")
      .then((summary) => {
        if (active) setCart(summary);
      })
      .catch(() => {
        // The api client handles 401s (refresh + redirect to /login).
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const addItem = React.useCallback(
    async (input: AddToCartInput) => {
      const quantity = input.quantity ?? 1;
      const payload: AddCartItemRequest = {
        productId: input.productId,
        quantity,
      };
      const previous = cart;

      if (cart) {
        const existing = cart.items.find(
          (item) => item.productId === input.productId
        );
        let items: CartItemDto[];
        if (existing) {
          items = cart.items.map((item) =>
            item.productId === input.productId
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  totalPrice: round2(item.unitPrice * (item.quantity + quantity)),
                }
              : item
          );
        } else {
          const item: CartItemDto = {
            id: -Date.now(),
            productId: input.productId,
            productName: input.name,
            quantity,
            unitPrice: input.unitPrice,
            totalPrice: round2(input.unitPrice * quantity),
          };
          items = [...cart.items, item];
        }
        setCart(summarize(cart.id, items));
      }

      try {
        const summary = await api.post<CartSummary>("/cart/items", payload);
        setCart(summary);
        toast({
          title: "Added to cart",
          description: `${input.name} added to your cart.`,
        });
      } catch (error) {
        if (previous) setCart(previous);
        toast({
          title: "Could not add to cart",
          description:
            error instanceof Error ? error.message : "Something went wrong.",
          variant: "destructive",
        });
      }
    },
    [cart]
  );

  const updateItem = React.useCallback(
    async (itemId: number, quantity: number) => {
      const payload: UpdateCartItemRequest = { quantity };
      const previous = cart;

      if (cart) {
        setCart(
          summarize(
            cart.id,
            cart.items.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    quantity,
                    totalPrice: round2(item.unitPrice * quantity),
                  }
                : item
            )
          )
        );
      }

      try {
        const summary = await api.put<CartSummary>(
          `/cart/items/${itemId}`,
          payload
        );
        setCart(summary);
      } catch (error) {
        if (previous) setCart(previous);
        toast({
          title: "Could not update cart",
          description:
            error instanceof Error ? error.message : "Something went wrong.",
          variant: "destructive",
        });
      }
    },
    [cart]
  );

  const removeItem = React.useCallback(
    async (itemId: number) => {
      const previous = cart;

      if (cart) {
        setCart(
          summarize(
            cart.id,
            cart.items.filter((item) => item.id !== itemId)
          )
        );
      }

      try {
        const summary = await api.del<CartSummary>(`/cart/items/${itemId}`);
        setCart(summary);
      } catch (error) {
        if (previous) setCart(previous);
        toast({
          title: "Could not remove item",
          description:
            error instanceof Error ? error.message : "Something went wrong.",
          variant: "destructive",
        });
      }
    },
    [cart]
  );

  const clear = React.useCallback(async () => {
    const previous = cart;

    if (cart) {
      setCart(summarize(cart.id, []));
    }

    try {
      await api.del<void>("/cart");
      if (cart) {
        setCart(summarize(cart.id, []));
      }
      toast({
        title: "Cart cleared",
        description: "All items were removed from your cart.",
      });
    } catch (error) {
      if (previous) setCart(previous);
      toast({
        title: "Could not clear cart",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    }
  }, [cart]);

  const itemCount = React.useMemo(
    () => cart?.items.reduce((count, item) => count + item.quantity, 0) ?? 0,
    [cart]
  );

  return {
    cart,
    loading,
    itemCount,
    addItem,
    updateItem,
    removeItem,
    clear,
  };
}