"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { toast } from "@/hooks/use-toast";
import { formatCurrency, getInitials } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [adding, setAdding] = React.useState(false);

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please log in to add items to your cart.",
      });
      router.push("/login");
      return;
    }
    setAdding(true);
    try {
      await addItem({
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity: 1,
      });
    } catch {
      // addItem surfaces its own error toast.
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <Link
        href={`/products/${product.id}`}
        aria-label={product.name}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div
          role="img"
          aria-label={`${product.name} placeholder image`}
          className="flex h-40 items-center justify-center bg-muted/60 text-2xl font-semibold text-muted-foreground"
        >
          {getInitials(product.name)}
        </div>
      </Link>
      <CardHeader className="gap-1.5 pb-2">
        <Link
          href={`/products/${product.id}`}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CardTitle className="line-clamp-1">{product.name}</CardTitle>
        </Link>
        {product.description ? (
          <CardDescription className="line-clamp-2">
            {product.description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1 pb-3">
        {product.categories.length > 0 ? (
          product.categories.map((category) => (
            <Badge key={category.id} variant="secondary">
              {category.name}
            </Badge>
          ))
        ) : (
          <Badge variant="outline">Uncategorized</Badge>
        )}
      </CardContent>
      <CardFooter className="mt-auto items-center justify-between gap-2">
        <span className="text-lg font-semibold">
          {formatCurrency(product.price)}
        </span>
        <Button
          size="sm"
          onClick={() => {
            void handleAddToCart();
          }}
          disabled={adding}
        >
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ShoppingCart className="h-4 w-4" aria-hidden />
          )}
          {adding ? "Adding..." : "Add to cart"}
        </Button>
      </CardFooter>
    </Card>
  );
}