"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, ChevronLeft, ChevronRight, Eye, RefreshCw } from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import type {
  AdminOrderSummary,
  AdminOrderDetail,
  AdminOrderItem,
  PaginatedAdminOrders,
  OrderStatus,
  UpdateOrderStatusRequest,
} from "@/lib/types";
import { getStatusBadgeVariant, formatCurrency, formatDate } from "@/lib/order-utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";

const STATUSES: OrderStatus[] = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAGE_SIZE = 10;

function AdminOrderRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
    </TableRow>
  );
}

function OrderItemsDialogContent({
  order,
}: {
  order: AdminOrderDetail | null;
}) {
  if (!order) return null;

  const subtotal = order.items.reduce((sum, item: AdminOrderItem) => sum + item.totalPrice, 0);
  const tax = order.totalAmount - subtotal;

  return (
    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Order Details - {order.orderNumber}</DialogTitle>
        <DialogDescription>
          Customer: {order.customerEmail} • Placed: {formatDate(order.orderDate)}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant={getStatusBadgeVariant(order.status)} className="text-sm">
            {order.status}
          </Badge>
        </div>
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
            {order.items.map((item) => (
              <TableRow key={item.productId}>
                <TableCell className="font-medium">{item.productName}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="border-t pt-4 flex justify-end gap-8">
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
      </div>
    </DialogContent>
  );
}

function StatusUpdateDialogContent({
  order,
  onStatusChange,
  isUpdating,
}: {
  order: AdminOrderSummary | null;
  onStatusChange: (status: OrderStatus) => Promise<void>;
  isUpdating: boolean;
}) {
  const [selectedStatus, setSelectedStatus] = React.useState<OrderStatus | "">("");

  React.useEffect(() => {
    if (order) setSelectedStatus(order.status);
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatus && selectedStatus !== order?.status) {
      await onStatusChange(selectedStatus);
    }
  };

  if (!order) return null;

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogDescription>
          Change the status for order {order.orderNumber}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="grid gap-2">
            <label htmlFor="status" className="text-sm font-medium">
              Current Status
            </label>
            <Badge variant={getStatusBadgeVariant(order.status)} className="text-sm w-fit">
              {order.status}
            </Badge>
          </div>
          <div className="grid gap-2">
            <label htmlFor="status" className="text-sm font-medium">
              New Status
            </label>
            <Select value={selectedStatus} onValueChange={(value: string) => setSelectedStatus(value as OrderStatus | "")} disabled={isUpdating}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status} disabled={status === order.status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setSelectedStatus("")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isUpdating || !selectedStatus || selectedStatus === order.status}>
            {isUpdating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Updating...
              </>
            ) : (
              "Update Status"
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [orders, setOrders] = React.useState<AdminOrderSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalElements, setTotalElements] = React.useState(0);
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<AdminOrderDetail | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);
  const [orderToUpdate, setOrderToUpdate] = React.useState<AdminOrderSummary | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

  const isAdmin = user?.role === "ADMIN";

  const fetchOrders = React.useCallback(async (page: number, status: OrderStatus | "ALL") => {
    if (authLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, size: PAGE_SIZE };
      if (status !== "ALL") params.status = status;
      const data = await api.get<PaginatedAdminOrders>("/admin/orders", params);
      setOrders(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load orders");
      }
    } finally {
      setIsLoading(false);
    }
  }, [authLoading]);

  React.useEffect(() => {
    if (!authLoading) {
      fetchOrders(currentPage, statusFilter);
    }
  }, [currentPage, statusFilter, authLoading, fetchOrders]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const filteredOrders = orders.filter((order) =>
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetail = async (orderId: number) => {
    try {
      const data = await api.get<AdminOrderDetail>(`/admin/orders/${orderId}`);
      setSelectedOrder(data);
      setDetailDialogOpen(true);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (order: AdminOrderSummary) => {
    setOrderToUpdate(order);
    setStatusDialogOpen(true);
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!orderToUpdate) return;
    setIsUpdatingStatus(true);
    try {
      const request: UpdateOrderStatusRequest = { status: newStatus };
      await api.put<{ status: OrderStatus }>(`/admin/orders/${orderToUpdate.id}/status`, request);
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderToUpdate.id ? { ...o, status: newStatus } : o))
      );
      setStatusDialogOpen(false);
      setOrderToUpdate(null);
    } catch (_err) {
      toast({
        title: "Error",
        description: _err instanceof Error ? _err.message : "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/admin/orders?${params.toString()}`);
  };

  if (authLoading || isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  placeholder="Search orders..."
                  disabled
                  className="pl-10"
                />
              </div>
              <Select disabled>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <AdminOrderRowSkeleton key={i} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="mt-2 text-muted-foreground">
              Admin access required to view this page.
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
          <CardContent className="pt-6">
            <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md" role="alert">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Orders</h1>
          <p className="text-muted-foreground">View and update order statuses</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                placeholder="Search by order number..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                aria-label="Search orders"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value as OrderStatus | "ALL")}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" aria-hidden />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
              <h3 className="mt-4 text-lg font-medium">No orders found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try adjusting your filters"
                  : "No orders in the system yet"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">{order.orderNumber}</TableCell>
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetail(order.id)}
                            aria-label={`View order ${order.orderNumber}`}
                          >
                            <Eye className="h-4 w-4" aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStatusUpdate(order)}
                            aria-label={`Update status for order ${order.orderNumber}`}
                          >
                            <RefreshCw className="h-4 w-4" aria-hidden />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                        <PaginationPrevious
                          onClick={() => handlePageChange(currentPage - 1)}
                          href="#"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span>Previous</span>
                        </PaginationPrevious>
                      )}
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={page === currentPage}
                          aria-label={`Page ${page + 1}`}
                          href="#"
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
                        <PaginationNext
                          onClick={() => handlePageChange(currentPage + 1)}
                          href="#"
                        >
                          <span>Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </PaginationNext>
                      )}
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
              <p className="mt-4 text-sm text-muted-foreground text-center">
                Showing {filteredOrders.length > 0 ? currentPage * PAGE_SIZE + 1 : 0} to{" "}
                {Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} of {totalElements} orders
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        {OrderItemsDialogContent({ order: selectedOrder })}
      </Dialog>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        {StatusUpdateDialogContent({
          order: orderToUpdate,
          onStatusChange: handleStatusChange,
          isUpdating: isUpdatingStatus,
        })}
      </Dialog>
    </div>
  );
}