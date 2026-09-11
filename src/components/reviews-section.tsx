"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2, MessageSquareText, PenLine } from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import type { PaginatedReviews, Review, ReviewSummary } from "@/lib/types";
import { formatDate } from "@/lib/order-utils";

import { StarRating } from "@/components/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function ReviewsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="space-y-2 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <StarRating value={review.rating} size="sm" ariaLabel={`Rated ${review.rating} out of 5`} />
        {review.verifiedPurchase && (
          <Badge variant="secondary" className="gap-1">
            <BadgeCheck className="h-3 w-3" aria-hidden />
            Verified Purchase
          </Badge>
        )}
      </div>
      {review.title && <p className="font-semibold">{review.title}</p>}
      {review.body && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{review.body}</p>}
      <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
    </div>
  );
}

function WriteReviewDialog({
  productId,
  onSubmitted,
}: {
  productId: number;
  onSubmitted: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?next=/products/${productId}`);
      return;
    }
    setSubmitting(true);
    try {
      await api.post<Review>("/reviews", {
        productId,
        rating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
      });
      toast({
        title: "Review submitted",
        description: "Thanks! Your review is pending moderation.",
      });
      setOpen(false);
      setTitle("");
      setBody("");
      setRating(5);
      onSubmitted();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to submit review",
        description: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PenLine className="mr-2 h-4 w-4" aria-hidden />
          Write a review
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Write a review</DialogTitle>
          <DialogDescription>
            Share your experience with this product. Reviews are published after moderation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Your rating</Label>
            <StarRating value={rating} onChange={setRating} size="lg" ariaLabel="Choose a star rating" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-title">Title (optional)</Label>
            <Input
              id="review-title"
              value={title}
              maxLength={160}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your review"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-body">Review (optional)</Label>
            <textarea
              id="review-body"
              value={body}
              maxLength={5000}
              rows={4}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
              placeholder="What did you like or dislike?"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Submit review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ReviewsSection({ productId }: { productId: number }) {
  const [summary, setSummary] = React.useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchAll = React.useCallback(async () => {
    try {
      const [summaryData, reviewsData] = await Promise.all([
        api.get<ReviewSummary>(`/products/${productId}/reviews/summary`),
        api.get<PaginatedReviews>(`/products/${productId}/reviews`, { size: 10 }),
      ]);
      setSummary(summaryData);
      setReviews(reviewsData.content);
    } catch {
      // Reviews are optional — fail silently so the product page still renders
    } finally {
      setLoading(false);
    }
  }, [productId]);

  React.useEffect(() => {
    setLoading(true);
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <section className="mt-16" aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className="mb-4 text-2xl font-bold">
          Reviews
        </h2>
        <ReviewsSkeleton />
      </section>
    );
  }

  const total = summary?.totalReviews ?? 0;
  const average = summary?.averageRating ?? 0;
  const distribution = summary?.ratingDistribution ?? {};
  const maxBucket = Math.max(1, ...[1, 2, 3, 4, 5].map((s) => Number(distribution[String(s)] ?? 0)));

  return (
    <section className="mt-16" aria-labelledby="reviews-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="reviews-heading" className="text-2xl font-bold">
          Reviews {total > 0 && <span className="text-muted-foreground">({total})</span>}
        </h2>
        <WriteReviewDialog productId={productId} onSubmitted={fetchAll} />
      </div>

      {total === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <MessageSquareText className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-muted-foreground">No reviews yet — be the first to review this product.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rating summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold">{average.toFixed(1)}</span>
                <div>
                  <StarRating value={average} ariaLabel={`Average rating ${average.toFixed(1)} out of 5`} />
                  <p className="mt-1 text-xs text-muted-foreground">{total} verified review{total === 1 ? "" : "s"}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = Number(distribution[String(stars)] ?? 0);
                  return (
                    <div key={stars} className="flex items-center gap-2 text-xs">
                      <span className="w-6 shrink-0 text-muted-foreground">{stars}★</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{ width: `${(count / maxBucket) * 100}%` }}
                        />
                      </div>
                      <span className="w-6 shrink-0 text-right text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="divide-y px-6 py-2">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </CardContent>
          </Card>
        </div>
      )}
      <Separator className="mt-8" />
    </section>
  );
}
