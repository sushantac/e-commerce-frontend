"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock } from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import type { OrderDetail, OrderStatus } from "@/lib/types";
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

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-4 w-20" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-12 w-40" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-end gap-8">
            <div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-6 w-24" />
            </div>
            <div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-6 w-24" />
            </div>
            <div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-6 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusIcon({ status }: { status: OrderStatus }) {
  switch (status) {
    case "PLACED":
      return <Clock className="h-5 w-5 text-muted-foreground" aria-hidden />;
    case "CONFIRMED":
      return <CheckCircle className="h-5 w-5 text-blue-600" aria-hidden />;
    case "SHIPPED":
      return <Truck className="h-5 w-5 text-blue-600" aria-hidden />;
    case "DELIVERED":
      return <CheckCircle className="h-5 w-5 text-green-600" aria-hidden />;
    case "CANCELLED":
      return <XCircle className="h-5 w-5 text-destructive" aria-hidden />;
    default:
      return <Clock className="h-5 w-5 text-muted-foreground" aria-hidden />;
  }
}

function OrderItemsTable({ items }: { items: OrderDetail["items"] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Unit Price</TableHead>
          <TableHead className="text-right">Line Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.productName}</TableCell>
            <TableCell className="text-right">{item.quantity}</TableCell>
            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
            <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function OrderSummaryCard({ order }: { order: OrderDetail }) {
  const subtotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = order.totalAmount - subtotal;

  return (
    <div className="flex justify-end gap-8 border-t pt-4">
      <div className="text-right">
        <p className="text-sm text-muted-foreground">Subtotal</p>
        <p className="font-medium">{formatCurrency(subtotal)}</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-muted-foreground">Estimated Tax</p>
        <p className="font-medium">{formatCurrency(tax)}</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-muted-foreground">Total</p>
        <p className="text-lg font-bold">{formatCurrency(order.totalAmount)}</p>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = React.useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    async function fetchOrder() {
      if (authLoading) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.get<OrderDetail>(`/orders/${orderId}`);
        if (active) setOrder(data);
      } catch (err) {
        if (active) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Failed to load order");
          }
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }
    fetchOrder();
    return () => {
      active = false;
    };
  }, [orderId, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <OrderDetailSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
            <h2 className="mt-4 text-xl font-semibold">Sign in required</h2>
            <p className="mt-2 text-muted-foreground">
              Please sign in to view your order details.
            </p>
            <Button asChild className="mt-6">
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
            <h2 className="mt-4 text-xl font-semibold">Order not found</h2>
            <p className="mt-2 text-muted-foreground">
              {error ?? "The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it."}
            </p>
            <Button asChild className="mt-6">
              <Link href="/orders">Back to Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/orders" aria-label="Back to orders">
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
          <p className="text-muted-foreground">{order.orderNumber}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusIcon status={order.status} />
          <Badge variant={getStatusBadgeVariant(order.status)} className="text-sm">
            {order.status}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Placed on {formatDate(order.orderDate)}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="font-mono font-medium">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p>{formatDate(order.orderDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer Email</p>
              <p>{order.customerEmail}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <OrderItemsTable items={order.items} />
          <OrderSummaryCard order={order} />
        </CardContent>
      </Card>

      <Button variant="outline" asChild className="w-full sm:w-auto">
        <Link href="/orders">
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
          Back to Orders
        </Link>
      </Button>
    </div>
  );
}