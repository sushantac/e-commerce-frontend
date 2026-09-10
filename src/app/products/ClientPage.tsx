"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

import { ProductCard } from "@/components/product-card";
import { api } from "@/lib/api";
import type { Category, Paginated, Product } from "@/lib/types";

import { ProductGridSkeleton } from "@/components/skeletons";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const DEFAULT_SIZE = 20;
const PRICE_MAX = 1000;

type SortOption = "relevance" | "price_asc" | "price_desc" | "newest";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

function mapSortToApi(sort: SortOption): string {
  switch (sort) {
    case "price_asc":
      return "price_asc";
    case "price_desc":
      return "price_desc";
    case "newest":
      return "newest";
    default:
      return "";
  }
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState(searchParams.get("q") || "");
  const [category, setCategory] = React.useState(searchParams.get("category") || "");
  const [minPrice, setMinPrice] = React.useState<number | "">(searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : "");
  const [maxPrice, setMaxPrice] = React.useState<number | "">(searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : "");
  const [sort, setSort] = React.useState<SortOption>((searchParams.get("sort") as SortOption) || "relevance");
  const [page, setPage] = React.useState(Number(searchParams.get("page")) || 0);

  const debouncedSearch = React.useRef(search);
  const debounceTimer = React.useRef<NodeJS.Timeout | null>(null);

  const totalElements = React.useRef(0);
  const totalPages = React.useRef(1);

  const startIndex = page * DEFAULT_SIZE + 1;
  const endIndex = Math.min((page + 1) * DEFAULT_SIZE, totalElements.current);

  const hasActiveFilters = search || category || minPrice !== "" || maxPrice !== "" || sort !== "relevance";

  const buildParams = React.useCallback((): Record<string, string | number> => {
    const params: Record<string, string | number> = {};
    if (debouncedSearch.current) params.q = debouncedSearch.current;
    if (category) params.category = category;
    if (minPrice !== "") params.minPrice = minPrice;
    if (maxPrice !== "") params.maxPrice = maxPrice;
    const sortValue = mapSortToApi(sort);
    if (sortValue) params.sort = sortValue;
    params.page = page;
    params.size = DEFAULT_SIZE;
    return params;
  }, [category, minPrice, maxPrice, sort, page]);

  const paramsToString = React.useCallback((params: Record<string, string | number>) => {
    return new URLSearchParams(params as Record<string, string>).toString();
  }, []);

  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams();
      const data = await api.get<Paginated<Product>>("/products", params);
      totalElements.current = data.totalElements;
      totalPages.current = data.totalPages;
      setProducts(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const fetchCategories = React.useCallback(async () => {
    try {
      const data = await api.get<Category[]>("/categories");
      setCategories(data);
    } catch {
      // Ignore category load errors
    }
  }, []);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  React.useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      debouncedSearch.current = search;
      setPage(0);
      fetchProducts();
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search, fetchProducts]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  React.useEffect(() => {
    const params = buildParams();
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [category, minPrice, maxPrice, sort, page, pathname, router, buildParams]);

  const clearFilters = React.useCallback(() => {
    setSearch("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSort("relevance");
    setPage(0);
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb className="mb-6" aria-label="Breadcrumb">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Products</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6 shrink-0">
          <div className="space-y-2">
            <label htmlFor="search" className="block text-sm font-medium">
              Search
            </label>
            <Input
              id="search"
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search products"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="block text-sm font-medium">
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Price Range</label>
            <Slider
              min={0}
              max={PRICE_MAX}
              step={10}
              value={[
                minPrice === "" ? 0 : minPrice,
                maxPrice === "" ? PRICE_MAX : maxPrice,
              ]}
              onValueChange={(v) => {
                setMinPrice(v[0] === 0 ? "" : v[0]);
                setMaxPrice(v[1] === PRICE_MAX ? "" : v[1]);
              }}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Min: {minPrice === "" ? "$0" : `$${minPrice}`}
              </span>
              <span>
                Max: {maxPrice === "" ? `$${PRICE_MAX}` : `$${maxPrice}`}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="sort" className="block text-sm font-medium">
              Sort by
            </label>
            <Select value={sort} onValueChange={(v: SortOption) => setSort(v)}>
              <SelectTrigger id="sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              className="w-full"
              onClick={clearFilters}
              aria-label="Clear all filters"
            >
              <X className="h-4 w-4 mr-2" aria-hidden />
              Clear filters
            </Button>
          )}
        </aside>

        <main className="flex-1 min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <span className="text-sm text-muted-foreground">
              {totalElements.current > 0
                ? `Showing ${startIndex}–${endIndex} of ${totalElements.current} results`
                : "No products found"}
            </span>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <ProductGridSkeleton count={DEFAULT_SIZE} />
          ) : products.length === 0 ? (
            <Card className="py-12 text-center">
              <CardHeader>
                <CardTitle>No products found</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilters ? "Try adjusting your filters." : "No products available yet."}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages.current > 1 && (
                <Pagination className="justify-center">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href={page > 0 ? `${pathname}?${paramsToString(buildParams()).replace(`page=${page}`, `page=${page - 1}`)}` : undefined}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages.current }, (_, i) => i).map((p) => (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href={`${pathname}?${paramsToString(buildParams()).replace(`page=${page}`, `page=${p}`)}`}
                          isActive={p === page}
                        >
                          {p + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href={page < totalPages.current - 1 ? `${pathname}?${paramsToString(buildParams()).replace(`page=${page}`, `page=${page + 1}`)}` : undefined}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}