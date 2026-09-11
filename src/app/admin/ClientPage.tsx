"use client";

import * as React from "react";
import Link from "next/link";
import { Package, Users, DollarSign, ArrowRight, MessageSquareText } from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import type { DashboardResponse, AdminOrderSummary } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/order-utils";

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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getStatusBadgeVariant } from "@/lib/order-utils";

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-4 h-8 w-24" />
          </div>
          <Skeleton className="h-12 w-12 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function RecentOrdersSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  linkHref,
  linkLabel,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-${iconColor}/10`}>
            <Icon className={`h-6 w-6 text-${iconColor}`} aria-hidden />
          </div>
        </div>
        {linkHref && (
          <Button variant="ghost" asChild className="mt-4 w-full justify-start">
            <Link href={linkHref} className="flex items-center gap-1">
              {linkLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function RecentOrdersTable({ orders }: { orders: AdminOrderSummary[] }) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-center py-8">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
          <p className="mt-4 text-muted-foreground">No recent orders</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-mono">
                  <Link href={`/admin/orders`} className="hover:underline">
                    {order.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>{order.customerEmail}</TableCell>
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
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();

  const [dashboard, setDashboard] = React.useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    async function fetchDashboard() {
      if (authLoading) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.get<DashboardResponse>("/admin/dashboard");
        if (active) setDashboard(data);
      } catch (err) {
        if (active) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Failed to load dashboard");
          }
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }
    fetchDashboard();
    return () => {
      active = false;
    };
  }, [authLoading]);

  const isAdmin = user?.role === "ADMIN";

  if (authLoading || isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <RecentOrdersSkeleton />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center py-12">
            <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold">Access Denied</h2>
            <p className="mt-2 text-muted-foreground">
              You don&apos;t have permission to access the admin dashboard.
            </p>
            <Button asChild className="mt-6">
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <h2 className="text-xl font-semibold text-destructive">Error</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your store performance</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Orders"
          value={dashboard!.totalOrders.toLocaleString()}
          icon={Package}
          iconColor="blue"
          linkHref="/admin/orders"
          linkLabel="View all orders"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(dashboard!.totalRevenue)}
          icon={DollarSign}
          iconColor="green"
        />
        <StatCard
          title="Total Users"
          value={dashboard!.totalUsers.toLocaleString()}
          icon={Users}
          iconColor="purple"
          linkHref="/admin/users"
          linkLabel="Manage users"
        />
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">Manage Orders</TabsTrigger>
          <TabsTrigger value="users">Manage Users</TabsTrigger>
          <TabsTrigger value="reviews">Moderate Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <RecentOrdersTable orders={dashboard!.recentOrders} />
          <div className="mt-4 text-center">
            <Button asChild>
              <Link href="/admin/orders">View All Orders</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
            <h3 className="mt-4 text-lg font-medium">User Management</h3>
            <p className="mt-2 text-muted-foreground">
              View and manage all registered users.
            </p>
            <Button asChild className="mt-6">
              <Link href="/admin/users">Manage Users</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="reviews">
          <div className="text-center py-8">
            <MessageSquareText className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
            <h3 className="mt-4 text-lg font-medium">Review Moderation</h3>
            <p className="mt-2 text-muted-foreground">
              Approve or reject customer product reviews.
            </p>
            <Button asChild className="mt-6">
              <Link href="/admin/reviews">Moderate Reviews</Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}