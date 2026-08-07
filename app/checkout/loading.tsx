import { Section } from "@/components/layout/Section";
import { Skeleton } from "@/components/ui/skeleton";

/** Next's file-based Suspense boundary for app/checkout/page.tsx's async cart + payment-gateway fetch. */
export default function CheckoutLoading() {
  return (
    <Section heading="Checkout">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </Section>
  );
}
