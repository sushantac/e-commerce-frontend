"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { PageSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";
import type { Category, Paginated, Product } from "@/lib/types";

export default function HomePage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;

    async function loadCatalog() {
      try {
        const [categoryList, productPage] = await Promise.all([
          api.get<Category[]>("/categories"),
          api.get<Paginated<Product>>("/products", { page: 0, size: 8 }),
        ]);
        if (!active) return;
        setCategories(categoryList);
        setProducts(productPage.content);
      } catch {
        // The api client handles error toasts, token refresh, and redirects.
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadCatalog();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="flex flex-col items-center gap-4 py-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Shopsphere — Everything you need
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Discover curated products across electronics, clothing, accessories,
          and more.
        </p>
        <Button asChild size="lg" className="mt-2">
          <Link href="/products">
            Browse products
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </section>

      {categories.length > 0 && (
        <section className="py-8" aria-labelledby="categories-heading">
          <div className="flex items-center justify-between gap-4">
            <h2
              id="categories-heading"
              className="text-2xl font-semibold tracking-tight"
            >
              Featured categories
            </h2>
            <Button variant="ghost" asChild>
              <Link href="/products">
                View all
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${encodeURIComponent(category.name)}`}
                className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="h-full transition-colors hover:bg-accent/50">
                  <CardHeader>
                    <CardTitle className="line-clamp-1">
                      {category.name}
                    </CardTitle>
                    {category.description && (
                      <CardDescription className="line-clamp-2">
                        {category.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="py-8" aria-labelledby="products-heading">
        <div className="flex items-center justify-between gap-4">
          <h2
            id="products-heading"
            className="text-2xl font-semibold tracking-tight"
          >
            Featured products
          </h2>
          <Button variant="ghost" asChild>
            <Link href="/products">
              View all
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}