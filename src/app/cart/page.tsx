"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Ban,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { CartItemDto } from "@/lib/types";

function CartPageSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-28" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="h-fit">
        <CardHeader>
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart, loading: cartLoading, updateItem, removeItem } = useCart();

  const [busyItems, setBusyItems] = React.useState<ReadonlySet<number>>(
    () => new Set()
  );

  const markBusy = React.useCallback((itemId: number) => {
    setBusyItems((prev) => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
  }, []);

  const markIdle = React.useCallback((itemId: number) => {
    setBusyItems((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  }, []);

  const handleQuantityChange = React.useCallback(
    async (item: CartItemDto, quantity: number) => {
      if (quantity < 1 || quantity > 999 || busyItems.has(item.id)) {
        return;
      }
      markBusy(item.id);
      try {
        await updateItem(item.id, quantity);
      } finally {
        markIdle(item.id);
      }
    },
    [busyItems, markBusy, markIdle, updateItem]
  );

  const handleRemove = React.useCallback(
    async (itemId: number) => {
      if (busyItems.has(itemId)) {
        return;
      }
      markBusy(itemId);
      try {
        await removeItem(itemId);
      } finally {
        markIdle(itemId);
      }
    },
    [busyItems, markBusy, markIdle, removeItem]
  );

  if (authLoading || cartLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CartPageSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-md text-center">
          <CardHeader className="items-center">
            <Ban
              className="mb-2 h-10 w-10 text-muted-foreground"
              aria-hidden
            />
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              You need to be signed in to view your cart.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/login">
                Go to sign in
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-md text-center">
          <CardHeader className="items-center">
            <ShoppingCart
              className="mb-2 h-10 w-10 text-muted-foreground"
              aria-hidden
            />
            <CardTitle>Your cart is empty</CardTitle>
            <CardDescription>
              Looks like you have not added anything yet.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/products">
                Browse products
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
        <p className="mt-1 text-muted-foreground">
          Review the items in your cart before checking out.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
            <CardDescription>
              {cart.items.length}{" "}
              {cart.items.length === 1 ? "item" : "items"} in your cart
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table aria-label="Cart items">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Product</TableHead>
                  <TableHead scope="col" className="text-right">
                    Unit price
                  </TableHead>
                  <TableHead scope="col">Quantity</TableHead>
                  <TableHead scope="col" className="text-right">
                    Line total
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    <span className="sr-only">Remove</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.items.map((item) => {
                  const busy = busyItems.has(item.id);
                  const productName = item.productName || `Product #${item.productId}`;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Link
                          href={`/products/${item.productId}`}
                          className="font-medium hover:text-primary hover:underline hover:underline-offset-2"
                        >
                          {productName}
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          ID {item.productId}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell>
                        <div
                          className="inline-flex items-center gap-2"
                          role="group"
                          aria-label={`Quantity for ${productName}`}
                        >
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            disabled={busy || item.quantity <= 1}
                            aria-label={`Decrease quantity of ${productName}`}
                            onClick={() =>
                              void handleQuantityChange(item, item.quantity - 1)
                            }
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                          <span
                            className="w-8 text-center tabular-nums"
                            aria-live="polite"
                          >
                            {item.quantity}
                          </span>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            disabled={busy || item.quantity >= 999}
                            aria-label={`Increase quantity of ${productName}`}
                            onClick={() =>
                              void handleQuantityChange(item, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell
                        className={cn("text-right font-medium tabular-nums", {
                          "opacity-50": busy,
                        })}
                      >
                        {formatCurrency(item.totalPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={busy}
                          aria-label={`Remove ${productName} from cart`}
                          onClick={() => void handleRemove(item.id)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">
                {formatCurrency(cart.subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="tabular-nums">{formatCurrency(cart.tax)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(cart.total)}</span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3">
            <Button asChild size="lg" className="w-full">
              <Link href="/checkout">
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/products">Continue shopping</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}