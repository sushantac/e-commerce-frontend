import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <CardHeader className="gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
      </CardHeader>
      <CardContent className="flex gap-1 pt-0">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24" />
      </CardContent>
      <div className="flex items-center justify-between gap-2 p-6 pt-0">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-8 w-28" />
      </div>
    </Card>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function CategoryGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-12">
      <div className="space-y-3">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <CategoryGridSkeleton />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-5 w-44" />
        <ProductGridSkeleton />
      </div>
    </div>
  );
}

export default PageSkeleton;