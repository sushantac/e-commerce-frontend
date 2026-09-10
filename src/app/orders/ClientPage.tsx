"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, ChevronLeft, ChevronRight } from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import type { OrderSummary, Paginated } from "@/lib/types";
import { getStatusBadgeVariant, formatCurrency, formatDate } from "@/lib/order-utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 10;

function OrderRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
    </TableRow>
  );
}

function OrdersTable({
  orders,
  isLoading,
  onRowClick,
}: {
  orders: OrderSummary[];
  isLoading: boolean;
  onRowClick: (id: number) => void;
}) {
  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Number</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <OrderRowSkeleton key={i} />
          ))}
        </TableBody>
      </Table>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
        <h3 className="mt-4 text-lg font-medium">No orders yet</h3>
        <p className="mt-2 text-muted-foreground">
          You haven&apos;t placed any orders yet.
        </p>
        <Button asChild className="mt-6">
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order Number</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow
            key={order.id}
            onClick={() => onRowClick(order.id)}
            className="cursor-pointer hover:bg-muted/50"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRowClick(order.id);
              }
            }}
            aria-label={`View order ${order.orderNumber}`}
          >
            <TableCell className="font-mono">{order.orderNumber}</TableCell>
            <TableCell>{formatDate(order.orderDate)}</TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(order.status)}>
                {order.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(order.totalAmount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = React.useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalElements, setTotalElements] = React.useState(0);

  const pageFromUrl = searchParams.get("page");
  const initialPage = pageFromUrl ? parseInt(pageFromUrl, 10) : 0;

  React.useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  const fetchOrders = React.useCallback(async (page: number) => {
    if (authLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<Paginated<OrderSummary>>("/orders", {
        page,
        size: PAGE_SIZE,
      });
      setOrders(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (_err) {
      if (_err instanceof Error) {
        setError(_err.message);
      } else {
        setError("Failed to load orders");
      }
    } finally {
      setIsLoading(false);
    }
  }, [authLoading]);

  React.useEffect(() => {
    if (!authLoading) {
      fetchOrders(currentPage);
    }
  }, [currentPage, authLoading, fetchOrders]);

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <OrderRowSkeleton key={i} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
        </div>
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
            <h2 className="mt-4 text-xl font-semibold">Sign in required</h2>
            <p className="mt-2 text-muted-foreground">
              Please sign in to view your order history.
            </p>
            <Button asChild className="mt-6">
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {error && (
            <div className="mb-4 p-4 text-sm text-destructive bg-destructive/10 rounded-md" role="alert">
              {error}
            </div>
          )}
          <OrdersTable
            orders={orders}
            isLoading={isLoading}
            onRowClick={(id) => router.push(`/orders/${id}`)}
          />
          {totalPages > 1 && (
            <Pagination className="mt-6" aria-label="Order pages">
              <PaginationContent>
                <PaginationItem>
                  {currentPage === 0 ? (
                    <PaginationPrevious aria-disabled="true" className="opacity-50 pointer-events-none">
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </PaginationPrevious>
                  ) : (
                    <PaginationPrevious href={`/orders?page=${currentPage - 1}`}>
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </PaginationPrevious>
                  )}
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href={`/orders?page=${page}`}
                      isActive={page === currentPage}
                      aria-label={`Page ${page + 1}`}
                    >
                      {page + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  {currentPage === totalPages - 1 ? (
                    <PaginationNext aria-disabled="true" className="opacity-50 pointer-events-none">
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </PaginationNext>
                  ) : (
                    <PaginationNext href={`/orders?page=${currentPage + 1}`}>
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </PaginationNext>
                  )}
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
          {totalElements > 0 && (
            <p className="mt-4 text-sm text-muted-foreground text-center">
              Showing {currentPage * PAGE_SIZE + 1} to {Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} of {totalElements} orders
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}