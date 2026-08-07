import { Section } from "@/components/layout/Section";
import { Skeleton } from "@/components/ui/skeleton";

/** Next's file-based Suspense boundary for app/cart/page.tsx's async cart fetch. */
export default function CartLoading() {
  return (
    <Section heading="Cart">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex gap-4 border-b border-border pb-6 last:border-b-0">
              <Skeleton className="aspect-square w-24 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </Section>
  );
}
