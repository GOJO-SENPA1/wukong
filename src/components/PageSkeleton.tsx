import { Container, Skeleton } from "./ui";

/** The shape of a task or profile page while it loads, so navigation never shows a blank screen. */
export function PageSkeleton({ kind }: { kind: "task" | "profile" }) {
  if (kind === "profile") {
    return (
      <div role="status" aria-label="Loading profile">
        <div className="border-b border-line">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-7 px-4 py-14 sm:px-6 lg:px-8">
            <Skeleton className="h-28 w-28 shrink-0 !rounded-full" />
            <div className="flex flex-1 flex-col gap-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-14 w-2/3" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
          </div>
        </div>
        <Container className="grid gap-4 !pt-8 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 !rounded-[18px]" />
          ))}
          <Skeleton className="h-96 !rounded-[18px] sm:col-span-2" />
          <Skeleton className="h-96 !rounded-[18px]" />
        </Container>
      </div>
    );
  }
  return (
    <div role="status" aria-label="Loading task" className="flex flex-col gap-6">
      <Skeleton className="h-4 w-60" />
      <div className="flex gap-2">
        <Skeleton className="h-7 w-40 !rounded-full" />
        <Skeleton className="h-7 w-28 !rounded-full" />
      </div>
      <Skeleton className="h-16 w-3/4" />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Skeleton className="h-96 !rounded-[18px]" />
        <Skeleton className="h-96 !rounded-[18px]" />
      </div>
    </div>
  );
}
