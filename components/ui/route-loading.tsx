import { LoadingSpinner, Skeleton } from "@/components/ui/feedback";

export function RouteLoading({ label }: { label: string }) {
  return (
    <div
      className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-10"
      role="status"
    >
      <LoadingSpinner label={label} />
      <Skeleton className="mt-6 h-12 max-w-sm" />
      <Skeleton className="mt-4 h-24 w-full" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-64 w-full" />
        ))}
      </div>
    </div>
  );
}
