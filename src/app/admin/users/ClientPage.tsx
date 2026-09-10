"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Users, Mail, Calendar, Package, ChevronLeft, ChevronRight } from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import type {
  AdminUserSummary,
  AdminUserDetail,
  PaginatedAdminUsers,
} from "@/lib/types";
import { formatDate } from "@/lib/order-utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 10;

function AdminUserRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
    </TableRow>
  );
}

function UserDetailDialogContent({
  user,
}: {
  user: AdminUserDetail | null;
}) {
  if (!user) return null;

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>User Details</DialogTitle>
        <DialogDescription>{user.email}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid gap-2">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p>{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p>{user.fullName}</p>
            </div>
          </div>
          {user.phoneNumber && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" aria-hidden />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p>{user.phoneNumber}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-sm text-muted-foreground">Registered</p>
              <p>{formatDate(user.createdAt)}</p>
            </div>
          </div>
          {user.lastLoginAt && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
              <div>
                <p className="text-sm text-muted-foreground">Last Login</p>
                <p>{formatDate(user.lastLoginAt)}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Package className="h-4 w-4 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="font-medium">{user.orderCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
              {user.role}
            </Badge>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = React.useState<AdminUserSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalElements, setTotalElements] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<AdminUserDetail | null>(null);

  const isAdmin = user?.role === "ADMIN";

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUsers = React.useCallback(async (page: number, search: string) => {
    if (authLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, size: PAGE_SIZE };
      if (search) params.search = search;
      const data = await api.get<PaginatedAdminUsers>("/admin/users", params);
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (_err) {
      if (_err instanceof Error) {
        setError(_err.message);
      } else {
        setError("Failed to load users");
      }
    } finally {
      setIsLoading(false);
    }
  }, [authLoading]);

  React.useEffect(() => {
    if (!authLoading) {
      fetchUsers(currentPage, debouncedSearch);
    }
  }, [currentPage, debouncedSearch, authLoading, fetchUsers]);

  const handleViewDetail = async (userId: number) => {
    try {
      const data = await api.get<AdminUserDetail>(`/admin/users/${userId}`);
      setSelectedUser(data);
      setDetailDialogOpen(true);
    } catch {
      // Error handled by dialog not opening
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    if (debouncedSearch) params.set("search", debouncedSearch);
    router.push(`/admin/users?${params.toString()}`);
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
            <div className="mb-6">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input placeholder="Search users..." disabled className="pl-10" />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <AdminUserRowSkeleton key={i} />
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
          <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
          <p className="text-muted-foreground">View and manage registered users</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-6">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Search users"
              />
            </div>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
              <h3 className="mt-4 text-lg font-medium">No users found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchQuery ? "Try adjusting your search" : "No users in the system yet"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.id}
                      onClick={() => handleViewDetail(user.id)}
                      className="cursor-pointer hover:bg-muted/50"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleViewDetail(user.id);
                        }
                      }}
                      aria-label={`View user ${user.email}`}
                    >
                      <TableCell className="font-mono text-sm">{user.id}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <Pagination className="mt-6" aria-label="User pages">
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
                Showing {users.length > 0 ? currentPage * PAGE_SIZE + 1 : 0} to{" "}
                {Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} of {totalElements} users
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        {UserDetailDialogContent({ user: selectedUser })}
      </Dialog>
    </div>
  );
}