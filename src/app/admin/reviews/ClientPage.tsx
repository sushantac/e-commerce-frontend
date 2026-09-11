"use client";

import * as React from "react";
import Link from "next/link";
import { BadgeCheck, Check, ChevronLeft, ChevronRight, MessageSquareText, X } from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import type { PaginatedReviews, Review, ReviewStatus } from "@/lib/types";
import { formatDate } from "@/lib/order-utils";

import { StarRating } from "@/components/star-rating";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PAGE_SIZE = 10;
const STATUSES: ReviewStatus[] = ["PENDING", "APPROVED", "REJECTED"];

function statusVariant(status: ReviewStatus): "default" | "secondary" | "destructive" {
  switch (status) {
    case "APPROVED":
      return "default";
    case "REJECTED":
      return "destructive";
    default:
      return "secondary";
  }
}

export default function AdminReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = React.useState<ReviewStatus>("PENDING");
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [totalPages, setTotalPages] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [actingId, setActingId] = React.useState<number | null>(null);

  const isAdmin = user?.role === "ADMIN";

  const fetchReviews = React.useCallback(
    async (page: number, filter: ReviewStatus) => {
      if (authLoading || !isAdmin) return;
      setLoading(true);
      try {
        const data = await api.get<PaginatedReviews>("/admin/reviews", {
          status: filter,
          page,
          size: PAGE_SIZE,
        });
        setReviews(data.content);
        setTotalPages(data.totalPages);
        setCurrentPage(data.page);
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Failed to load reviews",
          description: err instanceof Error ? err.message : "Please try again",
        });
      } finally {
        setLoading(false);
      }
    },
    [authLoading, isAdmin]
  );

  React.useEffect(() => {
    setCurrentPage(0);
    fetchReviews(0, status);
  }, [status, fetchReviews]);

  const handleModerate = async (id: number, approve: boolean) => {
    setActingId(id);
    try {
      await api.post<Review>(`/admin/reviews/${id}/${approve ? "approve" : "reject"}`);
      toast({
        title: approve ? "Review approved" : "Review rejected",
        description: approve ? "The review is now visible on the product page." : undefined,
      });
      fetchReviews(currentPage, status);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Moderation failed",
        description: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setActingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-64 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="mt-2 text-muted-foreground">Admin access required to view this page.</p>
            <Button asChild className="mt-6">
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Review Moderation</h1>
        <p className="text-muted-foreground">Approve or reject customer reviews</p>
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as ReviewStatus)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareText className="h-5 w-5" aria-hidden />
            {status.charAt(0) + status.slice(1).toLowerCase()} reviews
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No {status.toLowerCase()} reviews.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <Link href={`/products/${review.productId}`} className="hover:underline">
                          #{review.productId}
                        </Link>
                        {review.verifiedPurchase && (
                          <Badge variant="secondary" className="ml-2 gap-1">
                            <BadgeCheck className="h-3 w-3" aria-hidden />
                            Verified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <StarRating value={review.rating} size="sm" />
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {review.title && <p className="font-medium">{review.title}</p>}
                        {review.body && (
                          <p className="truncate text-sm text-muted-foreground">{review.body}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(review.status)}>{review.status}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actingId === review.id}
                            onClick={() => handleModerate(review.id, true)}
                            aria-label={`Approve review ${review.id}`}
                          >
                            <Check className="h-4 w-4" aria-hidden />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actingId === review.id}
                            onClick={() => handleModerate(review.id, false)}
                            aria-label={`Reject review ${review.id}`}
                          >
                            <X className="h-4 w-4" aria-hidden />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage === 0}
                    onClick={() => fetchReviews(currentPage - 1, status)}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => fetchReviews(currentPage + 1, status)}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
