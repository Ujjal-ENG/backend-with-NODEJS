import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PricingCards } from "@/components/dashboard/pricing-cards";
import { getCurrentUserPlan } from "@/lib/api/plans";
import { getSession } from "@/lib/auth";
import type { CurrentUserPlan } from "@/types/api";
import { UserPlan } from "@/types/entities";

export const metadata: Metadata = { title: "Plans & Pricing" };

export default async function PricingPage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  let currentPlan: CurrentUserPlan;

  try {
    currentPlan = await getCurrentUserPlan();
  } catch {
    // Graceful fallback if plan endpoint is unavailable.
    // Keeps pricing page usable with session-derived defaults.
    currentPlan = {
      userId: session.id,
      plan: session.plan ?? UserPlan.FREE,
      planLabel: "Free",
      dailyPostCreationLimit: 5,
      canEditPosts: false,
      apiRateLimitMultiplier: 2,
      postCreationBurstLimit: 5,
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plans & Pricing</h1>
        <p className="text-sm text-muted-foreground">
          Choose a plan. Payment is mocked, and buying a plan immediately
          updates limits for your account.
        </p>
      </div>

      <PricingCards currentPlan={currentPlan} />
    </div>
  );
}
