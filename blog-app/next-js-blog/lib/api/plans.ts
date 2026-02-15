import { apiFetch } from "@/lib/api-client";
import type { CurrentUserPlan, PurchasePlanResult } from "@/types/api";
import { UserPlan } from "@/types/entities";

/**
 * Fetches current user's resolved plan and feature limits.
 * Used by dashboard pricing page for initial render.
 */
export async function getCurrentUserPlan() {
  return apiFetch<CurrentUserPlan>("/users/me/plan", {
    cache: "no-store",
    tags: ["current-user-plan"],
  });
}

/**
 * Calls backend mock-purchase endpoint for paid plans.
 * Free plan is intentionally blocked at client layer for clearer UX.
 */
export async function purchaseCurrentUserPlan(plan: UserPlan) {
  if (plan === UserPlan.FREE) {
    throw new Error("Free plan cannot be purchased");
  }

  return apiFetch<PurchasePlanResult>("/users/me/plan/purchase", {
    method: "POST",
    body: JSON.stringify({ plan }),
  });
}
