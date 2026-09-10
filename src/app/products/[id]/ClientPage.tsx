"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatCurrency, getInitials } from "@/lib/utils";
import type { Paginated, Product } from "@/lib/types";

function ProductSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card>
          <CardContent className="aspect-square">
            <div className="w-full h-full animate-pulse bg-muted" />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}

function RelatedProductsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="aspect-square">
            <div className="w-full h-full animate-pulse bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = React.useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingRelated, setLoadingRelated] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [quantity, setQuantity] = React.useState(1);
  const [adding, setAdding] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    api
      .get<Product>(`/products/${productId}`)
      .then((data) => {
        if (active) {
          setProduct(data);
          setQuantity(Math.min(1, data.stockQuantity > 0 ? 1 : 0));
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load product");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [productId]);

  React.useEffect(() => {
    if (!product?.categories?.[0]) return;

    let active = true;
    setLoadingRelated(true);

    const firstCategory = product.categories[0].name;
    api
      .get<Paginated<Product>>("/products", {
        category: firstCategory,
        size: 5,
      })
      .then((data) => {
        if (active) {
          const filtered = data.content.filter((p) => p.id !== product.id).slice(0, 4);
          setRelatedProducts(filtered);
        }
      })
      .catch(() => {
        // Ignore related products errors
      })
      .finally(() => {
        if (active) setLoadingRelated(false);
      });

    return () => {
      active = false;
    };
  }, [product]);

  const handleAddToCart = async () => {
    if (!product || product.stockQuantity <= 0) return;
    if (!user) {
      router.push(`/login?next=/products/${productId}`);
      return;
    }
    setAdding(true);
    try {
      await addItem({
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity,
      });
      toast({
        title: "Added to cart",
        description: `${product.name} (${quantity}) added to your cart.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to add",
        description: err instanceof Error ? err.message : "Could not add to cart",
      });
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <ProductSkeleton />;
  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-2xl text-center">
          <CardHeader>
            <CardTitle>Product not found</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/products">Browse all products</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!product) return <ProductSkeleton />;

  const inStock = product.stockQuantity > 0;
  const productImage = getInitials(product.name);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb className="mb-6" aria-label="Breadcrumb">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/products">Products</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card>
          <CardContent className="aspect-square flex items-center justify-center bg-muted relative overflow-hidden">
            <span className="text-6xl font-bold text-muted-foreground/50 select-none">
              {productImage}
            </span>
            {!inStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="destructive" className="text-lg px-4 py-2">
                  Out of Stock
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {product.categories?.length && (
            <div className="flex flex-wrap gap-2">
              {product.categories.map((cat) => (
                <Badge key={cat.id} variant="secondary">{cat.name}</Badge>
              ))}
            </div>
          )}

          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          <p className="text-4xl font-bold text-primary">{formatCurrency(product.price)}</p>

          <Separator />

          <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>

          <Separator />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={inStock ? "default" : "destructive"}>
                {inStock ? `In stock (${product.stockQuantity})` : "Out of stock"}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-4">
            <label htmlFor="quantity" className="text-sm font-medium">
              Quantity
            </label>
            <div className="inline-flex items-center border rounded-md overflow-hidden">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-10 w-10"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </Button>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={Math.min(10, product.stockQuantity)}
                value={quantity}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(Math.min(10, product.stockQuantity), Number(e.target.value) || 1));
                  setQuantity(val);
                }}
                className="w-16 text-center border-0 focus-visible:ring-0"
                disabled={!inStock}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-10 w-10"
                disabled={quantity >= Math.min(10, product.stockQuantity)}
                onClick={() => setQuantity((q) => Math.min(Math.min(10, product.stockQuantity), q + 1))}
                aria-label="Increase quantity"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={handleAddToCart}
            disabled={adding || !inStock}
          >
            {adding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Adding...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" aria-hidden />
                Add to Cart
              </>
            )}
          </Button>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16" aria-labelledby="related-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="related-heading" className="text-2xl font-bold">
              You may also like
            </h2>
          </div>
          {loadingRelated ? (
            <RelatedProductsSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <Link key={p.id} href={`/products/${p.id}`} className="group">
                  <Card className="transition-shadow hover:shadow-lg">
                    <CardContent className="aspect-square flex items-center justify-center bg-muted">
                      <span className="text-4xl font-bold text-muted-foreground/50 select-none">
                        {getInitials(p.name)}
                      </span>
                    </CardContent>
                    <CardFooter className="p-4">
                      <h3 className="font-medium truncate">{p.name}</h3>
                      <p className="text-lg font-bold text-primary mt-1">
                        {formatCurrency(p.price)}
                      </p>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}